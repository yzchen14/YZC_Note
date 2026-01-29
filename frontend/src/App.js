import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import Settings from './components/Settings';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [notes, setNotes] = useState([]);
  const [notesTree, setNotesTree] = useState([]);
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [currentNote, setCurrentNote] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState('');

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
    loadSettings();
  }, []);

  // Update current note when currentNoteId changes
  useEffect(() => {
    if (currentNoteId && notes.length > 0) {
      const note = notes.find(n => n.id === currentNoteId);
      setCurrentNote(note || null);
    }
  }, [currentNoteId, notes]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const notesRes = await axios.get(`${API_BASE_URL}/notes/`);
      const treeRes = await axios.get(`${API_BASE_URL}/notes/tree`);
      console.log(treeRes)
      
      setNotes(notesRes.data);
      setNotesTree(treeRes.data);
      
      if (notesRes.data.length > 0 && !currentNoteId) {
        setCurrentNoteId(notesRes.data[0].id);
      }
      
      console.log('Notes loaded:', notesRes.data);
    } catch (error) {
      console.error('Error loading notes:', error);
      setStatus('Error loading notes');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/settings/`);
      setSettings(res.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSelectNote = (noteId) => {
    setCurrentNoteId(noteId);
    setStatus('');
  };

  const handleCreateNote = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/notes/`, {
        title: 'Untitled',
        content: ''
      });
      
      const newNote = res.data;
      setNotes([...notes, newNote]);
      setCurrentNoteId(newNote.id);
      setStatus('Note created');
      
      // Reload tree
      const treeRes = await axios.get(`${API_BASE_URL}/notes/tree`);
      setNotesTree(treeRes.data);
    } catch (error) {
      console.error('Error creating note:', error);
      setStatus('Error creating note');
    }
  };

  const handleCreateSubNote = async (parentNoteId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/notes/`, {
        title: 'Untitled',
        content: '',
        parent_id: parentNoteId
      });
      
      const newNote = res.data;
      setNotes([...notes, newNote]);
      setCurrentNoteId(newNote.id);
      setStatus('Sub-note created');
      
      // Reload tree
      const treeRes = await axios.get(`${API_BASE_URL}/notes/tree`);
      setNotesTree(treeRes.data);
    } catch (error) {
      console.error('Error creating sub-note:', error);
      setStatus('Error creating sub-note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note and all its children?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/notes/${noteId}`);
      setNotes(notes.filter(n => n.id !== noteId));
      
      if (currentNoteId === noteId) {
        const remaining = notes.filter(n => n.id !== noteId);
        setCurrentNoteId(remaining.length > 0 ? remaining[0].id : null);
      }
      
      setStatus('Note deleted');
      
      // Reload tree
      const treeRes = await axios.get(`${API_BASE_URL}/notes/tree`);
      setNotesTree(treeRes.data);
    } catch (error) {
      console.error('Error deleting note:', error);
      setStatus('Error deleting note');
    }
  };

  const handleSaveNote = async (title, content) => {
    if (!currentNoteId) return;

    try {
      const res = await axios.put(`${API_BASE_URL}/notes/${currentNoteId}`, {
        title: title.trim() || 'Untitled',
        content
      });
      
      const updatedNote = res.data;
      setNotes(notes.map(n => n.id === currentNoteId ? updatedNote : n));
      setCurrentNote(updatedNote);
      setStatus('Saved ✓');
      
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error saving note:', error);
      setStatus('Error saving note');
    }
  };

  const handleSettingsChange = async (newSettings) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/settings/`, newSettings);
      setSettings(res.data);
      setShowSettings(false);
      
      // Reload notes from new location
      await loadNotes();
      setStatus('Settings updated');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setStatus('Error updating settings');
    }
  };

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📝 YZC Notes</h1>
        <button 
          className="btn-settings" 
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          ⚙️
        </button>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <div className="sidebar-header">
            <button className="btn-new-note" onClick={handleCreateNote}>
              + New Note
            </button>
          </div>
          <NotesList 
            notes={notesTree}
            allNotes={notes}
            currentNoteId={currentNoteId}
            onSelectNote={handleSelectNote}
            onCreateSubNote={handleCreateSubNote}
          />
        </aside>

        <main className="editor">
          {currentNote ? (
            <NoteEditor 
              note={currentNote}
              onSave={handleSaveNote}
              onDelete={() => handleDeleteNote(currentNoteId)}
              onCreateSubNote={handleCreateSubNote}
            />
          ) : (
            <div className="no-note">
              <p>No note selected. Create a new note to get started!</p>
            </div>
          )}
          {status && <div className="status">{status}</div>}
        </main>
      </div>

      {showSettings && (
        <Settings 
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsChange}
        />
      )}
    </div>
  );
}

export default App;
