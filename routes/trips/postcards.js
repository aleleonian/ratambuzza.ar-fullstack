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
    const backgrounds = ['Rio beach', 'Hostel kitchen', 'Plane window'];
    const actions = ['drinking caipirinhas', 'playing cards', 'taking a group selfie'];

    // const postcards = [];
    // const hasPending = false;

    res.render('trips/postcards/index', {
        // selectedAvatars: ["Boli", "Butis", "Charly"],
        // selectedBackground: "Rio beach",
        // selectedAction: "playing cards",
        postcards,
        hasPending,
        avatars,
        backgrounds,
        actions,
    });
});

router.get('/postcards/list', async (req, res) => {
    res.send("this is the list of postcards, buddy!")
})
// Submit postcard creation
router.post('/postcards/new', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;

    console.log("req.body->", req.body);

    const { avatars, background, action } = req.body;

    try {
        if (!avatars || avatars === '') {
            throw new Error('Gotta choose an avatar!')
        }

        await enqueuePostcardJob(req.db, userId, trip.id, avatars, background, action);

        res.setHeader('X-Toast', "Se queueó tu job, bro.");
        res.setHeader('X-Toast-Type', 'success');
        res.render('trips/postcards/actual-postcard-form', { hasPending: true, avatars: [], backgrounds: [], actions: [] })
    }
    catch (error) {

        if (!Array.isArray(avatars) || avatars.length < 1) {
            selectedAvatars = undefined
        }
        else selectedAvatars = avatars;

        if (!background || background === '') {
            selectedBackground = undefined
        }
        else selectedBackground = background;

        if (!action || action === '') {
            selectedAction = undefined
        }
        else selectedAction = action;

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


// Polling route
router.get('/postcard/:jobId/status', async (req, res) => {
    const jobId = req.params.jobId;
    const result = await getJobResult(jobId);

    res.render('postcard-status', { result, jobId });
});

module.exports = router;

