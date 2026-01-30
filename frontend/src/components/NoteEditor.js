import React, { useState, useEffect, useRef, useCallback } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import './NoteEditor.css';

function NoteEditor({ note, onSave, onDelete, onCreateSubNote }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);
  const vditorRef = useRef(null);
  const editorInstance = useRef(null);
  
  // Use refs to always have the current values in callbacks
  const titleRef = useRef('');
  const contentRef = useRef('');
  const noteIdRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Keep refs in sync with state/props
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    noteIdRef.current = note?.id;
  }, [note?.id]);

  const debouncedSave = useCallback((newTitle, newContent) => {
    console.log(`[NoteEditor] debouncedSave called for note ID: ${noteIdRef.current}, title: "${newTitle}"`);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const timeout = setTimeout(() => {
      // Use ref to get the CURRENT note ID, not a stale closure
      console.log(`[NoteEditor] Timer fired for note ID: ${noteIdRef.current}, calling onSave with title: "${newTitle}"`);
      onSave(noteIdRef.current, newTitle, newContent);
    }, 1000);

    saveTimeoutRef.current = timeout;
  }, [onSave]);

  // Update title and content when note changes
  useEffect(() => {
    console.log(`[NoteEditor] Note changed to ID: ${note?.id}, title: "${note?.title}"`);
    
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      titleRef.current = note.title;
      contentRef.current = note.content;
      
      // Update editor content if initialized
      if (editorInstance.current && editorInstance.current.setValue) {
        try {
          editorInstance.current.setValue(note.content);
        } catch (e) {
          console.warn('Error updating editor content:', e);
        }
      }
    }
    
    // Clear any pending saves when note changes
    if (saveTimeoutRef.current) {
      console.log(`[NoteEditor] Clearing pending save`);
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [note?.id]);

  // Initialize Vditor editor once
  useEffect(() => {
    if (vditorRef.current && !editorInstance.current) {
      try {
        editorInstance.current = new Vditor(vditorRef.current, {
          height: '100%',
          minHeight: 300,
          placeholder: 'Start typing...',
          cache: {
            enable: false
          },
          input: (value) => {
            setContent(value);
            contentRef.current = value;
            // Use refs to always get current title
            debouncedSave(titleRef.current, value);
          },
          toolbar: [
            'headings',
            'bold',
            'italic',
            'strike',
            'link',
            '|',
            'list',
            'ordered-list',
            'check',
            'outdent',
            'indent',
            '|',
            'quote',
            'line',
            'code',
            'inline-code',
            '|',
            'table',
            '|',
            'undo',
            'redo',
            '|',
            'fullscreen',
            'edit-mode'
          ]
        });
        
        // Set initial content after initialization
        if (note?.content) {
          setTimeout(() => {
            if (editorInstance.current && editorInstance.current.setValue) {
              editorInstance.current.setValue(note.content);
            }
          }, 100);
        }
      } catch (e) {
        console.error('Error initializing Vditor:', e);
      }
    }

    return () => {
      // Cleanup on unmount only
      if (editorInstance.current) {
        try {
          editorInstance.current.destroy();
        } catch (e) {
          console.warn('Error destroying editor:', e);
        }
        editorInstance.current = null;
      }
    };
  }, []);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    titleRef.current = newTitle;
    // Use ref for content since state might not be updated yet
    debouncedSave(newTitle, contentRef.current);
  };

  return (
    <div className="note-editor">
      <div className="editor-header">
        <input
          type="text"
          className="note-title"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title"
        />
        <div className="editor-buttons">
          <button className="btn-add-subnote" onClick={() => onCreateSubNote(note.id)} title="Create Sub-Note">
            + Sub-Note
          </button>
          <button className="btn-delete" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
      <div className="vditor-container" ref={vditorRef}></div>
    </div>
  );
}

export default NoteEditor;
