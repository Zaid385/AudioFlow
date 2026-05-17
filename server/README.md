# AudioFlow - Spotify Clone (Backend)

This is a robust backend for the AudioFlow music streaming platform, adapted from e-commerce requirements into a music-focused MVC architecture.

## Features
- **MVC Architecture:** Organized into Models, Controllers, and Routes.
- **Dynamic Music Library:** Server-side pagination, genre filtering, search, and sorting.
- **User Authentication:** 
  - Session-based auth for the Web UI (EJS).
  - JWT-based auth for the Headless REST API.
- **Admin Dashboard:** Full CRUD operations for songs (Admin only).
- **Playlist System:** Users can create and manage their own song collections.
- **Media Uploads:** Integrated Multer for album art and audio file uploads.
- **REST API:** Fully functional JSON API under `/api/v1`.
- **Validation:** Strict request validation using Zod.
- **Error Handling:** Centralized async error management.

## Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- TypeScript

## Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the `server` directory:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/audioflow
   SESSION_SECRET=your_secret_key
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

## Running the Application

### 1. Seed the Database
Ensure MongoDB is running, then execute:
```bash
npm run seed
```
**Default Accounts:**
- **Admin:** `admin@audioflow.com` / `adminpassword`
- **User:** `user@audioflow.com` / `userpassword`

### 2. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## API Documentation

### Auth
- `POST /api/v1/auth/login` - Get JWT token.

### Songs
- `GET /api/v1/songs` - Browse songs (supports `page`, `limit`, `genre`, `search`, `sort`).
- `GET /api/v1/songs/:id` - Get specific song details.

### User (Protected)
- `GET /api/v1/user/profile` - Get logged-in user info.
- `GET /api/v1/playlists` - Get user's playlists.
- `POST /api/v1/playlists` - Create a new playlist.
- `POST /api/v1/playlists/:id/add-song/:songId` - Add song to playlist.

## Project Structure
- `src/models`: Mongoose schemas and interfaces.
- `src/controllers`: Business logic for EJS and API.
- `src/routes`: Route definitions.
- `src/middlewares`: Auth, error handling, and file upload config.
- `src/utils`: Validators, async wrappers, and helpers.
- `views`: EJS templates for the web interface.
- `public/uploads`: Storage for images and audio files.
