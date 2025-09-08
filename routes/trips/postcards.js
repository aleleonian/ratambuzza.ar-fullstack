const express = require('express');
const router = express.Router();
const { enqueuePostcardJob, getJobResult, getUserPostcards } = require('../../queue/postcardWorker');
const { getTripMembersAvatars } = require('../../lib/postcardJobs');

router.get('/postcards', async (req, res) => {
    const userId = req.session.user.id;
    const trip = req.trip;
    const postcards = await getUserPostcards(userId);
    const hasPending = postcards.some(p => p.status === 'pending');
    console.log('postcards->', postcards);
    console.log('hasPending->', hasPending);
    const avatars = await getTripMembersAvatars(req.db, trip.id);
    const backgrounds = ['Rio beach', 'Hostel kitchen', 'Plane window'];
    const actions = ['drinking caipirinhas', 'playing cards', 'taking a group selfie'];

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

router.get('/postcards/list', async (req, res) => {
    res.send("this is the list of postcards, buddy!")
})
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


// Polling route
router.get('/postcard/:jobId/status', async (req, res) => {
    const jobId = req.params.jobId;
    const result = await getJobResult(jobId);

    res.render('postcard-status', { result, jobId });
});

module.exports = router;

