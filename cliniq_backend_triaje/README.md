# Triaje ClinIQ (API Flask)

Apoyo logístico de triaje: **reglas de seguridad + modelos Random Forest**
(prioridad y área de derivación). No es un diagnóstico médico.

## Estructura

```
triaje_flask/
├── manage.py               comandos: generar, validar, entrenar, evaluar, servir
├── wsgi.py                 entrada de producción (gunicorn wsgi:app)
├── requirements.txt
├── .env.example            variables de entorno (copiar a .env)
├── data/
│   └── dataset_triaje.csv  dataset (el incluido es SINTÉTICO, solo de prueba)
├── models/                 aquí se guarda modelos_triaje.joblib al entrenar
├── docs/
│   └── ejemplo_request.json
├── triaje/                 paquete principal
│   ├── app.py              fábrica de la app Flask (create_app)
│   ├── config.py           ajustes (variables de entorno)
│   ├── catalogos/          ★ motivos, alarmas, enfermedades, edades, áreas, mensajes
│   ├── dominio/            validación, reglas de seguridad, decisión final
│   ├── ml/                 dataset, pipeline, guardado del modelo, servicio
│   ├── api/                endpoints y seguridad (API key, CORS, errores)
│   └── cli/                generar dataset, entrenar, evaluar, validar
└── tests/                  41 pruebas automáticas
```

