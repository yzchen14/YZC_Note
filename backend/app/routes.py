"""FastAPI routes for notes"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

# Global note app instance (will be injected from main.py)
note_app = None

class NoteCreate(BaseModel):
    title: str
    content: str = ""
    parent_id: Optional[int] = None

class NoteUpdate(BaseModel):
    title: str
    content: str

class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    parent_id: Optional[int]
    created: str
    modified: str

class TreeNodeResponse(BaseModel):
    id: int
    title: str
    parent_id: Optional[int]
    children: List['TreeNodeResponse'] = []

TreeNodeResponse.update_forward_refs()

def set_note_app(app):
    """Set the global note app instance"""
    global note_app
    note_app = app

@router.get("/", response_model=List[NoteResponse])
async def get_notes():
    """Get all notes"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    return note_app.get_notes()

@router.get("/tree", response_model=List[TreeNodeResponse])
async def get_notes_tree():
    """Get notes as tree structure"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    return note_app.get_notes_tree()

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(note_id: int):
    """Get a specific note"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    
    note = next((n for n in note_app.notes if n['id'] == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note

@router.post("/", response_model=NoteResponse)
async def create_note(note: NoteCreate):
    """Create a new note"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    
    new_note = note_app.add_note(note.title, note.content, note.parent_id)
    return new_note

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(note_id: int, note: NoteUpdate):
    """Update a note"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    
    updated_note = note_app.update_note(note_id, note.title, note.content)
    if not updated_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return updated_note

@router.delete("/{note_id}")
async def delete_note(note_id: int):
    """Delete a note"""
    if not note_app:
        raise HTTPException(status_code=500, detail="Note app not initialized")
    
    if not any(n['id'] == note_id for n in note_app.notes):
        raise HTTPException(status_code=404, detail="Note not found")
    
    note_app.delete_note(note_id)
    return {"message": "Note deleted successfully"}
