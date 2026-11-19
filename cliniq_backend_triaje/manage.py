"""Comandos del proyecto.

    python manage.py generar      # crea un dataset SINTÉTICO de prueba
    python manage.py validar      # revisa el CSV (avisos y errores)
    python manage.py entrenar     # entrena y guarda los modelos
    python manage.py evaluar      # validación cruzada y efecto del umbral
    python manage.py servir       # API en modo desarrollo (http://127.0.0.1:5000)
"""
import argparse


def main() -> None:
    p = argparse.ArgumentParser(description="Triaje ClinIQ")
    sub = p.add_subparsers(dest="cmd", required=True)

    g = sub.add_parser("generar", help="genera un dataset sintético de prueba")
    g.add_argument("--filas", type=int, default=4000)
    g.add_argument("--semilla", type=int, default=42)
    g.add_argument("--salida", default=None, help="por defecto: data/dataset_triaje.csv")

    sub.add_parser("validar", help="revisa el CSV")
    sub.add_parser("entrenar", help="entrena y guarda los modelos")
    sub.add_parser("evaluar", help="validación cruzada y umbrales")

    s = sub.add_parser("servir", help="API en modo desarrollo")
    s.add_argument("--host", default="127.0.0.1")
    s.add_argument("--port", type=int, default=5000)
    s.add_argument("--debug", action="store_true")

    a = p.parse_args()

    if a.cmd == "generar":
        from triaje.cli.generar_dataset import generar
        from triaje.config import Settings
        salida = a.salida or Settings.desde_entorno().dataset_path
        generar(a.filas, a.semilla, salida)
    elif a.cmd == "validar":
        from triaje.cli.validar import main as validar
        validar()
    elif a.cmd == "entrenar":
        from triaje.cli.entrenar import main as entrenar
        entrenar()
    elif a.cmd == "evaluar":
        from triaje.cli.evaluar import main as evaluar
        evaluar()
    elif a.cmd == "servir":
        from triaje.app import create_app
        from triaje.ml.almacen import ModeloNoDisponible
        try:
            app = create_app()
        except ModeloNoDisponible as e:
            raise SystemExit(str(e))
        app.run(host=a.host, port=a.port, debug=a.debug)


if __name__ == "__main__":
    main()
