# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `node server.js` - Start the Express server (default port 3000)
- `npm install` - Install dependencies
- `node scripts/resize.js` - Process avatar images (resize utility)

**Note:** No test runner is currently configured in package.json.

## Architecture

This is a travel log (bitácora de viajes) web application built with Express.js and MySQL. Users can create accounts, join trips, and share posts with images.

**Core Features:**
- User authentication with handle-based login
- Trip management and participation
- Post creation with image uploads
- Avatar system with thumbnails
- Feed views for trip posts

**Key Components:**
- **Server Entry Point:** `server.js` - Express app with route mounting and middleware
- **Authentication:** `routes/auth.js` - Handle-based login with secure redirects, bcrypt hashing
- **Posts:** `routes/posts.js` - Image upload handling with multer, post creation
- **Trips:** `routes/viajes.js` - Trip listing (protected routes)
- **Feed:** `routes/feed.js` - Trip post feeds with user data joins
- **Middleware:** `middleware/requireLogin.js` - Authentication guard with redirect handling

**Template System:**
- EJS partials for modular components (header, footer, avatar-ribbon, posts)
- No layout engine - uses include() partials instead
- Static image serving with caching for avatars and uploads

**Database Schema:**
- **users:** id, email, password_hash, handle, avatar_file_name, avatar_head_file_name
- **trips:** id, name, start_date
- **posts:** id, user_id, trip_id, content, image_file_name, created_at

**File Organization:**
- `public/images/avatars/` - User avatar images with thumbnail system
- `public/uploads/` - User-uploaded post images
- `noupload/` - Development assets not committed

**Environment Variables Required:**
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` - MySQL connection details
- `SESSION_SECRET` - Express session secret (30-day cookie expiry)
- `PORT` - Server port (optional, defaults to 3000)

**Key Dependencies:**
- express - Web framework
- mysql2 - Database with connection pooling
- bcrypt - Password hashing
- express-session - Session management with persistent cookies
- ejs - Templating (no layout engine)
- multer - File upload handling
- sharp - Image processing