# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `node server.js` - Start the Express server (default port 3000)
- `npm install` - Install dependencies
- `node scripts/resize.js` - Process avatar images (resize utility)

**Note:** Test infrastructure exists but package.json test script is currently disabled.

## Architecture

This is a travel log (bitácora de viajes) web application built with Express.js and MySQL. The application has undergone significant refactoring to use slug-based routing for trips.

**Core Features:**
- User authentication with handle-based login
- Slug-based trip routing (`/trips/:slug/feed`)
- Post creation with image uploads via HTMX
- Infinite scroll pagination using Intersection Observer API
- Avatar system with thumbnails

**Key Components:**
- **Server Entry Point:** `server.js` - Express app with MySQL session store. Note: some routes (feed, posts, likes) are currently commented out
- **Authentication:** `routes/auth.js` - Handle-based login with secure redirects, auto-generated avatar filenames
- **Trips:** `routes/trips.js` - Main trip functionality with slug-based routing, post creation, and infinite scroll
- **Legacy Routes:** `routes/viajes.js` - Legacy trip listing, `routes/feed.js` - Legacy feed system (may be deprecated)
- **Middleware:** `middleware/requireLogin.js` - Authentication guard with redirect handling

**Routing Architecture:**
- **Slug-based URLs:** `/trips/:slug/feed` instead of `/feed/:id`
- **Router param middleware:** `router.param('slug')` handles trip lookup by slug
- **Post creation:** `/trips/:slug/posts/new` with HTMX integration
- **Infinite scroll:** `/trips/:slug/feed/more` for pagination

**Template System:**
- **Organized by feature:** `views/trips/` for trip-specific templates
- **EJS partials:** Modular components in `views/partials/`
- **HTMX integration:** Forms use `hx-post` with `hx-target` for dynamic updates
- **No layout engine:** Uses include() partials for composition

**Infinite Scroll Implementation:**
- **Intersection Observer API:** Replaces HTMX triggers for better reliability
- **3 posts per page:** `POSTS_PER_PAGE = 3` in trips routes
- **Scroll sentinel:** Fixed element that triggers loading when visible
- **Graceful degradation:** Handles "no more posts" state

**Database Schema:**
- **users:** id, email, password_hash, handle, avatar_file_name, avatar_head_file_name
- **trips:** id, name, slug, start_date
- **posts:** id, user_id, trip_id, content, image_filename, created_at
- **likes:** id, user_id, post_id (if still active)

**Session Management:**
- MySQL-backed sessions via `express-mysql-session`
- 30-day cookie expiration
- Persistent login state across browser sessions

**File Organization:**
- `public/images/avatars/thumbs/` - Avatar thumbnails for UI
- `public/uploads/` - User-uploaded post images
- `views/trips/` - Trip-specific templates (feed, gallery, members)
- `views/partials/` - Reusable EJS components
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

**Development Notes:**
- **Legacy code:** Some routes in server.js are commented out, indicating ongoing refactoring
- **Debug output:** Templates include debug comments for development
- **HTMX migration:** Moving from HTMX triggers to Intersection Observer for infinite scroll