// Global state
let notes = [];
let notesTree = [];
let currentNoteId = null;
let saveTimeout = null;
let settings = {};
let expandedNodes = new Set();

// DOM elements (will be set after DOM loads)
let notesList;
let noteTitle;
let noteContent;
let status;
let settingsModal;
let notesPathInput;

// Initialize app
async function initApp() {
    console.log('=== INIT APP START ===');
    console.log('Initializing app...');
    
    // Get DOM elements
    notesList = document.getElementById('notesList');
    noteTitle = document.getElementById('noteTitle');
    noteContent = document.getElementById('noteContent');
    status = document.getElementById('status');
    settingsModal = document.getElementById('settingsModal');
    notesPathInput = document.getElementById('notesPath');
    
    console.log('DOM elements:');
    console.log('  notesList:', !!notesList);
    console.log('  noteTitle:', !!noteTitle);
    console.log('  noteContent:', !!noteContent);
    console.log('  status:', !!status);
    console.log('  settingsModal:', !!settingsModal);
    console.log('  notesPathInput:', !!notesPathInput);
    
    await loadSettings();
    console.log('Settings loaded');
    
    await loadNotes();
    console.log(`Notes loaded: ${notes.length} notes, tree: ${JSON.stringify(notesTree).substring(0, 100)}...`);
    
    console.log('Calling renderNotesTree...');
    renderNotesTree();
    console.log('renderNotesTree completed');
    
    if (notes.length > 0) {
        console.log(`Selecting first note: ${notes[0].id}`);
        selectNote(notes[0].id);
    } else {
        console.warn('No notes to select!');
    }
    
    console.log('=== INIT APP END ===');
}

// Load settings
async function loadSettings() {
    try {
        settings = await pywebview.api.get_settings();
        if (notesPathInput) {
            notesPathInput.value = settings.notes_directory || '';
        }
        console.log('Settings loaded');
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load all notes from backend
async function loadNotes() {
    try {
        console.log('loadNotes: Calling backend get_notes()...');
        notes = await pywebview.api.get_notes();
        console.log(`loadNotes: Got ${notes.length} notes from backend`);
        console.log('loadNotes: Notes:', notes);
        
        console.log('loadNotes: Calling backend get_notes_tree()...');
        notesTree = await pywebview.api.get_notes_tree();
        console.log(`loadNotes: Got tree with structure:`, notesTree);
        console.log(`Loaded ${notes.length} notes, tree has ${notesTree.length} root nodes`);
    } catch (error) {
        console.error('Error loading notes:', error);
        console.error('Error details:', error.message, error.stack);
    }
}

// Render notes as tree structure
function renderNotesTree() {
    console.log(`=== RENDER NOTES TREE START ===`);
    console.log(`notesTree:`, notesTree);
    console.log(`notesTree length:`, notesTree ? notesTree.length : 'undefined');
    console.log(`notesList element:`, notesList);
    
    if (!notesList) {
        console.error('CRITICAL: notesList element not found!');
        return;
    }
    
    console.log('Clearing notesList innerHTML...');
    notesList.innerHTML = '';
    
    if (!notesTree || notesTree.length === 0) {
        console.warn('No notes tree to render!');
        notesList.innerHTML = '<div style="padding: 10px; color: #999;">No notes yet</div>';
        return;
    }
    
    console.log(`Rendering ${notesTree.length} root nodes...`);
    notesTree.forEach((node, index) => {
        console.log(`Rendering root node ${index}: ${node.title} (id: ${node.id})`);
        renderTreeNode(node, notesList);
    });
    
    console.log(`=== RENDER NOTES TREE END ===`);
}

// Render a single tree node recursively
function renderTreeNode(node, parentElement, level = 0) {
    try {
        console.log(`renderTreeNode: Rendering "${node.title}" at level ${level}`);
        
        const treeItem = document.createElement('div');
        treeItem.className = 'note-tree-item';
        treeItem.id = `note-tree-${node.id}`;
        
        // Item container
        const itemDiv = document.createElement('div');
        itemDiv.className = `note-item ${node.id === currentNoteId ? 'active' : ''}`;
        itemDiv.style.marginLeft = (level * 16) + 'px';
        
        // Toggle button for children
        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'note-item-toggle';
        if (node.children && node.children.length > 0) {
            toggleBtn.textContent = '▼';
            if (!expandedNodes.has(node.id)) {
                toggleBtn.classList.add('collapsed');
            }
            toggleBtn.onclick = (e) => {
                e.stopPropagation();
                toggleNode(node.id);
            };
        } else {
            toggleBtn.textContent = '•';
            toggleBtn.style.opacity = '0.3';
        }
        
        // Content
        const contentDiv = document.createElement('span');
        contentDiv.className = 'note-item-content';
        contentDiv.style.cursor = 'pointer';
        contentDiv.onclick = (e) => {
            e.stopPropagation();
            console.log(`Clicked on note ${node.id}: ${node.title}`);
            selectNote(node.id);
        };
        
        const titleDiv = document.createElement('div');
        titleDiv.className = 'note-item-title';
        titleDiv.textContent = escapeHtml(node.title) || 'Untitled';
        contentDiv.appendChild(titleDiv);
        
        // Find note content for preview
        const noteData = notes.find(n => n.id === node.id);
        if (noteData && noteData.content) {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'note-item-preview';
            previewDiv.textContent = escapeHtml(noteData.content.substring(0, 30)) || 'Empty note';
            contentDiv.appendChild(previewDiv);
        }
        
        itemDiv.appendChild(toggleBtn);
        itemDiv.appendChild(contentDiv);
        treeItem.appendChild(itemDiv);
        parentElement.appendChild(treeItem);
        
        console.log(`renderTreeNode: Appended node "${node.title}" to parent`);
        
        // Children
        if (node.children && node.children.length > 0) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'note-item-children';
            if (!expandedNodes.has(node.id)) {
                childrenDiv.classList.add('hidden');
            }
            childrenDiv.id = `note-children-${node.id}`;
            
            console.log(`renderTreeNode: Rendering ${node.children.length} children for "${node.title}"`);
            node.children.forEach(child => {
                renderTreeNode(child, childrenDiv, level + 1);
            });
            
            treeItem.appendChild(childrenDiv);
        }
    } catch (error) {
        console.error(`renderTreeNode: Error rendering node:`, error);
        console.error('Error details:', error.message, error.stack);
    }
}

// Toggle node expansion
function toggleNode(nodeId) {
    if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
    } else {
        expandedNodes.add(nodeId);
    }
    renderNotesTree();
}

