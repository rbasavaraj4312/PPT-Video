# JSON-Driven Presentation Studio 🎨📊

An Excalidraw / tldraw-inspired presentation builder built with **FastAPI**, **React**, and **Tailwind CSS**. All presentations are stored and managed purely as structured **JSON files** without any database, and export directly to native Microsoft PowerPoint (`.pptx`) presentations.

---

## Images on slides

Paste an image with **Cmd/Ctrl+V**, drag an image onto the canvas, or use the
toolbar's **Insert image** button. Select it to open **Design → Image** controls:
crop with draggable corners or aspect presets, resize with an optional aspect
lock, rotate, flip, adjust opacity/brightness/contrast/saturation, or replace it.
Crop and adjustments preserve the source image and support undo/redo and reset.
Images are embedded in presentation JSON and appear in slide thumbnails, preview,
MP4, and PowerPoint exports. PNG, JPEG, WebP, and GIF are accepted (GIF imports as
a still image); each import must be under 10 MB. Large images are reduced to a
maximum 4096-pixel edge to limit memory use.

## Local voice cloning and captions

The unified editor includes a docked **Design / Voice / Captions** inspector and
a synchronized timeline for slides, audio waveforms, captions, and transitions.
Write scripts, record or upload voices, generate narration, and preview playback
in the canvas. Select an element and use **Design → Reveal with narration** to
link its appearance to a spoken word. Grouped elements can reveal together, with
the same timing in preview and MP4; reveal edits never regenerate speech.
Voice profiles use OmniVoice through MLX Audio by default, reusing
the local `k2-fsa/OmniVoice` model when already installed. Pocket TTS is an optional
installation. Both support word highlighting and narrated MP4/SRT export. Speech dependencies
are optional; models run on demand in separate processes for limited-memory Macs.

See [setup, Mac benchmarking, and usage](docs/narration.md). Actual OmniVoice
inference requires Apple Silicon; the pretrained weights have noncommercial terms.

## 🏗 Architecture

```
                    ┌────────────────────────────────────────┐
                    │      React + Tailwind UI (Canvas)      │
                    │   Text • Shapes • Lines • Arrows • Palettes │
                    └───────────────────┬────────────────────┘
                                        │ REST API (JSON)
                                        ▼
                    ┌────────────────────────────────────────┐
                    │            FastAPI Backend             │
                    │       (Routes, Validation, Exporter)    │
                    └───────────────┬────────────┬───────────┘
                                    │            │
            ┌───────────────────────┴─┐        ┌─┴───────────────────────┐
            ▼                         ▼        ▼                         ▼
   backend/storage/*.json        python-pptx Engine               Generated .pptx
(Pure filesystem persistence) (Converts canvas to slides)      (Standard PowerPoint)
```

---

## 🚀 Key Features

