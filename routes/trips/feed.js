const express = require('express');
const { requireLogin } = require('../../middleware/requireLogin');
const { POSTS_PER_PAGE } = require('../../lib/config');
const { uploadMultiple } = require('../../lib/upload');

const router = express.Router({ mergeParams: true });


// GET /trips/:slug/feed - Main feed route with search functionality
// Added: 2025-09-16 - Enhanced to support HTMX search requests
router.get('/feed', requireLogin, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const trip = req.trip;

        // Extract search parameters from query string
        // - search: text to search within post content (using LIKE query)
        // - user: specific user ID to filter posts by
        const search = req.query.search ? req.query.search.trim() : '';
        const userFilter = req.query.user ? parseInt(req.query.user, 10) : null;

        // Build dynamic SQL WHERE clause based on search parameters
        // Base query: only posts from current trip
        let whereClause = 'WHERE p.trip_id = ?';
        let params = [trip.id];

        // Add text search filter if provided
        if (search) {
            whereClause += ' AND p.content LIKE ?';
            params.push(`%${search}%`);
        }

        // Add user filter if provided
        if (userFilter) {
            whereClause += ' AND p.user_id = ?';
            params.push(userFilter);
        }

        // Final parameters: [userId for likes check, ...search parameters]
        const finalParams = [userId, ...params];

        const [posts] = await req.db.execute(
            `SELECT p.*, u.handle, u.avatar_head_file_name,
        EXISTS (SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
        (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM post_replies WHERE post_id = p.id) AS replies_count
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ${whereClause}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT ${POSTS_PER_PAGE}`,
            finalParams
        );

        const theresMore = posts.length === POSTS_PER_PAGE;

        // 2. Get associated media
        await Promise.all(posts.map(async post => {
            const [mediaRows] = await req.db.execute(`
        SELECT id, url, thumbnail_url, width, height
        FROM media
        WHERE post_id = ?
    `, [post.id]);
            post.media = mediaRows;
        }));

        const [trips] = await req.db.execute('SELECT * FROM trips ORDER BY start_date DESC');

        // Get users who are members of this trip for the filter dropdown
        // Added: 2025-09-16 - Provides user list for "Filter by User" dropdown
        // Only shows users who are actually members of the current trip
        const [tripUsers] = await req.db.execute(`
            SELECT DISTINCT u.id, u.handle 
            FROM users u
            JOIN trip_members tm ON u.id = tm.user_id
            WHERE tm.trip_id = ?
            ORDER BY u.handle
        `, [trip.id]);


        // HTMX Request Detection & Response Handling
        // Added: 2025-09-16 - Prevents "Russian doll" effect when search form submits
        // 
        // Key insight: HTMX sends 'hx-request: true' header
        // - HTMX requests: Return only posts HTML (no sidebars/layout)
        // - Normal requests: Return full page with layout
        // This prevents nested layouts when search results are inserted into #posts-container
        const isHtmxRequest = req.headers['hx-request'] === 'true';

        if (isHtmxRequest) {

            // Handle empty search results
            if (posts.length === 0) {
                return res.send('<div style="text-align: center; padding: 20px; color: #666;">No se encontraron posts que coincidan con tu búsqueda.</div>');
            }

            // Prepare search info for the search results header
            const searchInfo = (search || userFilter) ? {
                hasSearch: true,
                searchText: search,
                hasUserFilter: !!userFilter,
                resultCount: posts.length
            } : { hasSearch: false };

            // Return only posts HTML template (prevents Russian doll effect)
            return res.render('trips/feed/just-posts', { trip, posts, searchInfo });
        }

        console.log('posts->', posts);

        res.render('trips/feed', {
            trips,
            trip,
            posts,
            theresMore,
            POSTS_PER_PAGE,
            search,
            userFilter,
            tripUsers
        });
    } catch (e) { next(e); }
});

// GET /trips/:slug/feed/more
router.get('/feed/more', requireLogin, async (req, res, next) => {
    try {
        const userId = req.session.user.id;
        const trip = req.trip;

        // Get search parameters (same as main feed route)
        const search = req.query.search ? req.query.search.trim() : '';
        const userFilter = req.query.user ? parseInt(req.query.user, 10) : null;

        const excludeIds = req.query.exclude_ids
            ? req.query.exclude_ids.split(',').map((id) => parseInt(id, 10))
            : [];

        let whereClause = 'WHERE p.trip_id = ?';
        let params = [trip.id];

        // Add search filters
        if (search) {
            whereClause += ' AND p.content LIKE ?';
            params.push(`%${search}%`);
        }

        if (userFilter) {
            whereClause += ' AND p.user_id = ?';
            params.push(userFilter);
        }

        if (excludeIds.length) {
            const placeholders = excludeIds.map(() => '?').join(',');
            whereClause += ` AND p.id NOT IN (${placeholders})`;
            params = params.concat(excludeIds);
        }

        const finalParams = [userId, ...params];

        const [posts] = await req.db.execute(`
      SELECT p.*, u.handle, u.avatar_head_file_name,
        EXISTS (SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = p.id) AS liked_by_user,
        (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ${whereClause}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ${POSTS_PER_PAGE}
    `, finalParams);

        if (!posts.length) {
            return res.send('<div data-no-more-posts="true">No hay más che, qué querés.</div>');
        }

        res.render('trips/feed/just-posts', { trip, posts });
    } catch (e) { next(e); }
});

