import unittest

from triaje import catalogos as cat
from triaje.app import create_app
from triaje.dominio.prioridad import gravedad
from tests.helpers import caso, settings_de_prueba


class TestAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(settings_de_prueba())
        cls.c = cls.app.test_client()

    def post(self, cuerpo, cliente=None, **kw):
        return (cliente or self.c).post("/api/v1/triaje", json=cuerpo, **kw)

    # ---- endpoints -----------------------------------------------------------
    def test_salud(self):
        j = self.c.get("/api/v1/salud").get_json()
        self.assertEqual(j["estado"], "ok")

    def test_catalogos(self):
        j = self.c.get("/api/v1/catalogos").get_json()
        self.assertGreaterEqual(len(j["motivos_consulta"]), 40)
        self.assertGreaterEqual(len(j["senales_alarma"]), 20)
        self.assertGreaterEqual(len(j["enfermedades"]), 20)

    def test_rutas_antiguas_siguen_funcionando(self):
        self.assertEqual(self.c.get("/salud").status_code, 200)
        self.assertEqual(self.c.post("/triaje", json=caso()).status_code, 200)

    def test_ruta_inexistente_responde_json(self):
        r = self.c.get("/nada")
        self.assertEqual(r.status_code, 404)
        self.assertIn("error", r.get_json())

    # ---- casos de uso -----------------------------------------------------------
    def test_respuesta_completa(self):
        j = self.post(caso()).get_json()
        for clave in ("prioridad", "area_derivacion", "confianza_prioridad", "origen",
                      "requiere_revision", "reglas_aplicadas", "mensaje", "aviso"):
            self.assertIn(clave, j)
        self.assertIn(j["prioridad"], cat.ORDEN_PRIORIDAD)
        self.assertIn(j["area_derivacion"], cat.AREAS)

    def test_hombre_y_menor_sin_embarazo(self):
        self.assertEqual(self.post(caso(sexo="M", embarazo="__quitar__")).status_code, 200)
        self.assertEqual(self.post(caso(edad="1_12", embarazo="__quitar__")).status_code, 200)

    def test_mujer_adulta_requiere_embarazo(self):
        self.assertEqual(self.post(caso(embarazo="__quitar__")).status_code, 400)

    def test_temperatura_vacia(self):
        for t in (None, "", "__quitar__"):
            self.assertEqual(self.post(caso(temperatura=t)).status_code, 200, t)

    def test_cada_motivo_funciona(self):
        for m in cat.MOTIVOS:
            extra = {} if m.sexo != "M" else dict(sexo="M", embarazo="__quitar__")
            r = self.post(caso(motivo_consulta=m.id, **extra))
            self.assertEqual(r.status_code, 200, (m.id, r.get_json()))

    def test_varios_motivos(self):
        r = self.post(caso(motivo_consulta=["fiebre", "tos_garganta", "dolor_cabeza"]))
        self.assertEqual(r.status_code, 200, r.get_json())
        self.assertIn(r.get_json()["prioridad"], cat.ORDEN_PRIORIDAD)

    def test_demasiados_motivos_o_ninguno(self):
        demasiados = [m.id for m in cat.MOTIVOS][: cat.MAX_MOTIVOS + 1]
        self.assertEqual(self.post(caso(motivo_consulta=demasiados)).status_code, 400)
        self.assertEqual(self.post(caso(motivo_consulta=[])).status_code, 400)

    def test_cada_alarma_respeta_su_nivel(self):
        for a in cat.ALARMAS:
            extra = {} if a.sexo != "M" else dict(sexo="M", embarazo="__quitar__")
            j = self.post(caso(senales_alarma=[a.id], **extra)).get_json()
            self.assertLessEqual(gravedad(j["prioridad"]), gravedad(a.nivel), a.id)
            if a.nivel == "rojo":
                self.assertEqual((j["prioridad"], j["origen"], j["area_derivacion"]),
                                 ("rojo", "regla_alarma", "emergencias"), a.id)

    def test_todas_las_enfermedades_a_la_vez(self):
        r = self.post(caso(enfermedades=[e.id for e in cat.ENFERMEDADES]))
        self.assertEqual(r.status_code, 200, r.get_json())

    def test_entradas_invalidas_dan_400(self):
        for cuerpo in (caso(intensidad=11), caso(motivo_consulta="inventado"),
                       caso(senales_alarma=["gripe"]), caso(sexo="M", embarazo="__quitar__",
                                                             motivo_consulta="sangrado_vaginal")):
            self.assertEqual(self.post(cuerpo).status_code, 400, cuerpo)

    def test_json_invalido_y_nan(self):
        r = self.c.post("/api/v1/triaje", data="no es json", content_type="application/json")
        self.assertEqual(r.status_code, 400)
        r = self.c.post("/api/v1/triaje", content_type="application/json",
                        data='{"intensidad": NaN}')
        self.assertEqual(r.status_code, 400)

    def test_cuerpo_demasiado_grande(self):
        r = self.post(caso(relleno="x" * 20000))
        self.assertEqual(r.status_code, 413)
        self.assertIn("error", r.get_json())

    def test_umbral_alto_marca_revision(self):
        c = create_app(settings_de_prueba(umbral_confianza=1.0)).test_client()
        self.assertTrue(self.post(caso(), cliente=c).get_json()["requiere_revision"])

    # ---- seguridad ------------------------------------------------------------------
    def test_api_key(self):
        c = create_app(settings_de_prueba(api_key="secreta")).test_client()
        self.assertEqual(self.post(caso(), cliente=c).status_code, 401)
        self.assertEqual(c.get("/api/v1/catalogos").status_code, 401)
        r = self.post(caso(), cliente=c, headers={"X-API-Key": "secreta"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(c.get("/api/v1/salud").status_code, 200)   # /salud queda abierto

    def test_cors(self):
        c = create_app(settings_de_prueba(cors_origenes=("https://portal.ejemplo.com",))).test_client()
        r = c.options("/api/v1/triaje", headers={
            "Origin": "https://portal.ejemplo.com",
            "Access-Control-Request-Method": "POST"})
        self.assertEqual(r.headers.get("Access-Control-Allow-Origin"), "https://portal.ejemplo.com")


if __name__ == "__main__":
    unittest.main()
