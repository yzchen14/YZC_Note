"""FastAPI backend for YZC Notes application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from app.models import NoteApp
from app import routes, settings

# Initialize FastAPI app
app = FastAPI(
    title="YZC Notes API",
    description="Note taking application with tree structure support",
    version="1.0.0"
)

# Add CORS middleware to allow React frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize NoteApp (backend logic)
note_app = NoteApp()

# Set the note app instance in route modules
routes.set_note_app(note_app)
settings.set_note_app(note_app)

# Include routers
app.include_router(routes.router, prefix="/api/notes", tags=["notes"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

@app.on_event("startup")
async def startup_event():
    """Initialize app on startup"""
    print(f"YZC Notes API started")
    print(f"Notes directory: {note_app.notes_dir}")
    print(f"Database: {note_app.db_path}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "notes_count": len(note_app.notes),
        "notes_dir": str(note_app.notes_dir)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

