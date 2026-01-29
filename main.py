import webview
import json
import os
import configparser
import sqlite3
from pathlib import Path
from datetime import datetime

# Default settings
SCRIPT_DIR = Path(__file__).parent.resolve()
CONFIG_FILE = SCRIPT_DIR / 'config.ini'
DEFAULT_NOTES_DIR = Path(os.path.expandvars(r'%APPDATA%\YZC_Note'))

class NoteApp:
    """Backend API for the note-taking app"""
    
    def __init__(self):
        self.settings = self.load_settings()
        self.notes_dir = Path(self.settings['notes_directory'])
        self.notes_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.notes_dir / 'note_index.db'
        self.init_database()
        self.notes = self.load_notes()
    
    def load_settings(self):
        """Load settings from config.ini, create with defaults if not found"""
        config = configparser.ConfigParser()
        
        if CONFIG_FILE.exists():
            # Load existing settings
            try:
                config.read(CONFIG_FILE, encoding='utf-8')
                if 'settings' in config and 'notes_directory' in config['settings']:
                    notes_dir = config['settings']['notes_directory']
                    print(f"Loaded settings from config.ini: {notes_dir}")
                    return {
                        'notes_directory': notes_dir
                    }
            except Exception as e:
                print(f"Error loading settings: {e}")
        
        # Create config.ini with default settings if not found or invalid
        default_settings = {
            'notes_directory': str(DEFAULT_NOTES_DIR)
        }
        self.save_settings(default_settings)
        print(f"Created config.ini with default settings: {default_settings['notes_directory']}")
        return default_settings
    
    def save_settings(self, settings):
        """Save settings to config.ini in script directory"""
        SCRIPT_DIR.mkdir(parents=True, exist_ok=True)
        
        config = configparser.ConfigParser()
        config['settings'] = {
            'notes_directory': settings.get('notes_directory', str(DEFAULT_NOTES_DIR))
        }
        
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            config.write(f)
        
        self.settings = settings
        print(f"Settings saved to config.ini")
    
    def init_database(self):
        """Initialize SQLite database for notes index"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            # Create notes table with parent_id for tree structure
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    parent_id INTEGER,
                    created TEXT NOT NULL,
                    modified TEXT NOT NULL,
                    FOREIGN KEY (parent_id) REFERENCES notes(id)
                )
            ''')
            
            conn.commit()
            
            # Check if database is empty and migrate from old index.json if exists
            cursor.execute('SELECT COUNT(*) FROM notes')
            count = cursor.fetchone()[0]
            
            if count == 0:
                self._migrate_from_json(conn)
            
            conn.close()
            print(f"Database initialized at {self.db_path}")
        except Exception as e:
            print(f"Error initializing database: {e}")
    
    def _migrate_from_json(self, conn):
        """Migrate notes from old index.json format to SQLite"""
        index_file = self.notes_dir / 'index.json'
        
        if index_file.exists():
            try:
                with open(index_file, 'r', encoding='utf-8') as f:
                    notes_index = json.load(f)
                
                cursor = conn.cursor()
                for item in notes_index:
                    cursor.execute('''
                        INSERT INTO notes (id, title, parent_id, created, modified)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        item['id'],
                        item['title'],
                        None,  # No parent_id in old format
                        item.get('created', ''),
                        item.get('modified', '')
                    ))
                
                conn.commit()
                print(f"Migrated {len(notes_index)} notes from index.json to SQLite")
            except Exception as e:
                print(f"Error migrating from index.json: {e}")
    
    def load_notes(self):
        """Load notes from database and markdown files"""
        notes = []
        
        try:
            conn = sqlite3.connect(str(self.db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM notes ORDER BY parent_id, id')
            rows = cursor.fetchall()
            
            print(f"Loaded {len(rows)} notes from database")
            
            for row in rows:
                md_file = self.notes_dir / f"{row['id']}.md"
                content = ''
                
                if md_file.exists():
                    with open(md_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                
                notes.append({
                    'id': row['id'],
                    'title': row['title'],
                    'content': content,
                    'parent_id': row['parent_id'],
                    'created': row['created'],
                    'modified': row['modified']
                })
            
            conn.close()
        except Exception as e:
            print(f"Error loading notes: {e}")
            import traceback
            traceback.print_exc()
        
        return notes
        
        return notes
    
    def save_notes(self):
        """Save notes to markdown files and database"""
        self.notes_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            # Clear existing data
            cursor.execute('DELETE FROM notes')
            
            # Save all notes
            for note in self.notes:
                # Save markdown file
                md_file = self.notes_dir / f"{note['id']}.md"
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(note['content'])
                
                # Save to database
                cursor.execute('''
                    INSERT INTO notes (id, title, parent_id, created, modified)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    note['id'],
                    note['title'],
                    note.get('parent_id'),
                    note.get('created'),
                    note.get('modified')
                ))
            
            conn.commit()
            conn.close()
            print(f"Notes saved to database and markdown files")
        except Exception as e:
            print(f"Error saving notes: {e}")
    
    def get_notes(self):
        """Return all notes with tree structure"""
        # Ensure all IDs are integers for consistency
        for note in self.notes:
            if not isinstance(note['id'], int):
                note['id'] = int(note['id'])
        return self.notes
    
    def get_notes_tree(self):
        """Return notes as a tree structure"""
        def build_tree(parent_id=None):
            tree = []
            for note in self.notes:
                if note.get('parent_id') == parent_id:
                    tree.append({
                        'id': note['id'],
                        'title': note['title'],
                        'parent_id': note.get('parent_id'),
                        'children': build_tree(note['id'])
                    })
            return tree
        
        tree = build_tree()
        print(f"Built tree with {len(tree)} root nodes from {len(self.notes)} total notes")
        print(f"Note IDs: {[n['id'] for n in self.notes]}")
        return tree
    
    def add_note(self, title, content, parent_id=None):
        """Add a new note"""
        note_id = max([n['id'] for n in self.notes], default=0) + 1
        now = datetime.now().isoformat()
        note = {
            'id': note_id,
            'title': title,
            'content': content,
            'parent_id': parent_id,
            'created': now,
            'modified': now
        }
        self.notes.append(note)
        self.save_notes()
        return note
    
    def update_note(self, note_id, title, content):
        """Update an existing note"""
        for note in self.notes:
            if note['id'] == note_id:
                note['title'] = title
                note['content'] = content
                note['modified'] = datetime.now().isoformat()
                self.save_notes()
                return note
        return None
    
    def delete_note(self, note_id):
        """Delete a note and its children"""
        # Delete all descendants
        def delete_recursive(nid):
            # Find all children
            children = [n['id'] for n in self.notes if n.get('parent_id') == nid]
            for child_id in children:
                delete_recursive(child_id)
            # Delete the note itself
            self.notes = [n for n in self.notes if n['id'] != nid]
            md_file = self.notes_dir / f"{nid}.md"
            if md_file.exists():
                md_file.unlink()
        
        delete_recursive(note_id)
        self.save_notes()
        return True
    
    def get_settings(self):
        """Return current settings"""
        return self.settings
    
    def update_settings(self, settings):
        """Update settings"""
        # Validate and update notes directory
        new_dir = Path(settings.get('notes_directory', str(DEFAULT_NOTES_DIR)))
        new_dir.mkdir(parents=True, exist_ok=True)
        
        # If directory changed, migrate notes
        if str(new_dir) != str(self.notes_dir):
            self._migrate_notes(new_dir)
            self.notes_dir = new_dir
            self.db_path = self.notes_dir / 'note_index.db'
            self.init_database()
            self.notes = self.load_notes()
        
        settings['notes_directory'] = str(new_dir)
        self.save_settings(settings)
        return self.settings
    
    def _migrate_notes(self, new_dir):
        """Migrate notes to new directory"""
        new_dir.mkdir(parents=True, exist_ok=True)
        
        # Move all markdown files
        for note in self.notes:
            old_file = self.notes_dir / f"{note['id']}.md"
            new_file = new_dir / f"{note['id']}.md"
            if old_file.exists():
                with open(old_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                with open(new_file, 'w', encoding='utf-8') as f:
                    f.write(content)
        
        # Create new database at new location
        new_db_path = new_dir / 'note_index.db'
        try:
            conn = sqlite3.connect(str(new_db_path))
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY,
                    title TEXT NOT NULL,
                    parent_id INTEGER,
                    created TEXT NOT NULL,
                    modified TEXT NOT NULL,
                    FOREIGN KEY (parent_id) REFERENCES notes(id)
                )
            ''')
            
            # Save notes to new database
            for note in self.notes:
                cursor.execute('''
                    INSERT INTO notes (id, title, parent_id, created, modified)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    note['id'],
                    note['title'],
                    note.get('parent_id'),
                    note.get('created'),
                    note.get('modified')
                ))
            
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error migrating database: {e}")

if __name__ == '__main__':
    app = NoteApp()
    
    # Create the webview window
    webview.create_window(
        title='YZC Notes',
        url='frontend/index.html',
        js_api=app,
        width=1000,
        height=700,
        resizable=True
    )
    
    webview.start()
