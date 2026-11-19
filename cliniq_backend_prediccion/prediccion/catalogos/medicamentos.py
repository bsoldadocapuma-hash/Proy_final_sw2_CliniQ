"""Medicamentos (tablas `medicamento` / `detalle_receta`) agrupados por clase terapéutica.

El modelo no aprende nombres comerciales sino la CLASE del medicamento: así
sigue funcionando aunque la clínica agregue medicamentos nuevos. Se compara
por contención del nombre normalizado, por eso "Losartán 50 mg" también coincide.
Un medicamento que no esté aquí se reporta en `advertencias` y no entra al modelo.
"""

MEDICAMENTOS = {
    # antihipertensivo
    "Losartán": "antihipertensivo", "Enalapril": "antihipertensivo",
    "Amlodipino": "antihipertensivo", "Atenolol": "antihipertensivo",
    "Captopril": "antihipertensivo",
    # diurético
    "Hidroclorotiazida": "diuretico", "Furosemida": "diuretico",
    # antidiabético
    "Metformina": "antidiabetico", "Glibenclamida": "antidiabetico",
    "Insulina": "antidiabetico", "Sitagliptina": "antidiabetico",
    # hipolipemiante
    "Atorvastatina": "hipolipemiante", "Simvastatina": "hipolipemiante",
    # inhibidor de ácido
    "Omeprazol": "inhibidor_acido", "Pantoprazol": "inhibidor_acido",
    "Ranitidina": "inhibidor_acido",
    # gastrointestinal / infeccioso
    "Loperamida": "antidiarreico", "Sales de rehidratación oral": "antidiarreico",
    "Amoxicilina": "antibiotico", "Azitromicina": "antibiotico",
    "Ciprofloxacino": "antibiotico", "Metronidazol": "antibiotico",
    # analgésicos
    "Paracetamol": "analgesico", "Ibuprofeno": "aine", "Diclofenaco": "aine",
    "Naproxeno": "aine", "Pregabalina": "analgesico_neuropatico",
    "Gabapentina": "analgesico_neuropatico", "Tramadol": "opioide",
    "Ciclobenzaprina": "relajante_muscular", "Tizanidina": "relajante_muscular",
    # respiratorio
    "Salbutamol": "broncodilatador", "Ipratropio": "broncodilatador",
    "Prednisona": "corticoide", "Budesonida": "corticoide",
    # dermatológico
    "Betametasona crema": "corticoide_topico", "Hidrocortisona crema": "corticoide_topico",
    "Clobetasol": "corticoide_topico", "Isotretinoína": "antiacneico",
    "Peróxido de benzoilo": "antiacneico", "Adapaleno": "antiacneico",
    "Cetirizina": "antihistaminico", "Loratadina": "antihistaminico",
    "Metotrexato": "inmunomodulador", "Tacrolimus": "inmunomodulador",
    "Calcipotriol": "inmunomodulador",
    # neuropsicológico
    "Sertralina": "psicofarmaco", "Escitalopram": "psicofarmaco",
    "Clonazepam": "psicofarmaco", "Metilfenidato": "psicofarmaco",
    # toxicología
    "Carbón activado": "antidoto", "Atropina": "antidoto",
    "N-acetilcisteína": "antidoto", "Naloxona": "antidoto",
}

CLASES = sorted(set(MEDICAMENTOS.values()))

# Texto legible para el campo `patrones_detectados`
NOMBRE_CLASE = {
    "antihipertensivo": "antihipertensivo", "diuretico": "diurético",
    "antidiabetico": "antidiabético", "hipolipemiante": "hipolipemiante",
    "inhibidor_acido": "inhibidor de ácido gástrico", "antidiarreico": "antidiarreico",
    "antibiotico": "antibiótico", "analgesico": "analgésico", "aine": "antiinflamatorio (AINE)",
    "analgesico_neuropatico": "analgésico neuropático", "opioide": "opioide",
    "relajante_muscular": "relajante muscular", "broncodilatador": "broncodilatador",
    "corticoide": "corticoide", "corticoide_topico": "corticoide tópico",
    "antiacneico": "antiacneico", "antihistaminico": "antihistamínico",
    "inmunomodulador": "inmunomodulador", "psicofarmaco": "psicofármaco",
    "antidoto": "antídoto",
}
