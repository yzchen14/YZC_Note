import React, { useState } from 'react';
import './Settings.css';

function Settings({ settings, onClose, onSave }) {
  const [notesPath, setNotesPath] = useState(settings.notes_directory || '');

  const handleSave = () => {
    if (!notesPath.trim()) {
      alert('Please enter a path');
      return;
    }
    onSave({ notes_directory: notesPath });
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label htmlFor="notesPath">Notes Storage Path:</label>
            <div className="path-input-group">
              <input
                id="notesPath"
                type="text"
                className="path-input"
                value={notesPath}
                onChange={(e) => setNotesPath(e.target.value)}
                placeholder="Enter path to store notes"
              />
            </div>
            <small>Notes will be stored as Markdown files (.md) in this directory</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save-settings" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
