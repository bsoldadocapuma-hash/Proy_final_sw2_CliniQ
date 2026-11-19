"""Esquemas de entrada de la API (se corresponden con las tablas de la BD)."""
from typing import Optional, Union

from pydantic import BaseModel, Field


class UsuarioIn(BaseModel):
    edad: float = Field(..., ge=0, le=120, examples=[45])
    genero: str = Field(..., examples=["M"])
    grupo_sanguineo: Optional[str] = Field(None, examples=["O+"])
    peso_kg: float = Field(..., ge=2, le=400, examples=[85])
    altura_cm: float = Field(..., ge=40, le=250, examples=[175])


class SintomaIn(BaseModel):
    """tabla `sintoma` + `cita_sintoma`."""
    nombre: str = Field(..., examples=["Dolor de pecho"])
    severidad: Union[str, int, None] = Field(None, description="Leve / Moderada / Alta (o 1-3)", examples=["Alta"])
    observacion: Optional[str] = None
    descripcion: Optional[str] = None


class DiagnosticoIn(BaseModel):
    """tabla `diagnostico`."""
    descripcion: str = Field(..., examples=["Hipertensión arterial"])
    indicacion: Optional[str] = None


class MedicamentoBaseIn(BaseModel):
    """tabla `medicamento`."""
    nombre: str = Field(..., examples=["Losartán"])
    forma_farmaceutica: Optional[str] = None
    concentracion: Optional[str] = None


class MedicamentoIn(MedicamentoBaseIn):
    """Medicamento ya unido a su detalle (forma plana).

    Hoy el modelo solo usa `nombre` (lo convierte a su clase terapéutica); el resto
    se acepta para que el backend envíe el detalle completo sin recortarlo.
    """
    frecuencia: Optional[str] = None
    duracion: Optional[str] = None
    via_administracion: Optional[str] = None
    dosis: Optional[str] = None


class DetalleRecetaIn(BaseModel):
    """tabla `detalle_receta` (+ el `medicamento` al que apunta)."""
    medicamento: MedicamentoBaseIn
    frecuencia: Optional[str] = None
    duracion: Optional[str] = None
    via_administracion: Optional[str] = None
    dosis: Optional[str] = None


class RecetaIn(BaseModel):
    """tabla `receta`: una receta puede tener varios medicamentos."""
    fecha: Optional[str] = None
    detalles: list[DetalleRecetaIn] = Field(default_factory=list)


class CitaHistorialIn(BaseModel):
    """Una cita anterior del paciente. Aporta diagnósticos y medicamentos (no síntomas)."""
    fecha: Optional[str] = None
    diagnosticos: list[DiagnosticoIn] = Field(default_factory=list)
    recetas: list[RecetaIn] = Field(default_factory=list)
    medicamentos: list[MedicamentoIn] = Field(default_factory=list)


class PrediccionIn(BaseModel):
    """Un paciente puede tener muchos síntomas, diagnósticos y recetas: todas las listas admiten N elementos."""
    usuario: UsuarioIn
    sintomas: list[SintomaIn] = Field(default_factory=list, description="Síntomas de la cita actual")
    diagnosticos: list[DiagnosticoIn] = Field(default_factory=list)
    medicamentos: list[MedicamentoIn] = Field(default_factory=list, description="Forma plana")
    recetas: list[RecetaIn] = Field(default_factory=list, description="Forma de la BD: receta -> detalles")
    historial: list[CitaHistorialIn] = Field(default_factory=list, description="Citas anteriores")
