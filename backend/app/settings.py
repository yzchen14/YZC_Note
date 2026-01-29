"""FastAPI routes for settings"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Global note app instance
note_app = None

class SettingsUpdate(BaseModel):
    notes_directory: str

class SettingsResponse(BaseModel):
    notes_directory: str

def set_note_app(app):
    """Set the global note app instance"""
    global note_app
    note_app = app

@router.get("/", response_model=SettingsResponse)
async def get_settings():
    """Get current settings"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    
    return note_app.get_settings()

@router.put("/", response_model=SettingsResponse)
async def update_settings(settings: SettingsUpdate):
    """Update settings"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    
    updated_settings = note_app.update_settings(settings.dict())
    return updated_settings