* **Strictly Pure JSON Storage**: Zero database. Presentations are stored directly as `.json` files in `backend/storage/`. You can view, edit, version-control, or migrate them anytime.
* **Excalidraw / tldraw Inspired Canvas**:
  * **Tools**: Select (`V`), Rectangle (`R`), Rounded Rectangle (`U`), Circle / Ellipse (`O`), Line (`L`), Arrow (`A`), Text (`T`).
  * **Interactive Controls**: Click & drag creation, 8-handle bounding-box resizing, drag-to-move, and double-click inline text editing.
  * **Styling**: Fill color, stroke color, stroke width (1–8px), stroke styles (solid & dashed), arrowhead configuration (start, end, both).
  * **Slide Management**: Add slides, duplicate slides, delete slides, reorder slides, and customize slide background colors.
  * **History**: Full Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`) stack.
* **PowerPoint-Style Zoom, Pan & Off-Slide Pasteboard 🔍**:
  * Smooth Zoom in/out (20% to 300%) via `Ctrl + Wheel`, trackpad pinch, keyboard shortcuts (`Ctrl +`, `Ctrl -`, `Ctrl 0`), and floating HUD controls.
  * Pan the pasteboard with normal scroll wheel, middle-click drag, Hand tool (`H`), or by holding `Spacebar` to grab and pan.
  * Fit to Window button (`Ctrl + 0`) centers the slide with generous pasteboard staging margins.
  * Off-slide elements (used for incoming/outgoing Morph animations) are 100% visible and interactive on the pasteboard.
* **Morph Transitions & MP4 Video Export 🎬**:
  * **Video Exporter**: Export entire presentations to standard H.264 `.mp4` video (via Pillow + bundled standalone `ffmpeg`).
  * **Morph Transition Engine**: Smoothstep easing (`3t² - 2t³`) interpolates positions ($x, y$), dimensions ($w, h$), background colors, stroke colors, font sizes, line endpoints, and opacity between paired elements across slides.
  * **Element Pairing**: Shapes can be explicitly linked across slides using a shared `morph_id` tag in the Property Panel, or automatically paired by element ID and type/content.
  * **Configurable Slide Durations**: Set slide transition type (`morph`, `fade`, `none`), transition duration (e.g. 1.0s), and hold duration (e.g. 3.0s) per slide.
  * **Native PowerPoint Morph**: Native `.pptx` export automatically injects OpenXML `<p16:morph option="byObject"/>` transition tags so Morph animations play natively when presented in Microsoft PowerPoint / Office 365.
* **Interactive Slide Show Preview Mode 📽️**:
  * One-click "Slide Show" button or `F5` shortcut to preview presentation in immersive fullscreen mode.
  * Real-time Morph & Fade transition animations in the browser powered by `requestAnimationFrame` matching the video export engine.
  * Keyboard navigation (`ArrowRight`, `ArrowDown`, `Space`, `Enter` to advance; `ArrowLeft`, `ArrowUp` to go back; `Esc` to exit).
  * Autoplay feature (`P` key) that automatically steps through slides using configured slide durations.
  * Floating auto-hiding controls HUD, slide progress bar, and fullscreen toggle (`F`).
* **Native PowerPoint Export (`.pptx`)**:
  * One-click download of native PowerPoint files using `python-pptx`.
  * Preserves canvas layout, shapes, text formatting, dashed borders, and directional OpenXML arrowheads.
* **Raw JSON Inspector**: View and copy the exact JSON data powering any presentation in real-time.

---

## 📁 Project Structure

```
PPT/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py              # REST endpoints (CRUD, PPTX export)
│   │   ├── models/
│   │   │   └── presentation.py        # Pydantic models (Shapes, Text, Slides, Pres)
│   │   ├── services/
│   │   │   ├── pptx_exporter.py       # JSON -> python-pptx conversion engine
│   │   │   └── storage.py             # Filesystem JSON storage service
│   │   └── main.py                    # FastAPI app entrypoint & static mounting
│   ├── storage/
│   │   └── sample-presentation.json   # JSON presentation storage directory
│   ├── tests/
│   │   └── test_backend.py            # Pytest test suite (CRUD, exporter, API)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.jsx             # 16:9 interactive visual canvas
│   │   │   ├── Toolbar.jsx            # Floating drawing tool selection
│   │   │   ├── PropertyPanel.jsx      # Contextual styling & slide options
│   │   │   ├── SlideSidebar.jsx       # Thumbnail list & slide management
│   │   │   ├── TopBar.jsx             # Title, Save JSON, Export PPTX, Undo/Redo
│   │   │   ├── JsonViewerModal.jsx    # Raw JSON inspection modal
│   │   │   └── PresentationListModal.jsx # Presentation manager modal
│   │   ├── hooks/
│   │   │   └── usePresentation.js     # State manager & history stack
│   │   ├── services/
│   │   │   └── api.js                 # Frontend API client
│   │   ├── App.jsx                    # Root React workspace
│   │   ├── main.jsx
│   │   └── index.css                  # Tailwind styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

---

## ⚡ Running Manually

Run the backend and frontend in their respective folders:

### 1. Backend (FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --port 8000
```
* Backend API: **[http://localhost:8000](http://localhost:8000)**
* API Documentation (Swagger): **[http://localhost:8000/docs](http://localhost:8000/docs)**
* Voice processing uses a separate FastAPI service that starts on demand and exits
  after 60 idle seconds. Existing speech environments are reused automatically.
  See [voice setup and power controls](docs/narration.md). For backend development,
  use `--reload --reload-dir app`; keep reload off for everyday use.
* Stored presentations are in `backend/storage/*.json`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
* Frontend Canvas: **[http://localhost:3000](http://localhost:3000)** (proxies `/api` calls directly to port 8000)

---

## 🧪 Running Tests

Run the backend test suite:

```bash
./backend/.venv/bin/pytest backend/tests/
# or with activated virtualenv:
source backend/.venv/bin/activate
pytest backend/tests/
```

All tests verify:
1. Filesystem CRUD operations on `backend/storage/*.json`.
2. `python-pptx` generation of native PowerPoint elements (rectangles, rounded rectangles, ellipses, lines, dashed borders, text, and OpenXML arrowheads).
3. FastAPI REST endpoints (`/api/presentations`, `/api/export-direct`).
4. Two-way JSON compatibility between frontend and backend.
