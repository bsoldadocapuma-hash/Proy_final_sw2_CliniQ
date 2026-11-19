import pytest

from prediccion.dominio.normalizacion import calcular_imc, normalizar, severidad_a_numero
from prediccion.dominio.riesgo import armar_respuesta, nivel_riesgo, nivel_riesgo_db
from prediccion.dominio.validacion import EntradaInvalida, validar_usuario
from prediccion.ml.caracteristicas import FEATURE_NAMES, extraer
from tests.helpers import ENTRADA_DIABETES, copia


def test_normalizar_quita_tildes_y_mayusculas():
    assert normalizar("  Pérdida DE  Peso ") == "perdida de peso"


@pytest.mark.parametrize("valor,esperado", [("Leve", 1), ("moderada", 2), ("ALTA", 3), (3, 3),
                                            (None, 2), ("desconocida", 2), ("1", 1), (7, 3)])
def test_severidad(valor, esperado):
    assert severidad_a_numero(valor) == esperado


def test_imc():
    assert calcular_imc(85, 175) == 27.8


@pytest.mark.parametrize("p,nivel,nivel_db", [(0.1, "Bajo", "Bajo"), (0.5, "Medio", "Medio"),
                                              (0.8, "Alto", "Alto"), (0.95, "Alto", "Crítico")])
def test_niveles(p, nivel, nivel_db):
    assert nivel_riesgo(p) == nivel
    assert nivel_riesgo_db(p) == nivel_db


def test_matriz_ordenada_y_limitada():
    r = armar_respuesta({"diabetes": 0.2, "hipertension": 0.9, "obesidad": 0.5}, "x", [], top_n=2)
    m = r["resultado_prediccion"]["matriz_probabilidades"]
    assert [x["enfermedad"] for x in m] == ["Hipertensión arterial", "Obesidad"]


def test_validar_usuario_rechaza_datos_invalidos():
    base = copia(ENTRADA_DIABETES)["usuario"]
    for cambio in ({"genero": "X"}, {"edad": 200}, {"peso_kg": 0}, {"grupo_sanguineo": "Z+"}):
        with pytest.raises(EntradaInvalida):
            validar_usuario({**base, **cambio})


def test_validar_usuario_acepta_genero_en_texto():
    assert validar_usuario({**ENTRADA_DIABETES["usuario"], "genero": "masculino"})["genero"] == "M"


def test_extraer_vector_completo_y_activos():
    e = extraer(ENTRADA_DIABETES)
    assert list(e.vector) == FEATURE_NAMES
    assert e.vector["sint__sed_excesiva"] == 3
    assert e.vector["dx__hipertension"] == 1
    assert e.vector["med__antihipertensivo"] == 1
    assert e.vector["gs__O+"] == 1
    assert e.advertencias == []


def test_extraer_reporta_elementos_desconocidos_sin_fallar():
    entrada = copia(ENTRADA_DIABETES)
    entrada["sintomas"].append({"nombre": "Síntoma inventado", "severidad": "Alta"})
    entrada["diagnosticos"].append({"descripcion": "Algo raro"})
    entrada["medicamentos"].append({"nombre": "Medicamento X"})
    assert len(extraer(entrada).advertencias) == 3


def test_extraer_sin_grupo_sanguineo():
    entrada = copia(ENTRADA_DIABETES)
    entrada["usuario"]["grupo_sanguineo"] = None
    assert sum(v for k, v in extraer(entrada).vector.items() if k.startswith("gs__")) == 0


# ---------- Pacientes con muchos síntomas, diagnósticos y recetas ----------
from prediccion.dominio.entrada import aplanar

MUCHOS = {
    "usuario": {"edad": 58, "genero": "F", "grupo_sanguineo": "A+", "peso_kg": 82, "altura_cm": 160},
    "sintomas": [{"nombre": n, "severidad": "Alta"} for n in ("Sed excesiva", "Micción frecuente", "Fatiga", "Visión borrosa")],
    "diagnosticos": [{"descripcion": "Hipertensión arterial"}, {"descripcion": "Dislipidemia"}],
    "recetas": [
        {"detalles": [{"medicamento": {"nombre": "Losartán"}, "dosis": "1 tab"},
                      {"medicamento": {"nombre": "Atorvastatina"}}]},
        {"detalles": [{"medicamento": {"nombre": "Paracetamol"}}]},
    ],
    "historial": [{"diagnosticos": [{"descripcion": "Obesidad"}, {"descripcion": "Hipertensión arterial"}],
                   "recetas": [{"detalles": [{"medicamento": {"nombre": "Losartán"}}]}],
                   "medicamentos": [{"nombre": "Metformina"}]}],
}


def test_aplanar_junta_recetas_e_historial():
    plano = aplanar(MUCHOS)
    assert len(plano["sintomas"]) == 4
    assert len(plano["diagnosticos"]) == 4      # 2 actuales + 2 del historial
    assert len(plano["medicamentos"]) == 5      # 3 de recetas + 1 de historial (receta) + 1 plano
    assert {m["nombre"] for m in plano["medicamentos"]} == {"Losartán", "Atorvastatina", "Paracetamol", "Metformina"}


def test_extraer_multiples_sin_duplicar():
    e = extraer(MUCHOS)
    # Losartán repetido en receta e historial y "Hipertensión" repetida cuentan una sola vez
    assert e.vector["n_sintomas"] == 4
    assert e.vector["n_diagnosticos"] == 3      # hipertension, dislipidemia, obesidad
    assert e.vector["n_medicamentos"] == 4
    assert e.vector["med__antihipertensivo"] == 1 and e.vector["med__antidiabetico"] == 1


def test_sintomas_del_historial_no_se_cuentan():
    entrada = copia(MUCHOS)
    entrada["historial"][0]["sintomas"] = [{"nombre": "Fiebre", "severidad": "Alta"}]
    assert extraer(entrada).vector["sint__fiebre"] == 0


def test_severidad_repetida_conserva_la_mayor():
    entrada = copia(ENTRADA_DIABETES)
    entrada["sintomas"] += [{"nombre": "Sed excesiva", "severidad": "Leve"}]
    e = extraer(entrada)
    assert e.vector["sint__sed_excesiva"] == 3 and e.vector["n_sintomas"] == 3


def test_advertencias_sin_repetir():
    entrada = copia(ENTRADA_DIABETES)
    entrada["sintomas"] += [{"nombre": "Inventado"}, {"nombre": "Inventado"}]
    assert len(extraer(entrada).advertencias) == 1
