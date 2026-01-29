import React, { useState, useEffect } from 'react';
import './NoteEditor.css';

function NoteEditor({ note, onSave, onDelete, onCreateSubNote }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveTimeout, setSaveTimeout] = useState(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedSave(newTitle, content);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    debouncedSave(title, newContent);
  };

  const debouncedSave = (newTitle, newContent) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      onSave(newTitle, newContent);
    }, 1000);

    setSaveTimeout(timeout);
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
      <textarea
        className="note-content"
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing..."
      />
    </div>
  );
}

export default NoteEditor;
