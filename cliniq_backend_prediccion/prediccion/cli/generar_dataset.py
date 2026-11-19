"""Genera un dataset SINTÉTICO pequeño para probar el pipeline.

Uso:
    python -m prediccion.cli.generar_dataset                       # 15 filas por enfermedad
    python -m prediccion.cli.generar_dataset --filas-por-enfermedad 50 --semilla 7
"""
import argparse
import random

import pandas as pd

from .. import config
from ..catalogos import DIAGNOSTICOS, GRUPOS_SANGUINEOS, MEDICAMENTOS, SINTOMAS, SLUGS
from ..catalogos.perfiles import COMORBILIDAD, PERFILES

_MEDS_POR_CLASE = {}
for _n, _c in MEDICAMENTOS.items():
    _MEDS_POR_CLASE.setdefault(_c, []).append(_n)

# Antecedentes comunes que NO definen una de las 20 enfermedades: simulan pacientes con
# varios diagnósticos y recetas (polimorbilidad) sin delatar la etiqueta.
_ANTECEDENTES = {"dislipidemia": "hipolipemiante", "reflujo": "inhibidor_acido",
                 "ansiedad": "psicofarmaco", "fractura": "aine"}

# Distribución aproximada de grupos sanguíneos (independiente de la enfermedad)
_PESOS_GS = [0.28, 0.05, 0.08, 0.02, 0.03, 0.01, 0.48, 0.05]


def _generar_fila(rng: random.Random, principal: str, con_comorbilidad: bool) -> dict:
    activas = [principal]
    if con_comorbilidad:
        for sec, p in COMORBILIDAD.get(principal, {}).items():
            if rng.random() < p:
                activas.append(sec)

    perfiles = [PERFILES[s] for s in activas]
    base = PERFILES[principal]
    edad = int(min(95, max(1, rng.gauss(*base["edad"]))))
    prom_imc = sum(p["imc"][0] for p in perfiles) / len(perfiles)
    imc = max(15.0, rng.gauss(prom_imc, base["imc"][1]))
    genero = "M" if rng.random() < base["prob_m"] else "F"
    altura = int(rng.gauss(172 if genero == "M" else 160, 7))
    peso = round(imc * (altura / 100) ** 2, 1)

    sintomas, dx, meds = {}, set(), set()
    for i, perfil in enumerate(perfiles):
        factor = 1.0 if i == 0 else 0.6  # las secundarias se expresan menos
        for nombre, (p, sev) in perfil["sintomas"].items():
            if rng.random() < p * factor:
                s = int(min(3, max(1, round(rng.gauss(sev, 0.7)))))
                sintomas[nombre] = max(sintomas.get(nombre, 0), s)
        for tag, p in perfil["dx"].items():
            if rng.random() < p * factor:
                dx.add(tag)
        for clase, p in perfil["meds"].items():
            if rng.random() < p * factor:
                meds.add(rng.choice(_MEDS_POR_CLASE[clase]))

    # Polimorbilidad: ~30 % de los pacientes arrastra 1-2 antecedentes y su medicación
    if rng.random() < 0.30:
        for tag in rng.sample(list(_ANTECEDENTES), rng.choice([1, 2])):
            dx.add(tag)
            if rng.random() < 0.7:
                meds.add(rng.choice(_MEDS_POR_CLASE[_ANTECEDENTES[tag]]))
    if rng.random() < 0.25:  # analgésico ocasional, muy común y poco informativo
        meds.add(rng.choice(_MEDS_POR_CLASE["analgesico"]))

    # Ruido: 0-2 síntomas irrelevantes y, rara vez, un diagnóstico no relacionado
    for nombre in rng.sample(SINTOMAS, rng.choice([0, 0, 1, 2])):
        sintomas.setdefault(nombre, rng.choice([1, 1, 2]))
    if rng.random() < 0.08:
        dx.add(rng.choice(list(DIAGNOSTICOS)))
    if not sintomas:  # toda consulta tiene al menos un síntoma
        nombre, (_, sev) = rng.choice(list(base["sintomas"].items()))
        sintomas[nombre] = int(round(sev))

    return {
        "edad": edad, "genero": genero,
        "grupo_sanguineo": rng.choices(GRUPOS_SANGUINEOS, _PESOS_GS)[0],
        "peso_kg": peso, "altura_cm": altura,
        "sintomas": "|".join(f"{n}:{s}" for n, s in sintomas.items()),
        "diagnosticos": "|".join(DIAGNOSTICOS[t]["texto_canonico"] for t in sorted(dx)),
        "medicamentos": "|".join(sorted(meds)),
        "enfermedades": "|".join(activas),
    }


def generar(filas_por_enfermedad: int, semilla: int, con_comorbilidad: bool = True) -> pd.DataFrame:
    rng = random.Random(semilla)
    filas = [_generar_fila(rng, s, con_comorbilidad) for s in SLUGS for _ in range(filas_por_enfermedad)]
    rng.shuffle(filas)
    return pd.DataFrame(filas)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--filas-por-enfermedad", type=int, default=15)
    ap.add_argument("--semilla", type=int, default=config.SEMILLA)
    ap.add_argument("--salida", default=str(config.RUTA_DATASET))
    ap.add_argument("--sin-comorbilidad", action="store_true")
    a = ap.parse_args()
    df = generar(a.filas_por_enfermedad, a.semilla, not a.sin_comorbilidad)
    df.to_csv(a.salida, index=False)
    print(f"Dataset sintético: {len(df)} filas -> {a.salida}")


if __name__ == "__main__":
    main()
