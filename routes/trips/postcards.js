const express = require('express');
const router = express.Router();
const { enqueuePostcardJob, getJobResult, getUserPostcards } = require('../../queue/postcardWorker');
const { getTripMembersAvatars, deletePostcard } = require('../../lib/postcardJobs');
const { createThumbnail } = require('../../lib/upload');
const sharp = require('sharp');
const path = require('path');

const width = 1600;
const height = 1600;
const quality = 80;

router.get('/postcards', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;
    const postcards = await getUserPostcards(userId);
    const hasPending = postcards.some(p => p.status === 'pending');
    console.log('postcards->', postcards);
    console.log('hasPending->', hasPending);
    const avatars = await getTripMembersAvatars(req.db, trip.id);
    const backgrounds = ['Rio beach', 'Hostel kitchen', 'Plane window', 'Playboy mansion', 'Library', 'Soccer field', 'Restaurant'];
    const actions = ['drinking caipirinhas', 'playing cards', 'taking a group selfie', 'Eating pizza', 'Playing chess', 'Getting a massage','Snowboarding'];

    // const postcards = [];
    // const hasPending = false;

    res.render('trips/postcards/index', {
        // selectedAvatars: ["Boli", "Butis", "Charly"],
        // selectedBackground: "Plane window",
        // selectedAction: "playing cards",
        postcards,
        hasPending,
        avatars,
        backgrounds,
        actions,
    });
});

router.get('/postcards-grid', async (req, res) => {
    const userId = req.session.user.id;
    const postcards = await getUserPostcards(userId); // returns top 10 with status and thumbnail_url
    res.render('trips/postcards/postcards-grid', { postcards });
});

// Submit postcard creation
router.post('/postcards/new', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;

    let selectedAvatars = [];
    let selectedBackground;
    let selectedAction;

    console.log("req.body->", req.body);

    const { avatars, background, action } = req.body;

    if (!avatars) selectedAvatars = undefined;

    else {
        if (Array.isArray(avatars)) {
            if (avatars.length < 1) selectedAvatars = undefined;
            else selectedAvatars = avatars;
        }
        else {
            if (avatars == '') {
                selectedAvatars = undefined
            }
            else selectedAvatars.push(avatars);
        }
    }

    if (!background || background === '') {
        selectedBackground = undefined
    }
    else selectedBackground = background;

    if (!action || action === '') {
        selectedAction = undefined
    }
    else selectedAction = action;

    try {

        if (!selectedAvatars || selectedAvatars.length < 1) {
            throw new Error('Gotta choose an avatar!')
        }

        if (!selectedBackground) {
            throw new Error('Gotta choose an background!')
        }

        if (!selectedAction) {
            throw new Error('Gotta choose an action!')
        }

        await enqueuePostcardJob(userId, trip.id, avatars, background, action);

        res.setHeader('X-Toast', "Se queueó tu job, bro.");
        res.setHeader('X-Toast-Type', 'success');
        res.render('trips/postcards/actual-postcard-form', { hasPending: true, avatars: [], backgrounds: [], actions: [] })
    }
    catch (error) {

        const availableAvatars = await getTripMembersAvatars(req.db, trip.id);
        const availableBackgrounds = ['Rio beach', 'Hostel kitchen', 'Plane window'];
        const availableActions = ['drinking caipirinhas', 'playing cards', 'taking a group selfie'];

        console.log('selectedAvatars->', selectedAvatars);
        console.log('selectedBackground->', selectedBackground);
        console.log('selectedAction->', selectedAction);

        res.setHeader('X-Toast', "Algo salió mal->" + error);
        res.setHeader('X-Toast-Type', 'error');
        res.render('trips/postcards/actual-postcard-form',
            {
                hasPending: false,
                avatars: availableAvatars,
                backgrounds: availableBackgrounds,
                actions: availableActions,
                selectedAvatars,
                selectedBackground,
                selectedAction
            })
    }
});

