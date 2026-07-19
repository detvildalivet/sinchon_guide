from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import recommendations, routes, users, visits

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sinchon Guide API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(visits.router)
app.include_router(recommendations.router)
app.include_router(routes.router)


@app.get("/")
def root():
    return {"name": "Sinchon Guide API", "docs": "/docs"}
