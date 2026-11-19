import math
import unittest

from triaje import catalogos as cat
from triaje.dominio.decision import decidir_prioridad
from triaje.dominio.prioridad import gravedad, subir_un_nivel
from triaje.dominio.reglas import prioridad_minima_por_reglas
from triaje.dominio.validacion import validar_y_convertir
from tests.helpers import caso


def fila_de(**cambios):
    fila, error = validar_y_convertir(caso(**cambios))
    assert error is None, error
    return fila


class TestValidacion(unittest.TestCase):
    def test_embarazo_no_aplica_a_hombres_y_menores(self):
        self.assertEqual(fila_de(sexo="M", embarazo="__quitar__")["embarazo"], "no_aplica")
        self.assertEqual(fila_de(edad="1_12", embarazo="__quitar__")["embarazo"], "no_aplica")

    def test_mujer_adulta_requiere_embarazo(self):
        _, error = validar_y_convertir(caso(embarazo="__quitar__"))
        self.assertIn("embarazo", error)

    def test_temperatura_vacia_es_nan(self):
        for t in (None, "", "__quitar__"):
            self.assertTrue(math.isnan(fila_de(temperatura=t)["temperatura"]))

    def test_varios_motivos(self):
        fila = fila_de(motivo_consulta=["fiebre", "tos_garganta", "dolor_cabeza"])
        marcados = {m for m, col in cat.COLUMNA_MOTIVO.items() if fila[col] == 1}
        self.assertEqual(marcados, {"fiebre", "tos_garganta", "dolor_cabeza"})

    def test_un_motivo_como_texto_sigue_valiendo(self):
        fila = fila_de(motivo_consulta="fiebre")
        self.assertEqual(sum(fila[c] for c in cat.COLUMNA_MOTIVO.values()), 1)

    def test_motivos_repetidos_se_unifican(self):
        fila = fila_de(motivo_consulta=["fiebre", "fiebre"])
        self.assertEqual(sum(fila[c] for c in cat.COLUMNA_MOTIVO.values()), 1)

    def test_motivos_invalidos(self):
        malos = [[], None, "__quitar__", ["inventado"], ["fiebre", "inventado"], [1],
                 [m.id for m in cat.MOTIVOS][: cat.MAX_MOTIVOS + 1]]
        for m in malos:
            self.assertIsNotNone(validar_y_convertir(caso(motivo_consulta=m))[1], m)

    def test_sexo_incompatible_en_lista_de_motivos(self):
        _, e = validar_y_convertir(caso(sexo="M", embarazo="__quitar__",
                                        motivo_consulta=["fiebre", "sangrado_vaginal"]))
        self.assertIn("solo aplica", e)

    def test_motivo_o_alarma_de_otro_sexo(self):
        _, e = validar_y_convertir(caso(sexo="M", embarazo="__quitar__",
                                        motivo_consulta="sangrado_vaginal"))
        self.assertIn("solo aplica", e)
        _, e = validar_y_convertir(caso(sexo="M", embarazo="__quitar__",
                                        senales_alarma=["embarazo_sangrado_dolor"]))
        self.assertIn("solo aplica", e)

    def test_todas_las_casillas_se_aceptan(self):
        todas_enf = [e.id for e in cat.ENFERMEDADES]
        fila = fila_de(enfermedades=todas_enf)
        self.assertTrue(all(fila[c] == 1 for c in cat.COLUMNA_ENFERMEDAD.values()))

    def test_ninguna_con_otras_marcas_manda_la_marca(self):
        fila = fila_de(enfermedades=["ninguna", "diabetes"])
        self.assertEqual((fila["diabetes"], fila["hipertension"]), (1, 0))

    def test_entradas_invalidas(self):
        malos = [caso(intensidad=11), caso(temperatura=50), caso(temperatura="x"),
                 caso(edad="viejo"), caso(motivo_consulta="inventado"),
                 caso(senales_alarma="ninguna"), caso(senales_alarma=["gripe"]),
                 caso(enfermedades=[{"a": 1}]), caso(intensidad=True), [], "texto"]
        for cuerpo in malos:
            self.assertIsNotNone(validar_y_convertir(cuerpo)[1], cuerpo)