## Uso local (Python 3.10 o superior)

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows   (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt

python manage.py generar          # solo si NO tienes tu propio CSV (crea datos sintéticos)
python manage.py validar          # revisa el CSV
python manage.py entrenar         # crea models/modelos_triaje.joblib
python manage.py evaluar          # métricas, matriz de confusión, umbrales
python manage.py servir           # API en http://127.0.0.1:5000

python -m unittest discover -s tests -t .     # pruebas
```

## Catálogos (lo que acepta el formulario)

| Catálogo | Cantidad | Archivo |
|---|---|---|
| Motivos de consulta (se pueden marcar hasta 5) | 50 | `triaje/catalogos/motivos.py` |
| Señales de alarma | 27 (12 rojas, 15 naranjas) + `ninguna` | `triaje/catalogos/alarmas.py` |
| Enfermedades previas | 24 + `ninguna` | `triaje/catalogos/enfermedades.py` |

El frontend **no necesita copiar las listas**: las pide a `GET /api/v1/catalogos`
y dibuja los formularios con ellas. Las enfermedades del paciente se pueden guardar
como valores por defecto en el frontend y enviarse siempre en `enfermedades`.

**Para agregar un motivo, alarma o enfermedad:** añade una línea en su archivo,
agrega ejemplos al CSV y ejecuta `python manage.py entrenar`. La API se niega a
arrancar con un modelo entrenado con catálogos distintos.

Cada señal de alarma tiene un `nivel` (propuesta, **debe validarla un profesional**):
`rojo` deriva a emergencias sin consultar al modelo; `naranja` impide que el modelo
baje de naranja.

## Dataset

Columnas del CSV (109 variables + 2 etiquetas): `edad, sexo, embarazo, inicio, duracion,
evolucion, intensidad, temperatura`, una columna 0/1 por cada motivo de consulta
(`motivo_*`), por cada señal de alarma (`alarma_*`) y por cada enfermedad, más `prioridad` y
`area_derivacion`. Cada fila debe tener al menos un motivo marcado.
La lista exacta está en `triaje/catalogos/__init__.py` (`FEATURES`).

- Acepta separador `,` `;` o tabulador, y decimales con coma.
- `temperatura` vacía = no informada.
- Un CSV de la versión anterior (una sola columna `motivo_consulta`, 5 alarmas, 5 enfermedades)
  **sigue cargando**: `motivo_consulta` se convierte a columnas `motivo_*` y las casillas que
  falten se toman como 0, avisando en cada caso.
- ⚠ El `dataset_triaje.csv` incluido es **sintético**: sus etiquetas salen de una fórmula
  inventada. Reemplázalo por casos reales etiquetados por un profesional de salud.

## API

Base: `/api/v1` (las rutas antiguas `/triaje` y `/salud` siguen funcionando).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/salud` | Estado (siempre público) |
| GET | `/api/v1/catalogos` | Opciones para dibujar el formulario |
| POST | `/api/v1/triaje` | Clasifica un caso |

```bash
curl -X POST http://127.0.0.1:5000/api/v1/triaje -H "Content-Type: application/json" -d @docs/ejemplo_request.json
```

Respuesta:

```json
{
  "prioridad": "naranja",
  "area_derivacion": "medicina_general",
  "confianza_prioridad": 0.36,
  "origen": "modelo_confianza_baja",
  "requiere_revision": true,
  "reglas_aplicadas": [],
  "mensaje": "Su caso requiere atención prioritaria. Acuda a un centro de salud lo antes posible.",
  "aviso": "Resultado orientativo de apoyo logístico. No es un diagnóstico médico. ..."
}
```

Reglas de entrada: `motivo_consulta` es una **lista** de 1 a 5 motivos (también acepta un solo
texto). `embarazo` solo se exige a mujeres de 13 años o más (para hombres y
menores se completa solo). Algunos motivos/alarmas son de un solo sexo y se rechazan con
400 si no coinciden. `temperatura` es opcional. `senales_alarma` y `enfermedades` son
listas (`["ninguna"]` o vacía = ninguna; si viene `ninguna` junto a otra marca, manda la marca).

## Cómo decide

1. Alarma **roja** → `rojo` + emergencias (el modelo ni se consulta).
2. El modelo propone prioridad y confianza.
3. Si `confianza < UMBRAL_CONFIANZA` → sube **un nivel** (nunca a rojo) y devuelve
   `requiere_revision: true`.
4. Las reglas (alarmas naranjas y reglas clínicas combinadas, en `dominio/reglas.py`)
   **nunca bajan** la prioridad por debajo de su mínimo.

`origen` dice qué decidió: `regla_alarma`, `regla (...)`, `modelo_confianza_baja` o `modelo`.
La confianza de un Random Forest **no es una probabilidad calibrada**: úsala para el umbral
interno, no la muestres al paciente como "% de seguridad". Elige el umbral con la tabla de
`python manage.py evaluar` (compara sub-triaje, sobre-triaje y casos enviados a revisión).

## Variables de entorno

| Variable | Por defecto | Para qué |
|---|---|---|
| `UMBRAL_CONFIANZA` | `0.60` | Debajo de esto se sube un nivel |
| `API_KEY` | vacío | Si se define, exige cabecera `X-API-Key` (menos en `/salud`) |
| `CORS_ORIGENES` | vacío (apagado) | Orígenes del portal, separados por comas |
| `DATASET_PATH` / `MODELO_PATH` | `data/…` y `models/…` | Rutas |
| `LOG_LEVEL` | `INFO` | Nivel de logs |

## Despliegue en Azure App Service (Linux, Python)

1. Ejecuta `python manage.py entrenar`: imprime las líneas `scikit-learn==… pandas==…`;
   fíjalas en `requirements.txt`. Si Azure instala otra versión de scikit-learn, la API
   se niega a arrancar (evita predicciones raras con un modelo de otra versión).
2. Sube el proyecto **incluyendo `models/modelos_triaje.joblib`** (o entrena en Azure).
3. App settings: `SCM_DO_BUILD_DURING_DEPLOYMENT=true`, `API_KEY`, `CORS_ORIGENES`,
   `UMBRAL_CONFIANZA`.
4. Startup command: `gunicorn --bind=0.0.0.0:8000 --workers 2 --timeout 120 wsgi:app`
5. Activa *HTTPS Only* y usa `/api/v1/salud` como *Health check*.

Son datos de salud:
- Llama a la API desde el **backend** de tu portal; una `API_KEY` en el JavaScript del
  navegador queda expuesta.
- La API no registra el JSON del paciente, solo prioridad, origen y duración. Mantén ese
  criterio en cualquier log o telemetría que añadas.
- Reglas, niveles de alarma y etiquetas del dataset deben ser validados por un profesional de salud.
