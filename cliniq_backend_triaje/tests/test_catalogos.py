import unittest

from triaje import catalogos as cat


class TestCatalogos(unittest.TestCase):
    def test_cantidades_minimas(self):
        self.assertGreaterEqual(len(cat.MOTIVOS), 40)
        self.assertGreaterEqual(len(cat.ALARMAS), 20)
        self.assertGreaterEqual(len(cat.ENFERMEDADES), 20)

    def test_ids_y_columnas_unicos(self):
        self.assertEqual(len(set(cat.FEATURES)), len(cat.FEATURES))

    def test_ninguna_no_es_un_id(self):
        ids = {a.id for a in cat.ALARMAS} | {e.id for e in cat.ENFERMEDADES}
        self.assertNotIn(cat.VALOR_NINGUNA, ids)

    def test_compatibilidad_con_el_csv_anterior(self):
        """Los ids y columnas de la versión anterior siguen existiendo."""
        antiguos_motivos = ["dolor_pecho", "dificultad_respirar", "fiebre", "dolor_abdominal",
                            "dolor_cabeza", "golpe_caida", "herida_sangrado",
                            "vomitos_diarrea", "tos_garganta", "otro"]
        self.assertTrue(set(antiguos_motivos) <= set(cat.MOTIVO_POR_ID))
        self.assertEqual(cat.COLUMNA_ALARMA["dificultad_respirar_grave"], "alarma_respirar")
        self.assertEqual(cat.COLUMNA_ALARMA["sangrado_no_para"], "alarma_sangrado")
        for e in ("diabetes", "hipertension", "corazon", "asma_epoc", "anticoagulantes"):
            self.assertIn(e, cat.COLUMNA_ENFERMEDAD)

    def test_json_para_el_frontend(self):
        j = cat.como_json()
        self.assertEqual(len(j["motivos_consulta"]), len(cat.MOTIVOS))
        self.assertEqual(len(j["senales_alarma"]), len(cat.ALARMAS))
        self.assertEqual(len(j["enfermedades"]), len(cat.ENFERMEDADES))
        self.assertEqual([o["id"] for o in j["embarazo"]["opciones"]], ["si", "no"])

    def test_motivos_son_casillas(self):
        self.assertEqual(len(cat.COLUMNA_MOTIVO), len(cat.MOTIVOS))
        self.assertNotIn("motivo_consulta", cat.FEATURES)
        self.assertTrue(set(cat.COLUMNA_MOTIVO.values()) <= set(cat.FEATURES))

    def test_huella_estable(self):
        self.assertEqual(cat.huella(), cat.huella())


if __name__ == "__main__":
    unittest.main()
