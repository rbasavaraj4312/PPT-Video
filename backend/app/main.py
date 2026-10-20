import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Automatically ensure repo root is in python search path
_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .api.speech import router as speech_router
from .services.voice_process import voice_process


@asynccontextmanager
async def lifespan(app):
    try:
        yield
    finally:
        await voice_process.close()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="JSON Presentation Builder API",
    description="Backend API for building and exporting presentations using pure JSON file storage and python-pptx",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(speech_router)


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check if frontend production build exists
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "service": "JSON Presentation Builder API",
            "status": "healthy",
            "endpoints": {
                "presentations": "/api/presentations",
                "docs": "/docs",
            },
        }


@app.get("/health")
def health():
    return {"status": "ok"}

