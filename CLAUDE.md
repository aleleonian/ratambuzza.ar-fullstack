# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `node server.js` - Start the Express server (default port 3000)
- `npm install` - Install dependencies

**Note:** No test runner is currently configured in package.json.

## Architecture

This is a full-stack Node.js web application built with Express.js and MySQL.

**Key Components:**
- **Server Entry Point:** `server.js` - Main Express application with middleware configuration
- **Authentication:** `routes/auth.js` - Handles login, signup, and logout with bcrypt password hashing
- **Views:** EJS templates with express-ejs-layouts for consistent page structure
- **Database:** MySQL2 with connection pooling, accessed via `req.db` in routes

**Application Flow:**
- Express app uses sessions for authentication state
- Database connection pool is attached to `req.db` for all routes
- User object is available in templates via `res.locals.user`
- EJS layout system provides consistent navigation and structure

**Database Schema:**
- Users table with fields: id, email, password_hash, handle

**Environment Variables Required:**
- `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` - MySQL connection details
- `SESSION_SECRET` - Express session secret
- `PORT` - Server port (optional, defaults to 3000)

**Key Dependencies:**
- express - Web framework
- mysql2 - Database driver with promise support
- bcrypt - Password hashing
- express-session - Session management
- ejs + express-ejs-layouts - Templating