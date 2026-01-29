import React, { useState } from 'react';
import './NotesList.css';

function NotesList({ notes, allNotes, currentNoteId, onSelectNote, onCreateSubNote }) {
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const noteData = allNotes.find(n => n.id === node.id);
    const preview = noteData?.content?.substring(0, 30) || '';
    

    return (
      <div key={node.id} className="note-tree-item">
        <div 
          className={`note-item ${node.id === currentNoteId ? 'active' : ''}`}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <span 
            className={`note-item-toggle ${node.children?.length > 0 ? '' : 'disabled'}`}
            onClick={() => node.children?.length > 0 && toggleNode(node.id)}
          >
            {node.children?.length > 0 ? (isExpanded ? '▼' : '▶') : '•'}
          </span>
          
          <span 
            className="note-item-content"
            onClick={() => onSelectNote(node.id)}
          >
            <div className="note-item-title">{node.title || 'Untitled'}</div>
            {preview && <div className="note-item-preview">{preview}</div>}
          </span>
          <button
            className="note-item-addsub"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubNote(node.id);
            }}
            title="Create sub-note"
          >
            ➕
          </button>
        </div>

        {node.children?.length > 0 && isExpanded && (
          <div className="note-item-children">
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="notes-list">
      {notes.length === 0 ? (
        <div className="empty-notes">No notes yet</div>
      ) : (
        notes.map(node => renderTreeNode(node))
      )}
    </div>
  );
}

export default NotesList;
