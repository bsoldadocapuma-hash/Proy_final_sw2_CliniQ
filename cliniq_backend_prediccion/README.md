# ClinIQ – Backend de Predicción de Enfermedades

Servicio FastAPI + scikit-learn que, dado un paciente (datos personales, síntomas de la cita,
diagnósticos previos y medicamentos recetados), devuelve las enfermedades más probables.
**Es una herramienta de apoyo a la decisión clínica, no un diagnóstico.**

## Instalación y arranque

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows   (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt

python -m prediccion.cli.generar_dataset   # opcional: ya viene un dataset de 300 filas
python -m prediccion.cli.validar           # revisa el dataset
python -m prediccion.cli.entrenar          # genera models/modelo_prediccion.joblib
python -m prediccion.cli.evaluar           # validación cruzada (5 particiones)

uvicorn prediccion.app:app --reload --port 8001     # docs interactivas: http://localhost:8001/docs
pytest                                              # 39 tests
```

El zip ya incluye un modelo entrenado. Si tu versión de scikit-learn es distinta y aparece una
advertencia al cargarlo, vuelve a ejecutar `entrenar`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/prediccion-enfermedad` | Predicción (ver `docs/ejemplo_request.json` y `docs/ejemplo_response.json`) |
| GET | `/catalogos/enfermedades` · `/sintomas` · `/grupos-sanguineos` | Catálogos válidos |
| GET | `/salud` | Estado del servicio y del modelo |

## Entradas (de dónde sale cada dato)

Un paciente puede tener **muchos** síntomas, diagnósticos y recetas (y cada receta varios medicamentos):
todas las listas admiten N elementos.

| Campo | Tabla de la BD |
|---|---|
| `usuario` (edad, genero, grupo_sanguineo, peso_kg, altura_cm) | `usuario` (la edad se calcula desde `fecha_nacimiento`) |
| `sintomas[]` nombre + severidad | `sintoma` + `cita_sintoma` (**cita actual**) |
| `diagnosticos[]` descripcion | `diagnostico` |
| `recetas[].detalles[]` medicamento + dosis, frecuencia… | `receta` → `detalle_receta` → `medicamento` |
| `medicamentos[]` (forma plana, alternativa a `recetas`) | idem, ya unido |
| `historial[]` citas anteriores: diagnosticos, recetas | citas previas del paciente |

Ver `docs/ejemplo_request.json` (simple) y `docs/ejemplo_request_multiple.json` (varias recetas + historial).

Reglas al combinar todo:
- Los **síntomas** son solo los de la cita actual; del `historial` se toman **diagnósticos y medicamentos**.
- Lo repetido cuenta una vez: mismo síntoma varias veces → se queda la mayor severidad; mismo diagnóstico o
  medicamento en varias citas → una sola vez.
- El modelo también ve cuántos síntomas, diagnósticos y medicamentos distintos tiene el paciente
  (`n_sintomas`, `n_diagnosticos`, `n_medicamentos`), útil para pacientes con varias enfermedades a la vez.

Lo que el modelo no reconoce (síntoma, diagnóstico o medicamento fuera del catálogo) **no falla**:
se ignora y se informa en `advertencias`.

## Salida → tabla `Alerta_Riesgo`

- `nivel_riesgo` (Bajo / Medio / Alto) y `nivel_riesgo_db` (agrega **Crítico**) salen de la probabilidad
  máxima con los umbrales de `config.py` (0.40 / 0.70 / 0.90).
- `patrones_detectados`: factores de la consulta que más empujan la predicción principal. Se calcula
  quitando cada factor y midiendo cuánto baja la probabilidad.
- `matriz_probabilidades`: las `TOP_N` enfermedades (5 por defecto). Las probabilidades **no suman 1**:
  un paciente puede tener varias enfermedades a la vez (modelo multi-etiqueta).

## Estructura

```
data/        dataset_prediccion.csv (300 filas sintéticas)
docs/        ejemplos de request y response
models/      modelo entrenado + métricas
prediccion/
  api/         rutas y esquemas
  catalogos/   enfermedades, síntomas, diagnósticos, medicamentos, perfiles sintéticos
  cli/         generar_dataset, validar, entrenar, evaluar
  dominio/     normalización, validación, niveles de riesgo
  ml/          características, modelo, métricas, predictor
tests/
```

## Dataset: formato para tus datos reales

```
edad,genero,grupo_sanguineo,peso_kg,altura_cm,sintomas,diagnosticos,medicamentos,enfermedades
52,M,O+,88.0,172,Sed excesiva:3|Fatiga:2,Diabetes mellitus|Dislipidemia,Metformina|Atorvastatina,diabetes|hipertension
```

**Una fila por cita.** Todas las columnas con varios valores los separan con `|`:
- `sintomas`: los de esa cita, como `nombre:severidad(1-3)`.
- `diagnosticos` y `medicamentos`: todos los que el paciente tenía registrados hasta esa cita (incluye recetas anteriores).
- `enfermedades`: slugs de las enfermedades confirmadas en esa cita; la **primera es la principal**.
  Tendrás que mapear el texto libre de `diagnostico.descripcion` a las 20 categorías.

Para ampliar el sintético: `generar_dataset --filas-por-enfermedad 50`. Siempre ejecuta `validar` antes de `entrenar`.

## Decisiones de diseño y limitaciones (útiles para la defensa)

1. **Los datos son sintéticos.** Salen de reglas que yo definí en `perfiles.py`, no de pacientes reales.
   Las métricas (top-1 ≈ 0.97, F1 macro ≈ 0.92) miden qué tan bien el modelo aprende esas reglas, **no**
   su validez clínica. No las presentes como precisión diagnóstica; presenta el pipeline y deja la
   validación con datos reales de la clínica como trabajo futuro.
2. **Las probabilidades son puntuaciones, no frecuencias calibradas.** El modelo usa `class_weight="balanced"`,
   lo que las infla (casos claros llegan a 0.99). Úsalas para ordenar, no como "99 % de certeza".
3. **Regresión logística uno-contra-todos en vez de Random Forest.** Con ~15 casos por enfermedad, el RF
   dio F1 macro 0.61 (recall 0.52) y probabilidades que casi nunca pasan de 0.5; la logística dio 0.88 (recall 0.87) en esa comparación
   con el mismo top-1.
4. **Fuga de información intencional pero a tener en cuenta:** si el paciente ya tiene el diagnóstico
   "Diabetes" en su historial, el modelo lo usa como señal fuerte. Es útil para detectar comorbilidades,
   pero significa que parte de la "predicción" es reconocer lo ya diagnosticado.
5. `grupo_sanguineo` se incluye porque lo pediste, pero no tiene relación clínica con estas enfermedades;
   en el sintético se asigna al azar, así que el modelo lo ignora de forma efectiva.
6. Los campos `frecuencia`, `duracion`, `dosis` y `via_administracion` se aceptan pero **todavía no entran al
   modelo**; solo se usa la clase del medicamento.
7. Tu lista de 20 enfermedades no incluye enfermedades cardiovasculares (infarto, insuficiencia cardíaca),
   aunque el ejemplo de respuesta las muestra y la clínica tiene su fortaleza ahí. Para agregarla: una línea en
   `catalogos/enfermedades.py`, un perfil en `perfiles.py`, regenerar dataset y reentrenar.
