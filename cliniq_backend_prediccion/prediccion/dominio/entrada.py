"""Aplana la consulta de un paciente a tres listas: síntomas, diagnósticos y medicamentos.

Un paciente puede tener muchos de cada uno. Se aceptan dos formas, combinables:

* Listas planas:   sintomas[], diagnosticos[], medicamentos[]
* Estructura de la BD:
    recetas[ {detalles[ {medicamento{nombre,...}, dosis, frecuencia, ...} ]} ]   (varios por paciente)
    historial[ {fecha, diagnosticos[], recetas[], medicamentos[]} ]              (citas anteriores)

Regla del modelo: los SÍNTOMAS son solo los de la cita actual (lo que presenta hoy);
de las citas anteriores (`historial`) se toman los DIAGNÓSTICOS y MEDICAMENTOS.
"""


def _detalle_a_medicamento(detalle: dict) -> dict:
    med = dict(detalle.get("medicamento") or {})
    if "nombre" in detalle and "nombre" not in med:  # detalle ya "plano"
        med["nombre"] = detalle["nombre"]
    for campo in ("frecuencia", "duracion", "via_administracion", "dosis"):
        if detalle.get(campo) is not None:
            med[campo] = detalle[campo]
    return med


def _medicamentos_de_recetas(recetas) -> list:
    return [_detalle_a_medicamento(d) for r in (recetas or []) for d in (r.get("detalles") or [])]


def aplanar(entrada: dict) -> dict:
    sintomas = list(entrada.get("sintomas") or [])
    diagnosticos = list(entrada.get("diagnosticos") or [])
    medicamentos = list(entrada.get("medicamentos") or [])
    medicamentos += _medicamentos_de_recetas(entrada.get("recetas"))
    for cita in entrada.get("historial") or []:
        diagnosticos += list(cita.get("diagnosticos") or [])
        medicamentos += list(cita.get("medicamentos") or [])
        medicamentos += _medicamentos_de_recetas(cita.get("recetas"))
    return {"usuario": entrada.get("usuario") or {}, "sintomas": sintomas,
            "diagnosticos": diagnosticos, "medicamentos": medicamentos}
