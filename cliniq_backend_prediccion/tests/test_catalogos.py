from prediccion.catalogos import (CLASES, DIAGNOSTICOS, ENFERMEDADES, MEDICAMENTOS, NOMBRE_CLASE,
                                  SINTOMAS)
from prediccion.catalogos.perfiles import COMORBILIDAD, PERFILES
from prediccion.dominio.normalizacion import normalizar


def test_hay_20_enfermedades():
    assert len(ENFERMEDADES) == 20


def test_sintomas_sin_duplicados_normalizados():
    normalizados = [normalizar(s) for s in SINTOMAS]
    assert len(normalizados) == len(set(normalizados))


def test_todas_las_enfermedades_tienen_perfil():
    assert set(PERFILES) == set(ENFERMEDADES)


def test_perfiles_usan_solo_elementos_del_catalogo():
    for slug, p in PERFILES.items():
        for s in p["sintomas"]:
            assert s in SINTOMAS, f"{slug}: síntoma {s!r} no está en el catálogo"
        for d in p["dx"]:
            assert d in DIAGNOSTICOS, f"{slug}: diagnóstico {d!r} no está en el catálogo"
        for c in p["meds"]:
            assert c in CLASES, f"{slug}: clase {c!r} no existe"


def test_comorbilidades_referencian_enfermedades_validas():
    for principal, secundarias in COMORBILIDAD.items():
        assert principal in ENFERMEDADES
        assert set(secundarias) <= set(ENFERMEDADES)


def test_todas_las_clases_tienen_nombre_legible():
    assert set(CLASES) == set(NOMBRE_CLASE)


def test_medicamentos_normalizados_no_se_pisan():
    normalizados = [normalizar(m) for m in MEDICAMENTOS]
    assert len(normalizados) == len(set(normalizados))
