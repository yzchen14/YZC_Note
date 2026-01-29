#!/usr/bin/env python
"""Debug script to check if notes are loading correctly"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from main import NoteApp

# Create app instance
print("=" * 50)
print("Starting debug test...")
print("=" * 50)

app = NoteApp()

print("\n[Settings]")
print(f"Notes directory: {app.notes_dir}")
print(f"Database path: {app.db_path}")
print(f"Database exists: {app.db_path.exists()}")

print("\n[Notes Loaded]")
print(f"Total notes: {len(app.notes)}")
if app.notes:
    for note in app.notes:
        print(f"  - Note {note['id']}: {note['title']} (parent: {note.get('parent_id')})")
else:
    print("  No notes found!")

print("\n[Notes Tree]")
tree = app.get_notes_tree()
print(f"Root nodes: {len(tree)}")
if tree:
    for node in tree:
        print(f"  - {node['title']} (children: {len(node['children'])})")
else:
    print("  No root notes in tree!")

print("\n[Files in notes directory]")
if app.notes_dir.exists():
    files = list(app.notes_dir.glob('*'))
    for f in files:
        print(f"  - {f.name}")
else:
    print(f"  Directory does not exist: {app.notes_dir}")

print("\n" + "=" * 50)
print("Debug test complete!")
print("=" * 50)
