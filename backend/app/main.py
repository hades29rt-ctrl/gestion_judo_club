from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db_pool, close_db_pool
from app.routes_auth import router as auth_router
from app.routes_adherents import router as adherents_router
from app.routes_cours import router as cours_router
from app.routes_licences import router as licences_router
from app.routes_competitions import router as competitions_router, palmares_router
from app.routes_paiements import router as paiements_router
from app.routes_statistiques import router as statistiques_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db_pool()
    yield
    await close_db_pool()


app = FastAPI(title="Gestion Judo API", lifespan=lifespan)

# CORS : à restreindre à ton domaine frontend en production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(adherents_router)
app.include_router(cours_router)
app.include_router(licences_router)
app.include_router(competitions_router)
app.include_router(palmares_router)
app.include_router(paiements_router)
app.include_router(statistiques_router)


@app.get("/")
async def root():
    return {"status": "ok", "app": "gestion_judo"}
