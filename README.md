# YZC Notes - React + FastAPI Note Taking App

A modern note-taking desktop application built with React frontend and FastAPI backend.

## Features

- ✅ Create, edit, and delete notes
- ✅ **Tree structure** - Notes can have parent-child relationships
- ✅ Auto-save functionality with visual feedback
- ✅ **Markdown format** - Notes stored as `.md` files
- ✅ **SQLite database** - Note index stored in `note_index.db`
- ✅ **Configurable storage location** - Choose where to save your notes
- ✅ Default storage in `AppData\Local\YZC_Note`
- ✅ Clean and intuitive tree-based UI
- ✅ Expandable/collapsible note tree in sidebar
- ✅ Settings page for customization
- ✅ React-based responsive frontend
- ✅ FastAPI backend with REST API

## Prerequisites

- Node.js 14+ (for React frontend)
- Python 3.7+
- pip

## Installation

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

2. Install Node.js dependencies:
```bash
cd frontend
npm install
cd ..
```

## Running the App

### Start Backend (Terminal 1)
```bash
cd backend
python main.py
```

Backend will run at `http://localhost:8000`
API documentation available at `http://localhost:8000/docs`

### Start Frontend (Terminal 2)
```bash
cd frontend
npm start
```

Frontend will run at `http://localhost:3000`

## Project Structure

```
YZC_Note/
├── main.py              # Backend application and PyWebView setup
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── frontend/
│   ├── index.html      # Main HTML structure
│   ├── style.css       # Styling
│   └── app.js          # Frontend JavaScript logic
└── backend/            # Reserved for future backend expansion
```

## How to Use

1. **Create a note** - Click **+ New Note** button
2. **Edit notes** - Enter title and content in the editor
3. **Auto-save** - Notes automatically save after 1 second of inactivity
4. **Tree navigation** - Click expand (▼) icons to show/hide sub-notes
5. **Delete note** - Click **Delete** button to remove current note and its children
6. **Switch notes** - Click on any note in the tree to view/edit it
7. **Settings** - Click ⚙️ icon to change storage location

## Tree Structure

Notes support a hierarchical tree structure:
- Each note can have a **parent note**
- Notes are displayed in a collapsible tree view in the sidebar
- Expanding/collapsing branches shows/hides child notes
- Parent-child relationship is stored in the SQLite database
- Deleting a note also deletes all its children

## Data Storage

- **Config location**: Script directory (`L:\Study\YZC_Note\config.ini`)
- **Notes location**: `C:\Users\[YourUsername]\AppData\Local\YZC_Note`
- **Database**: SQLite database at `note_index.db`
- **Format**: Markdown (`.md`) files
- **Customizable**: Change storage path in Settings page

### Storage Structure
```
Script Directory/
└── config.ini                          (App settings)

Configured Notes Directory/
├── note_index.db                       (SQLite database with note index)
├── 1.md                               (Note 1 content)
├── 2.md                               (Note 2 content)
└── 3.md                               (Note 3 content)
```

### Database Schema
```sql
CREATE TABLE notes (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    parent_id INTEGER,
    created TEXT NOT NULL,
    modified TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES notes(id)
)
```

- **id**: Unique note identifier
- **title**: Note title
- **parent_id**: ID of the parent note (NULL for root notes)
- **created**: Creation timestamp
- **modified**: Last modification timestamp

## Technologies Used

- **React** - Frontend UI framework
- **FastAPI** - Backend REST API framework
- **Python** - Backend
- **SQLite** - Note index database
- **Markdown** - Note storage format
- **ConfigParser** - Configuration file management
- **Axios** - HTTP client for frontend

## Settings

Access settings by clicking the ⚙️ icon in the top-right corner:

- **Notes Storage Path** - Change where your notes are saved
  - All notes will be migrated to the new location
  - Default: `%APPDATA%\YZC_Note` (AppData\Local\YZC_Note)

## Future Enhancements

- Create sub-notes directly (drag-drop or context menu)
- Rich text editor support
- Note categories/tags
- Search functionality with parent context
- Note export (PDF, HTML)
- Cloud sync
- Dark mode
- Syntax highlighting for code blocks
- Note sharing
- Collaborative editing
- Desktop app packaging (Electron or Pyinstaller)
