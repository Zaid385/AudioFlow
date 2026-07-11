# 🎵 AudioFlow - High-Fidelity Music Streaming Platform

### 🚀 [Live Demo: https://audioflow-4pg4.onrender.com/](https://audioflow-4pg4.onrender.com)

AudioFlow is a premium, feature-rich Spotify clone built with a modern **Express/TypeScript** backend and a high-performance **Vanilla TypeScript** frontend. It features true audio persistence, a sleek dark-themed UI, robust admin controls, and seamless cloud integration.

---

## ✨ Key Features

### 🎧 Superior Playback Experience
- **SPA-Lite Navigation:** Seamless page transitions using a custom AJAX/DOM-Parser system that ensures music never stops when you switch pages.
- **Advanced Manual Queue:** Add any song to your queue, reorder them, and see what's coming up next in the real-time "Now Playing" panel.
- **Dynamic Visualizer:** Real-time Web Audio API frequency visualizer integrated into the player.
- **Adaptive UI Background:** The app's background glow dynamically changes color to match the album art of the currently playing track.

### 📱 Responsive & Mobile-First
- **Fluid Fullscreen Player:** On mobile, the player minimizes to a compact bar and fluidly expands into a rich fullscreen view with smooth animations and touch gestures (swipe down to minimize).
- **Mobile Bottom Nav:** Intuitive bottom navigation for quick access to Home, Search, and Library on small screens.
- **Resizable Panels:** (Desktop) Fully adjustable sidebar and right panel with draggable handles.

### 🔐 Robust Admin & Data Management
- **Cloudinary Integration:** Audio files and album art are stored securely in the cloud, optimized for fast streaming.
- **Automatic Metadata Extraction:** Admin dashboard automatically parses uploaded `.mp3` files to extract Title, Artist, Album, and embedded Cover Art using `music-metadata`.
- **Batch Operations:** Select and delete multiple songs at once with real-time UI progress tracking.

### 📂 User Personalization
- **Playlist System:** Create, manage, and delete custom playlists.
- **Liked Songs:** Dedicated smart playlist for all your hearted tracks.
- **Dynamic Grid Covers:** Automatic 2x2 cover art generation for playlists based on their contents.

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript, EJS (Embedded JavaScript)
- **Frontend:** Vanilla TypeScript, CSS Grid/Flexbox (No heavy frameworks)
- **Database:** MongoDB (via Mongoose)
- **Cloud:** Cloudinary (Audio & Image hosting)
- **Security:** JWT (API), Express-Session (Web), BcryptJS (Hashing), Zod (Validation)
- **Audio:** Web Audio API, `music-metadata`

---

## 🏗️ Project Structure

```text
server/
├── public/                 # Static assets
│   ├── css/                # Modular CSS Architecture
│   │   ├── components/     # Reusable UI elements (buttons, cards, modals)
│   │   └── pages/          # Page-specific layouts
│   ├── js/                 # Compiled Frontend JS
│   ├── ts/                 # Source Frontend TypeScript (main.ts)
│   └── uploads/            # Temporary staging area for processing
├── src/                    # Backend Source
│   ├── config/             # DB and Middleware configs
│   ├── controllers/        # Business logic (MVC)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express route definitions
│   ├── utils/              # Metadata parser, Cloudinary helpers
│   └── middlewares/        # Auth and Error handling
└── views/                  # EJS Template Files
    ├── admin/              # Admin dashboard templates
    └── partials/           # Header, Footer, Player components
```

---

## 💻 Local Setup

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or Atlas connection string)
- **Cloudinary Account** (For media uploads)

### 2. Installation
```bash
git clone https://github.com/Zaid385/AudioFlow.git
cd AudioFlow/server
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_random_secret
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Production App URL (for CORS)
APP_URL=http://localhost:3000
```

### 4. Build and Run
```bash
# Build frontend and backend
npm run build
npm run build:frontend

# Start development server
npm run dev
```

---

## 🛡️ Admin Access
To access the `/admin/manage-songs` dashboard, you must have a user account with the `role: "admin"` in your MongoDB database.

---

## 📜 License
This project is licensed under the MIT License.