class TestReglas(unittest.TestCase):
    def test_alarma_roja_y_naranja(self):
        for a in cat.ALARMAS:
            sexo = a.sexo or "F"
            extra = {} if sexo == "F" else dict(sexo="M", embarazo="__quitar__")
            fila = fila_de(senales_alarma=[a.id], **extra)
            self.assertEqual(prioridad_minima_por_reglas(fila)[0], a.nivel, a.id)

    def test_gana_la_regla_mas_grave(self):
        fila = fila_de(senales_alarma=["desmayo_reciente", "vomito_con_sangre"])
        self.assertEqual(prioridad_minima_por_reglas(fila)[0], "rojo")

    def test_reglas_clinicas(self):
        casos = [
            dict(motivo_consulta="dolor_pecho", intensidad=9, inicio="de_golpe"),
            dict(edad="menor_1", sexo="M", embarazo="__quitar__", temperatura=38.5),
            dict(motivo_consulta="dificultad_respirar", evolucion="empeora"),
            dict(motivo_consulta="convulsion"),
            dict(embarazo="si", motivo_consulta="sangrado_vaginal"),
            dict(enfermedades=["anticoagulantes"], motivo_consulta="golpe_caida"),
        ]
        for c in casos:
            self.assertEqual(prioridad_minima_por_reglas(fila_de(**c))[0], "naranja", c)

    def test_reglas_con_varios_motivos(self):
        """Una regla aplica si el motivo está entre los marcados, aunque haya otros."""
        fila = fila_de(motivo_consulta=["fiebre", "dolor_pecho"], intensidad=9,
                       inicio="de_golpe")
        self.assertEqual(prioridad_minima_por_reglas(fila)[0], "naranja")
        fila = fila_de(motivo_consulta=["fiebre", "golpe_caida"],
                       enfermedades=["anticoagulantes"])
        self.assertEqual(prioridad_minima_por_reglas(fila)[0], "naranja")

    def test_sin_reglas(self):
        self.assertEqual(prioridad_minima_por_reglas(fila_de()), (None, None))

    def test_nan_no_rompe_la_regla_del_lactante(self):
        fila = fila_de(edad="menor_1", sexo="M", embarazo="__quitar__", temperatura=None)
        self.assertEqual(prioridad_minima_por_reglas(fila), (None, None))


class TestDecision(unittest.TestCase):
    def setUp(self):
        self.fila = fila_de()

    def test_confianza_baja_sube_un_nivel(self):
        d = decidir_prioridad(self.fila, "amarillo", 0.40, 0.6)
        self.assertEqual((d.prioridad, d.origen, d.requiere_revision),
                         ("naranja", "modelo_confianza_baja", True))
        self.assertEqual(decidir_prioridad(self.fila, "azul", 0.40, 0.6).prioridad, "verde")

    def test_confianza_alta_no_cambia(self):
        d = decidir_prioridad(self.fila, "verde", 0.95, 0.6)
        self.assertEqual((d.prioridad, d.origen, d.requiere_revision), ("verde", "modelo", False))

    def test_nunca_sube_a_rojo_por_confianza(self):
        d = decidir_prioridad(self.fila, "naranja", 0.30, 0.6)
        self.assertEqual((d.prioridad, d.requiere_revision), ("naranja", True))

    def test_regla_no_baja_la_prioridad(self):
        fila = fila_de(motivo_consulta="dificultad_respirar", evolucion="empeora")
        d = decidir_prioridad(fila, "verde", 0.95, 0.6)
        self.assertEqual(d.prioridad, "naranja")
        self.assertTrue(d.origen.startswith("regla"))

    def test_alarma_roja_ignora_al_modelo(self):
        fila = fila_de(senales_alarma=["labios_azulados"])
        d = decidir_prioridad(fila, "azul", 0.99, 0.6)
        self.assertEqual((d.prioridad, d.origen), ("rojo", "regla_alarma"))

    def test_subir_un_nivel(self):
        self.assertEqual(subir_un_nivel("azul"), "verde")
        self.assertEqual(subir_un_nivel("amarillo"), "naranja")
        self.assertEqual(subir_un_nivel("naranja"), "naranja")
        self.assertLess(gravedad("rojo"), gravedad("naranja"))


if __name__ == "__main__":
    unittest.main()