// GET single post and its replies
router.get('/feed/:postId', requireLogin, async (req, res) => {
    const userId = req.session.user.id;

    const postId = req.params.postId;
    const [postRows] = await req.db.execute(
        `SELECT posts.*, users.handle, users.avatar_head_file_name,
        EXISTS (SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = posts.id) AS liked_by_user,
        (SELECT COUNT(*) FROM likes_posts WHERE post_id = posts.id) AS like_count
        FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ?`,
        [userId, postId]
    );
    const post = postRows[0];
    const [replies] = await req.db.execute(
        `SELECT pr.*, u.handle, u.avatar_head_file_name,
        EXISTS (SELECT 1 FROM likes_replies WHERE user_id = ? AND reply_id = pr.id) AS liked_by_user,
        (SELECT COUNT(*) FROM likes_replies WHERE reply_id = pr.id) AS like_count

     FROM post_replies pr
     JOIN users u ON pr.user_id = u.id 
     WHERE pr.post_id = ? 
     ORDER BY pr.created_at ASC`,
        [userId, postId]
    );
    post.replies_count = replies.length;
    res.render('trips/feed/post-with-replies', { post, replies });
});

// POST new reply
router.post('/feed/:postId/replies', requireLogin, uploadMultiple, async (req, res) => {
    const { reply_text } = req.body;
    const postId = req.params.postId;
    const user = req.session.user;
    const trip = req.trip;

    if (!reply_text.trim()) {
        res.setHeader('X-Toast', "No podés mandar un reply vacío.");
        res.setHeader('X-Toast-Type', "error");
        return res.redirect(`/feed/${postId}`);
    }

    try {
        await req.db.execute(
            'INSERT INTO post_replies (post_id, user_id, trip_id, reply_text) VALUES (?, ?, ?, ?)',
            [postId, user.id, trip.id, reply_text]
        );

        const [replies] = await req.db.execute(
            `SELECT pr.*, u.handle, u.avatar_head_file_name
     FROM post_replies pr 
     JOIN users u ON pr.user_id = u.id 
     WHERE pr.post_id = ? 
     ORDER BY pr.created_at ASC`,
            [postId]
        );

        const [posts] = await req.db.execute(`SELECT * FROM posts WHERE id = ?`, [postId]);

        res.setHeader('X-Toast', "Listo, loko.");
        res.setHeader('X-Toast-Type', 'success');
        res.render('trips/feed/replies-section', { replies, post: posts[0] }); // no body needed
    }
    catch (error) {
        res.setHeader('X-Toast', "Hubo un error, che: " + error);
        res.setHeader('X-Toast-Type', 'error');
        res.render('trips/feed/replies-section', { replies: [] }); // no body needed
    }
});

router.delete('/feed/:postId/replies/:replyId', async (req, res) => {
    // router.delete('/feed/:postId/replies', requireLogin, async (req, res) => {
    const { postId, replyId } = req.params;
    const user = req.session.user;
    const trip = req.trip;

    console.log('replyId->', replyId);

    // find that reply
    // if it exists, delete it. 
    // return ok
    // if it does not, return some error.  

    try {
        let [reply] = await req.db.execute(
            `SELECT pr.*
     FROM post_replies pr 
     WHERE pr.post_id = ? 
     AND pr.user_id = ?
     AND pr.id = ?
     `,
            [postId, user.id, replyId]
        );

        reply = reply[0];
        if (!reply) {
            throw new Error('Ud. no puede borrar eso, señor');
        }

        await req.db.execute(
            `DELETE
     FROM post_replies pr 
     WHERE pr.post_id = ? 
     AND pr.user_id = ?
     AND pr.id = ?
     `,
            [postId, user.id, replyId]
        );

        const [replies] = await req.db.execute(
            `SELECT pr.*, u.handle, u.avatar_head_file_name
     FROM post_replies pr 
     JOIN users u ON pr.user_id = u.id 
     WHERE pr.post_id = ? 
     ORDER BY pr.created_at ASC`,
            [postId]
        );

        const [posts] = await req.db.execute(
            `SELECT p.*
       FROM posts p
       WHERE p.id = ?
       `,
            [postId]
        );
        const post = posts[0];
        res.setHeader('X-Toast', "Todo joya!");
        res.setHeader('X-Toast-Type', 'success');
        res.render('trips/feed/replies-section', { replies, post }); // no body needed
    }
    catch (error) {

        const [replies] = await req.db.execute(
            `SELECT pr.*, u.handle, u.avatar_head_file_name
     FROM post_replies pr 
     JOIN users u ON pr.user_id = u.id 
     WHERE pr.post_id = ? 
     ORDER BY pr.created_at ASC`,
            [postId]
        );

        const [posts] = await req.db.execute(
            `SELECT p.*
       FROM posts p
       WHERE p.id = ?
       `,
            [postId]
        );

        const post = posts[0];
        res.setHeader('X-Toast', "Hubo un error: " + error);
        res.setHeader('X-Toast-Type', 'error');
        res.render('trips/feed/replies-section', { replies, post }); // no body needed
    }
});

module.exports = router;
