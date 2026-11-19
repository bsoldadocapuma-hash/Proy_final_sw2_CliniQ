"""Revisa el CSV: muestra avisos y errores sin entrenar."""
from triaje.ml.dataset import DatasetInvalido, cargar_dataset


def main() -> None:
    try:
        d = cargar_dataset()
    except DatasetInvalido as e:
        raise SystemExit(str(e))
    print(f"Dataset correcto: {len(d)} filas.")
