"""Main entry point for Emergent Nations FastAPI Backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.routes import router as api_router
from app.orchestrator import orchestrator

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Backend simulation engine and agent orchestrator for Emergent Nations",
)

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes under /api
app.include_router(api_router, prefix="/api", tags=["simulation"])


@app.get("/")
async def root():
    """Welcome endpoint with links to documentation and status."""
    return {
        "project": "Emergent Nations",
        "description": "2D autonomous AI civilization simulation",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "version": settings.version,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)
