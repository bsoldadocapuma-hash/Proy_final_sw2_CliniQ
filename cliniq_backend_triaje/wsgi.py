"""Punto de entrada para producción (Azure App Service).

    gunicorn --bind=0.0.0.0:8000 --workers 2 --timeout 120 wsgi:app
"""
from triaje.app import create_app

app = create_app()
