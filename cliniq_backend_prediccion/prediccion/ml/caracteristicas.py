"""Convierte una consulta (usuario + síntomas + diagnósticos + medicamentos) en un vector numérico.

Entrenamiento y API usan EXACTAMENTE esta misma función, así no hay diferencias
entre lo que el modelo vio al entrenar y lo que recibe en producción.
"""
import re
from dataclasses import dataclass, field

from ..catalogos import CLASES, DIAGNOSTICOS, GRUPOS_SANGUINEOS, MEDICAMENTOS, NOMBRE_CLASE, SINTOMAS
from ..dominio.entrada import aplanar
from ..dominio.normalizacion import SEVERIDAD_TEXTO, calcular_imc, normalizar, severidad_a_numero
from ..dominio.validacion import validar_usuario

_SINTOMA_POR_NORM = {normalizar(n): n for n in SINTOMAS}
_SLUG_SINTOMA = {n: f"sint__{normalizar(n).replace(' ', '_')}" for n in SINTOMAS}
_MED_NORM = {normalizar(n): (n, c) for n, c in MEDICAMENTOS.items()}

FEATURE_NAMES = (
    ["edad", "genero_m", "imc", "peso_kg", "altura_cm", "n_sintomas", "n_diagnosticos", "n_medicamentos"]
    + [f"gs__{g}" for g in GRUPOS_SANGUINEOS]
    + [_SLUG_SINTOMA[n] for n in SINTOMAS]
    + [f"dx__{t}" for t in DIAGNOSTICOS]
    + [f"med__{c}" for c in CLASES]
)

IMC_NORMAL_REFERENCIA = 22.0


@dataclass
class Extraccion:
    """Resultado de procesar una consulta."""
    vector: dict
    activos: list = field(default_factory=list)       # (tipo, feature, etiqueta legible)
    advertencias: list = field(default_factory=list)
    imc: float = 0.0


def _avisar(lista: list, msg: str):
    if msg not in lista:
        lista.append(msg)


def _detectar_diagnosticos(texto: str) -> set:
    t = normalizar(texto)
    tags = set()
    for tag, info in DIAGNOSTICOS.items():
        for palabra in info["palabras"]:
            if re.search(rf"\b{re.escape(normalizar(palabra))}\b", t):
                tags.add(tag)
                break
    return tags


def extraer(entrada: dict) -> Extraccion:
    """Procesa una consulta (ver dominio/entrada.py para las formas aceptadas)."""
    entrada = aplanar(entrada)
    usuario = validar_usuario(entrada.get("usuario") or {})
    imc = calcular_imc(usuario["peso_kg"], usuario["altura_cm"])
    v = {n: 0.0 for n in FEATURE_NAMES}
    activos, adv = [], []
    meds_vistos = set()

    v["edad"] = usuario["edad"]
    v["genero_m"] = 1.0 if usuario["genero"] == "M" else 0.0
    v["imc"], v["peso_kg"], v["altura_cm"] = imc, usuario["peso_kg"], usuario["altura_cm"]
    if usuario["grupo_sanguineo"]:
        v[f"gs__{usuario['grupo_sanguineo']}"] = 1.0
    if imc >= 25 or imc < 18.5:
        activos.append(("imc", "imc", f"IMC {imc}"))

    severidades = {}  # un síntoma repetido cuenta una vez, con su mayor severidad
    for s in entrada.get("sintomas") or []:
        nombre = _SINTOMA_POR_NORM.get(normalizar(s.get("nombre")))
        if nombre is None:
            _avisar(adv, f"Síntoma no reconocido (ignorado): {s.get('nombre')!r}")
            continue
        severidades[nombre] = max(severidades.get(nombre, 0), severidad_a_numero(s.get("severidad")))
    for nombre, sev in severidades.items():
        feat = _SLUG_SINTOMA[nombre]
        v[feat] = float(sev)
        activos.append(("sintoma", feat, f"{nombre} {SEVERIDAD_TEXTO[sev]}"))

    for d in entrada.get("diagnosticos") or []:
        tags = _detectar_diagnosticos(d.get("descripcion", ""))
        if not tags:
            _avisar(adv, f"Diagnóstico no reconocido (ignorado): {d.get('descripcion')!r}")
        for tag in tags:
            feat = f"dx__{tag}"
            if v[feat] == 0:
                v[feat] = 1.0
                activos.append(("dx", feat, f"Historial {DIAGNOSTICOS[tag]['nombre']}"))

    for m in entrada.get("medicamentos") or []:
        nom = normalizar(m.get("nombre"))
        clave_med, clase = next(((clave, c) for clave, (_, c) in _MED_NORM.items() if clave in nom), (None, None))
        if clase is None:
            _avisar(adv, f"Medicamento no reconocido (ignorado): {m.get('nombre')!r}")
            continue
        meds_vistos.add(clave_med)
        feat = f"med__{clase}"
        if v[feat] == 0:
            v[feat] = 1.0
            activos.append(("med", feat, f"Tratamiento {NOMBRE_CLASE[clase]}"))

    v["n_sintomas"] = float(sum(1 for t, _, _ in activos if t == "sintoma"))
    v["n_diagnosticos"] = float(sum(1 for t, _, _ in activos if t == "dx"))
    v["n_medicamentos"] = float(len(meds_vistos))
    return Extraccion(vector=v, activos=activos, advertencias=adv, imc=imc)
