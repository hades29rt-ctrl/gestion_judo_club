from pydantic import BaseModel, EmailStr


class FamilleBase(BaseModel):
    nom_famille: str
    telephone: str | None = None
    email: EmailStr | None = None


class FamilleCreate(FamilleBase):
    pass


class FamilleUpdate(BaseModel):
    nom_famille: str | None = None
    telephone: str | None = None
    email: EmailStr | None = None


class FamilleOut(FamilleBase):
    id: int


class FamilleAvecEffectif(FamilleOut):
    nombre_adherents: int
