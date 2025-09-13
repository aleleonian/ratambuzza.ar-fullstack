# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm start` or `node server.js` - Start the Express server (default port 3000)
- `npm run start:test` - Start server with test environment (.env.test)
- `npm install` - Install dependencies
- `node scripts/resize.js` - Process avatar images (resize utility)

**Testing:**
- `npm run test:e2e` or `npx playwright test` - Run all Playwright tests
- `npx playwright test login.spec.js` - Run specific test file
- Playwright test framework with global setup handling authentication via `storageState.json`
- Environment-specific configs: `.env` for development, `.env.test` for testing
- Test database seeding and cleanup utilities in `tests/utils/seed/helpers/`

## Architecture

This is a travel log (bitácora de viajes) web application built with Express.js and MySQL. The application has undergone significant refactoring to use slug-based routing for trips.

**Core Features:**
- User authentication with handle-based login
- Slug-based trip routing (`/trips/:slug/feed`)
- Post creation with image uploads via HTMX
- Infinite scroll pagination using Intersection Observer API
- Avatar system with thumbnails
- Media gallery system with multiple file uploads, tagging, and filtering
- Lightbox viewing with metadata display
- Like system for media items
- AI-powered postcard generation with Google Gemini using avatar references
- Background job processing for postcard creation with status tracking

**Key Components:**
- **Server Entry Point:** `server.js` - Express app with MySQL session store. Note: some routes (feed, posts, likes) are currently commented out
- **Authentication:** `routes/auth.js` - Handle-based login with secure redirects, auto-generated avatar filenames
- **Trips:** `routes/trips/index.js` - Main trip router with slug-based routing and subrouter mounting (feed, posts, likes, crew, media, postcards)
- **Media System:** `routes/trips/media.js` - Gallery system with multiple upload, tagging, filtering, and like functionality
- **Feed System:** `routes/trips/feed.js` - Post creation and infinite scroll for trip feeds
- **Postcards System:** `routes/trips/postcards.js` - AI postcard generation, job management, and posting to feed
- **Background Worker:** `queue/postcardWorker.js` - Processes postcard generation jobs using Google Gemini AI
- **Legacy Routes:** `routes/viajes.js` - Legacy trip listing, `routes/feed.js` - Legacy feed system (may be deprecated)
- **Middleware:** `middleware/requireLogin.js` - Authentication guard with redirect handling

**Routing Architecture:**
- **Slug-based URLs:** `/trips/:slug/feed` instead of `/feed/:id`
- **Router param middleware:** `router.param('slug')` handles trip lookup by slug
- **Post creation:** `/trips/:slug/posts/new` with HTMX integration
- **Infinite scroll:** `/trips/:slug/feed/more` for pagination
- **Media gallery:** `/trips/:slug/gallery` with filtering, tagging, and lightbox functionality
- **Media uploads:** `/trips/:slug/upload` with multiple file support and image processing
- **Postcards:** `/trips/:slug/postcards` with AI generation, job status, and posting to feed

**Template System:**
- **Organized by feature:** `views/trips/` for trip-specific templates
- **EJS partials:** Modular components in `views/partials/`
- **Gallery templates:** Comprehensive set in `views/trips/gallery/` including media grid, lightbox, tag editor, and filter components
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
- **media:** id, trip_id, user_id, url, thumbnail_url, width, height, type, created_at
- **tags:** id, name (for media tagging)
- **media_tags:** media_id, tag_id (many-to-many relationship)
- **likes_media:** user_id, media_id (media like system)
- **postcards:** id, user_id, trip_id, avatars, background, action, status, image_url, thumbnail_url, post_id, created_at

**Session Management:**
- MySQL-backed sessions via `express-mysql-session`
- 30-day cookie expiration
- Persistent login state across browser sessions

**File Organization:**
- `public/images/avatars/thumbs/` - Avatar thumbnails for UI
- `public/uploads/` - User-uploaded post images and media files
- `views/trips/` - Trip-specific templates (feed, gallery, members)
- `views/trips/gallery/` - Gallery-specific templates (media grid, lightbox, tag editor, filters)
- `views/partials/` - Reusable EJS components
- `routes/trips/` - Modular trip route handlers (feed, media, posts, likes, crew)
- `noupload/` - Development assets not committed

**Environment Variables Required:**
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` - MySQL connection details
- `SESSION_SECRET` - Express session secret
- `PORT` - Server port (optional, defaults to 3000)
- `APP_HOST` - Application host for testing (localhost)
- `NODE_ENV` - Environment mode (test/development/production)
- `GEMINI_API_KEY` - Google Gemini AI API key for postcard generation

**Key Dependencies:**
- express - Web framework
- mysql2 - Database with connection pooling
- express-mysql-session - MySQL session store
- bcrypt - Password hashing
- multer - File upload handling
- sharp - Image processing
- ejs - Templating system
- htmx.org - Frontend interactivity and dynamic updates
- uuid - Unique identifier generation
- @google/genai - Google Gemini AI integration for postcard generation
- image-size - Image dimension analysis
- @playwright/test - End-to-end testing framework

**Development Notes:**
- **Legacy code:** Some routes in server.js are commented out, indicating ongoing refactoring
- **Debug output:** Templates include debug comments for development
- **HTMX migration:** Moving from HTMX triggers to Intersection Observer for infinite scroll
- **Media processing:** Sharp library handles image resizing (1600x1600 max, 80% quality) and thumbnail generation
- **Authorization system:** Role-based access control for media deletion and tag editing (owner or admin)
- **Custom toast system:** Uses X-Toast headers for user feedback on HTMX requests
- **Tag cleanup:** Automatic cleanup of unused tags when updating media item tags
- **Gallery state management:** Uses `window.galleryState` object for filter persistence and `htmx:afterSettle` for reliable DOM updates
- **JavaScript encapsulation:** Template scripts use IIFE patterns to avoid global namespace pollution
- **AI postcard generation:** Background worker processes jobs using Google Gemini with 16-bit pixel art prompts
- **Job processing:** Queue system with pending/in-progress/completed status tracking
- **Test environment stubbing:** Postcard worker uses static test image instead of AI generation when `NODE_ENV=test`
- **Database abstraction:** Centralized DB connection pool in `lib/db.js` using `mysql2/promise`
- **Test setup:** Global setup handles database seeding, trip creation, and authenticated session storage
- **Session security:** Cookies set to non-secure in development/test environments