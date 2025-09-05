const express = require('express');
const router = express.Router();
const { enqueuePostcardJob, getJobResult, getUserPostcards } = require('../../queue/postcardWorker');
const { getTripMembersAvatars } = require('../../lib/postcardJobs');

router.get('/postcards', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;
    const postcards = await getUserPostcards(req.db, userId);
    const hasPending = postcards.some(p => p.status === 'pending');
    const avatars = await getTripMembersAvatars(req.db, trip.id);
    console.log('avatars->', avatars);
    // const postcards = [];
    // const hasPending = false;

    res.render('trips/postcards/index', {
        userId,
        postcards,
        hasPending,
        avatars,
        backgrounds: ['Rio beach', 'Hostel kitchen', 'Plane window'],
        actions: ['drinking caipirinhas', 'playing cards', 'taking a group selfie'],
    });
});

// Form to create a postcard
router.get('/postcard/new', (req, res) => {
    res.render('postcard-form', {
        avatars: ['Patas', 'Boli', 'Depo', 'Mariano', 'Bicho'], // replace with real ones
        backgrounds: ['Rio beach', 'Hostel kitchen', 'Plane window'],
        actions: ['drinking caipirinhas', 'playing cards', 'taking a group selfie'],
    });
});

// Submit postcard creation
router.post('/postcards', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;
    const { avatars, scene, action, caption } = req.body;

    await enqueuePostcardJob(req.db, userId, trip.id, avatars, scene, action, caption);

    res.redirect('/postcards');
});


// Polling route
router.get('/postcard/:jobId/status', async (req, res) => {
    const jobId = req.params.jobId;
    const result = await getJobResult(jobId);

    res.render('postcard-status', { result, jobId });
});

module.exports = router;