// Select and display a note
function selectNote(noteId) {
    console.log(`selectNote called with noteId: ${noteId}, type: ${typeof noteId}`);
    
    currentNoteId = noteId;
    const note = notes.find(n => {
        console.log(`Comparing n.id=${n.id} (${typeof n.id}) with noteId=${noteId} (${typeof noteId})`);
        return n.id === noteId || parseInt(n.id) === parseInt(noteId);
    });
    
    console.log('Found note:', note);
    
    if (note) {
        console.log(`Loading note: ${note.title}`);
        noteTitle.value = note.title;
        noteContent.value = note.content;
        renderNotesTree();
        status.textContent = 'Last saved: just now';
        status.classList.add('saved');
    } else {
        console.error(`Note not found! Notes array has ${notes.length} items`);
        console.log('Available note IDs:', notes.map(n => `${n.id}(${typeof n.id})`));
    }
}

// Create a new note
async function createNewNote() {
    try {
        const newNote = await pywebview.api.add_note('Untitled', '');
        notes.push(newNote);
        notesTree = await pywebview.api.get_notes_tree();
        selectNote(newNote.id);
        noteTitle.focus();
    } catch (error) {
        console.error('Error creating note:', error);
    }
}

// Delete current note
async function deleteCurrentNote() {
    if (!currentNoteId) return;
    
    if (!confirm('Are you sure you want to delete this note and all its children?')) return;
    
    try {
        await pywebview.api.delete_note(currentNoteId);
        notes = notes.filter(n => n.id !== currentNoteId);
        notesTree = await pywebview.api.get_notes_tree();
        currentNoteId = null;
        
        if (notes.length > 0) {
            selectNote(notes[0].id);
        } else {
            noteTitle.value = '';
            noteContent.value = '';
            renderNotesTree();
        }
    } catch (error) {
        console.error('Error deleting note:', error);
    }
}

// Save current note (with debounce)
async function saveCurrentNote() {
    if (!currentNoteId) return;
    
    const title = noteTitle.value.trim() || 'Untitled';
    const content = noteContent.value;
    
    try {
        await pywebview.api.update_note(currentNoteId, title, content);
        
        // Update local state
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            note.title = title;
            note.content = content;
        }
        
        renderNotesTree();
        status.textContent = 'Saved ✓';
        status.classList.add('saved');
        setTimeout(() => status.textContent = '', 3000);
    } catch (error) {
        console.error('Error saving note:', error);
        status.textContent = 'Error saving note';
        status.classList.remove('saved');
    }
}

// Debounced save on input
function onNoteChanged() {
    status.textContent = 'Saving...';
    status.classList.remove('saved');
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveCurrentNote, 1000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Settings functions
function openSettings() {
    if (settingsModal) {
        settingsModal.classList.add('show');
    }
}

function closeSettings() {
    if (settingsModal) {
        settingsModal.classList.remove('show');
    }
}

async function saveSettings() {
    const newPath = notesPathInput.value.trim();
    
    if (!newPath) {
        alert('Please enter a path');
        return;
    }
    
    try {
        const newSettings = await pywebview.api.update_settings({
            notes_directory: newPath
        });
        
        settings = newSettings;
        notesPathInput.value = settings.notes_directory;
        
        // Reload notes from new location
        await loadNotes();
        if (notes.length > 0) {
            selectNote(notes[0].id);
        } else {
            currentNoteId = null;
            noteTitle.value = '';
            noteContent.value = '';
            renderNotesTree();
        }
        
        status.textContent = 'Settings saved ✓';
        status.classList.add('saved');
        closeSettings();
        setTimeout(() => status.textContent = '', 3000);
    } catch (error) {
        console.error('Error saving settings:', error);
        alert('Error saving settings: ' + error);
    }
}

function browseFolder() {
    alert('Folder browsing is not available in this version. Please copy and paste the path directly.');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target === settingsModal) {
        closeSettings();
    }
});

// Initialize on window load
window.addEventListener('load', async function() {
    console.log('Window load event fired');
    await initApp();
    
    // Add event listeners after DOM is ready
    if (noteTitle) {
        noteTitle.addEventListener('input', onNoteChanged);
    }
    if (noteContent) {
        noteContent.addEventListener('input', onNoteChanged);
    }
});

// Also try DOMContentLoaded as a backup
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    // Ensure initApp runs even if it hasn't been called yet
    if (!notesList) {
        console.log('Initializing from DOMContentLoaded since notesList is null');
    }
});
