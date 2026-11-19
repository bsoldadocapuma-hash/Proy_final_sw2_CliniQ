import pytest
from fastapi.testclient import TestClient

from prediccion import config
from prediccion.app import app
from tests.helpers import ENTRADA_ACNE, ENTRADA_DIABETES, copia

client = TestClient(app)
requiere_modelo = pytest.mark.skipif(
    not config.RUTA_MODELO.exists(), reason="Falta el modelo: python -m prediccion.cli.entrenar")


def test_catalogos():
    assert len(client.get("/catalogos/enfermedades").json()) == 20
    assert "Fiebre" in client.get("/catalogos/sintomas").json()
    assert "O+" in client.get("/catalogos/grupos-sanguineos").json()


@requiere_modelo
def test_salud():
    assert client.get("/salud").json()["modelo_cargado"] is True


@requiere_modelo
def test_prediccion_formato_de_respuesta():
    r = client.post("/prediccion-enfermedad", json=ENTRADA_DIABETES)
    assert r.status_code == 200
    res = r.json()["resultado_prediccion"]
    assert {"diagnostico_principal", "nivel_riesgo", "probabilidad_maxima", "matriz_probabilidades",
            "datos_para_tabla_alerta_riesgo", "advertencias", "aviso"} <= set(res)
    assert set(res["datos_para_tabla_alerta_riesgo"]) == {"nivel_riesgo_db", "patrones_detectados"}
    probs = [m["probabilidad"] for m in res["matriz_probabilidades"]]
    assert probs == sorted(probs, reverse=True)
    assert all(0 <= p <= 1 for p in probs)
    assert res["probabilidad_maxima"] == probs[0]


@requiere_modelo
def test_prediccion_sensata_en_casos_claros():
    assert client.post("/prediccion-enfermedad", json=ENTRADA_DIABETES).json()[
        "resultado_prediccion"]["diagnostico_principal"] == "Diabetes"
    assert client.post("/prediccion-enfermedad", json=ENTRADA_ACNE).json()[
        "resultado_prediccion"]["diagnostico_principal"] == "Acné"


@requiere_modelo
def test_elementos_desconocidos_no_rompen_la_api():
    entrada = copia(ENTRADA_DIABETES)
    entrada["sintomas"].append({"nombre": "Inventado", "severidad": "Alta"})
    r = client.post("/prediccion-enfermedad", json=entrada)
    assert r.status_code == 200
    assert len(r.json()["resultado_prediccion"]["advertencias"]) == 1


def test_entrada_invalida_devuelve_422():
    entrada = copia(ENTRADA_DIABETES)
    entrada["usuario"]["genero"] = "X"
    assert client.post("/prediccion-enfermedad", json=entrada).status_code == 422
    del entrada["usuario"]["edad"]
    assert client.post("/prediccion-enfermedad", json=entrada).status_code == 422


@requiere_modelo
def test_paciente_con_muchas_recetas_e_historial():
    import json
    from pathlib import Path
    ruta = Path(__file__).resolve().parent.parent / "docs" / "ejemplo_request_multiple.json"
    r = client.post("/prediccion-enfermedad", json=json.loads(ruta.read_text(encoding="utf-8")))
    assert r.status_code == 200
    res = r.json()["resultado_prediccion"]
    assert res["diagnostico_principal"] == "Diabetes"
    nombres = [m["enfermedad"] for m in res["matriz_probabilidades"]]
    assert "Hipertensión arterial" in nombres