router.delete('/postcards/:id/', async (req, res) => {
    const user = req.session.user;
    const postcardId = req.params.id;
    try {
        if (!isAuthorized(req.db, user.role, user.id, postcardId)) {
            return res.status(403).send('Unauthorized');
        }
        await deletePostcard(req.db, postcardId);
        const postcards = await getUserPostcards(user.id);
        res.setHeader('X-Toast', 'Postal borrada!');
        res.setHeader('X-Toast-Type', 'success');
        return res.render('trips/postcards/postcards-grid', { postcards })

    }
    catch (error) {
        console.log('error->', error);
        res.setHeader('X-Toast', 'Algo se rompió, negri.');
        res.setHeader('X-Toast-Type', 'error');
        return res.status(500).send(error);
    }
});

router.post('/postcards/post', async (req, res) => {
    const user = req.session.user;
    const trip = req.trip;
    const { postcardId } = req.body;

    try {

        // make sure this postcard has not been posted before
        const [rows] = await req.db.execute(
            'SELECT post_id from postcards WHERE id = ?',
            [postcardId]
        );
        const postcard = rows[0];

        console.log('postcard->', postcard);

        if (postcard.post_id) {
            res.setHeader('X-Toast', "Ya se posteó esa imagen, broder.");
            res.setHeader('X-Toast-Type', 'error');
            return res.send('');
        }

        // gotta add an entry into the posts table
        const [postResult] = await req.db.execute(
            'INSERT INTO posts (user_id, trip_id, content) VALUES (?, ?, ?)',
            [user.id, trip.id, '']
        );

        const postId = postResult.insertId;

        //gotta resize the postcard (will reuse thumb)
        const [postcards] = await req.db.execute(`
    SELECT image_url, thumbnail_url FROM postcards
    WHERE id = ?
  `, [postcardId]);

        const desiredPostcard = postcards[0];
        // postcard.image_url = '/uploads/postcard.png'.split('/')
        const explodedName = desiredPostcard.image_url.split('/')
        const fileName = explodedName[explodedName.length - 1]
        const resizedName = 'resized-' + fileName;
        const desiredPostcardUrl = "/uploads/" + resizedName;
        const originalPostcardPath = path.join(process.cwd(), 'public', desiredPostcard.image_url.replace(/^\/+/, ''))
        const resizedPostcardPath = path.join(process.cwd(), 'public', 'uploads', resizedName);

        await sharp(originalPostcardPath)
            .rotate()
            .resize({ width, height, fit: 'inside' })
            .jpeg({ quality })
            .toFile(resizedPostcardPath);

        const thumbName = `thumb-${resizedName}`;
        const thumbnailUrl = await createThumbnail(resizedPostcardPath, thumbName);

        // gotta add an entry in the 'media' table representing the postcard

        await req.db.execute(
            'INSERT INTO media (post_id, trip_id, user_id, url, thumbnail_url, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [postId, trip.id, user.id, desiredPostcardUrl, thumbnailUrl, width, height]
        );

        await req.db.execute(
            'UPDATE postcards set post_id = ? where id = ?',
            [postId, postcardId]
        );

        // gotta return a url to the post
        res.setHeader('X-Toast', "Se posteó su postal, jefe.");
        res.setHeader('X-Toast-Type', 'success');
        res.send('');
    }
    catch (error) {
        console.error(error);
        res.setHeader('X-Toast', "Algo se jodió.");
        res.setHeader('X-Toast-Type', 'error');
        res.send('');
    }
});

// Polling route
router.get('/postcard/:jobId/status', async (req, res) => {
    const jobId = req.params.jobId;
    const result = await getJobResult(jobId);

    res.render('postcard-status', { result, jobId });
});

module.exports = router;

async function isAuthorized(db, userRole, userId, postcardId) {
    if (userRole === 'admin') return true;
    const [rows] = await db.execute('SELECT user_id from postcards WHERE id = ?', [postcardId]);
    if (rows.length === 0) return false;
    const ownerId = rows[0]?.user_id;
    return ownerId === userId;
}