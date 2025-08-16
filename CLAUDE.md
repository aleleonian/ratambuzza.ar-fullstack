# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `node server.js` - Start the Express server (default port 3000)
- `npm install` - Install dependencies
- `node scripts/resize.js` - Process avatar images (resize utility)

**Note:** Test infrastructure exists but package.json test script is currently disabled.

## Architecture

This is a travel log (bitácora de viajes) web application built with Express.js and MySQL featuring real-time interactions via HTMX.

**Core Features:**
- User authentication with handle-based login
- Trip management and participation  
- Post creation with image uploads and deletion
- Like/unlike functionality with real-time updates
- Infinite scroll pagination (1 post per page)
- Avatar system with thumbnails

**Key Components:**
- **Server Entry Point:** `server.js` - Express app with MySQL session store and route mounting
- **Authentication:** `routes/auth.js` - Handle-based login with secure redirects, auto-generated avatar filenames
- **Posts:** `routes/posts.js` - Image upload/deletion with multer, HTMX post creation/removal
- **Likes:** `routes/likes.js` - Toggle like functionality with count updates
- **Feed:** `routes/feed.js` - Infinite scroll pagination with like counts and user data joins
- **Trips:** `routes/viajes.js` - Trip listing (protected routes)
- **Middleware:** `middleware/requireLogin.js` - Authentication guard with redirect handling

**HTMX Integration:**
- Real-time post creation without page refresh
- Like button toggling with instant UI updates
- Infinite scroll loading via `hx-trigger="revealed"`
- Dynamic content swapping using `hx-swap` directives
- Form reset after successful submission

**Template System:**
- EJS partials for modular components (post, like-button, delete-button, post-list)
- Sidebar layout with left/right components
- No layout engine - uses include() partials for composition
- Static image serving with 7-day caching for avatars

**Database Schema:**
- **users:** id, email, password_hash, handle, avatar_file_name, avatar_head_file_name
- **trips:** id, name, start_date  
- **posts:** id, user_id, trip_id, content, image_filename, created_at
- **likes:** id, user_id, post_id (many-to-many relationship)

**Session Management:**
- MySQL-backed sessions via `express-mysql-session`
- 30-day cookie expiration
- Persistent login state across browser sessions

**File Organization:**
- `public/images/avatars/thumbs/` - Avatar thumbnails for UI
- `public/uploads/` - User-uploaded post images
- `views/partials/` - Modular EJS components for HTMX responses
- `noupload/` - Development assets not committed

**Environment Variables Required:**
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` - MySQL connection details
- `SESSION_SECRET` - Express session secret
- `PORT` - Server port (optional, defaults to 3000)

**Key Dependencies:**
- express - Web framework
- mysql2 - Database with connection pooling
- express-mysql-session - MySQL session store
- bcrypt - Password hashing
- multer - File upload handling
- sharp - Image processing
- ejs - Templating system