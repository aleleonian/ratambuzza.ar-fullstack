const express = require('express');
const router = express.Router();
const { getTripMembersAvatars } = require('../../lib/postcardJobs');

// Main prizes page
router.get('/prizes', async (req, res) => {
    const trip = req.trip;
    const avatars = await getTripMembersAvatars(req.db, trip.id);
    console.log('/prizes avatars->', avatars);
    res.render('trips/prizes/index', {
        avatars,
    });
});

// Get prizes grid with optional filtering and sorting
router.get('/prizes-grid', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;
    const { awardee, sort, target } = req.query;

    let query = `
        SELECT
            p.id,
            p.trip_id,
            p.author_id,
            p.awardee_id,
            p.reason,
            p.created_at,
            author.handle AS author_handle,
            author.avatar_head_file_name AS author_avatar,
            awardee.handle AS awardee_handle,
            awardee.avatar_head_file_name AS awardee_avatar,
            COUNT(DISTINCT lp.id) AS like_count,
            EXISTS(SELECT 1 FROM likes_prizes WHERE user_id = ? AND prize_id = p.id) AS liked_by_user
        FROM prizes p
        JOIN users author ON p.author_id = author.id
        JOIN users awardee ON p.awardee_id = awardee.id
        LEFT JOIN likes_prizes lp ON lp.prize_id = p.id
        WHERE p.trip_id = ?
    `;

    const params = [userId, trip.id];

    // Filter by awardee
    if (awardee) {
        query += ' AND p.awardee_id = ?';
        params.push(awardee);
    }

    query += ' GROUP BY p.id';

    // Sort by likes
    if (sort === 'most-liked') {
        query += ' ORDER BY like_count DESC, p.created_at DESC';
    } else if (sort === 'least-liked') {
        query += ' ORDER BY like_count ASC, p.created_at DESC';
    } else {
        query += ' ORDER BY p.created_at DESC';
    }

    const [prizes] = await req.db.execute(query, params);

    // Determine grid target for HTMX responses
    const gridTarget = target || 'prizes-grid';

    res.render('trips/prizes/prizes-grid', { prizes, userId, gridTarget });
});

// Submit new prize
router.post('/prizes/new', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;
    const { awardee, reason } = req.body;

    try {
        if (!awardee) {
            throw new Error('Tenés que elegir un usuario!');
        }

        if (!reason || reason.trim() === '') {
            throw new Error('Tenés que escribir una razón!');
        }

        await req.db.execute(
            'INSERT INTO prizes (trip_id, author_id, awardee_id, reason) VALUES (?, ?, ?, ?)',
            [trip.id, userId, awardee, reason]
        );

        const avatars = await getTripMembersAvatars(req.db, trip.id);

        res.setHeader('X-Toast', 'Premio otorgado!');
        res.setHeader('X-Toast-Type', 'success');
        res.render('trips/prizes/prize-form', { avatars });
    } catch (error) {
        const availableAvatars = await getTripMembersAvatars(req.db, trip.id);

        res.setHeader('X-Toast', error.message);
        res.setHeader('X-Toast-Type', 'error');
        res.render('trips/prizes/prize-form', {
            avatars: availableAvatars,
            selectedAwardee: awardee,
            selectedReason: reason
        });
    }
});

// Toggle like on prize
router.post('/prizes/likes/toggle', async (req, res) => {
    const userId = req.session.user.id;
    const { prize_id } = req.body;

    const [[existing]] = await req.db.execute(
        'SELECT id FROM likes_prizes WHERE user_id = ? AND prize_id = ?',
        [userId, prize_id]
    );

    if (existing) {
        await req.db.execute('DELETE FROM likes_prizes WHERE id = ?', [existing.id]);
    } else {
        await req.db.execute('INSERT INTO likes_prizes (user_id, prize_id) VALUES (?, ?)', [userId, prize_id]);
    }

    const [[updated]] = await req.db.execute(`
        SELECT
            COUNT(*) AS like_count,
            EXISTS(SELECT 1 FROM likes_prizes WHERE user_id = ? AND prize_id = ?) AS liked_by_user
        FROM likes_prizes WHERE prize_id = ?
    `, [userId, prize_id, prize_id]);

    res.render('trips/prizes/like-button', {
        prize: {
            id: prize_id,
            liked_by_user: !!updated.liked_by_user,
            like_count: updated.like_count
        },
        currentOrUpcomingTrip: req.trip
    });
});

// Delete prize
router.delete('/prizes/:id', async (req, res) => {
    const userId = req.session.user.id;
    const prizeId = req.params.id;
    const trip = req.trip;

    try {
        // Check if user is the author or admin
        const [[prize]] = await req.db.execute(
            'SELECT author_id FROM prizes WHERE id = ?',
            [prizeId]
        );

        if (!prize) {
            return res.status(404).send('Prize not found');
        }

        if (prize.author_id !== userId && req.session.user.role !== 'admin') {
            return res.status(403).send('Unauthorized');
        }

        await req.db.execute('DELETE FROM likes_prizes WHERE prize_id = ?', [prizeId]);
        await req.db.execute('DELETE FROM prizes WHERE id = ?', [prizeId]);

        const { awardee, sort, target } = req.query;
        let query = `
            SELECT
                p.id,
                p.trip_id,
                p.author_id,
                p.awardee_id,
                p.reason,
                p.created_at,
                author.handle AS author_handle,
                author.avatar_head_file_name AS author_avatar,
                awardee.handle AS awardee_handle,
                awardee.avatar_head_file_name AS awardee_avatar,
                COUNT(DISTINCT lp.id) AS like_count,
                EXISTS(SELECT 1 FROM likes_prizes WHERE user_id = ? AND prize_id = p.id) AS liked_by_user
            FROM prizes p
            JOIN users author ON p.author_id = author.id
            JOIN users awardee ON p.awardee_id = awardee.id
            LEFT JOIN likes_prizes lp ON lp.prize_id = p.id
            WHERE p.trip_id = ?
        `;

        const params = [userId, trip.id];

        if (awardee) {
            query += ' AND p.awardee_id = ?';
            params.push(awardee);
        }

        query += ' GROUP BY p.id';

        if (sort === 'most-liked') {
            query += ' ORDER BY like_count DESC, p.created_at DESC';
        } else if (sort === 'least-liked') {
            query += ' ORDER BY like_count ASC, p.created_at DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        const [prizes] = await req.db.execute(query, params);

        const gridTarget = target || 'prizes-grid';

        res.setHeader('X-Toast', 'Premio borrado!');
        res.setHeader('X-Toast-Type', 'success');
        res.render('trips/prizes/prizes-grid', { prizes, userId, gridTarget });
    } catch (error) {
        console.error(error);
        res.setHeader('X-Toast', 'Error al borrar el premio');
        res.setHeader('X-Toast-Type', 'error');
        res.status(500).send('Error');
    }
});

module.exports = router;
