// queue/postcardWorker.js
const fs = require('fs');
const path = require('path');
const postcardJobs = new Map();
const { insertPostcard, getNextPendingJob, markJobInProgress, markJobComplete, updateJobStatus, processJobData } = require('../lib/postcardJobs');
const pool = require("../lib/db");
const JOB_INTERVAL_MS = 5000;

// const { sendEmail } = require('../lib/email');ƒ


function buildPrompt({ avatars, background, action, mode }) {
    const avatarCount = avatars.length;
    const base = `You are composing a SINGLE pixel-art “postcard” with the uploaded avatars (${avatarCount} total).\n\n` +
        `Scene: ${action} at a ${background}.`;

    const strict = `
Constraints:
- Output ONE image only.
- Show ONLY the uploaded avatars. No extra characters, crowds, or NPCs.
- Place them TOGETHER in one scene.
- Think SNES 16-bit retro group photo style.
- Maintain appearance faithfully. Pose them naturally.`;

    const scenic = `
Constraints:
- Output ONE image only.
- Uploaded avatars must be clearly visible TOGETHER in the foreground.
- You MAY include background characters, crowds, or ambient NPCs.
- Do NOT obscure or replace avatars.
- Think SNES 16-bit cutscene style.`;

    return base + (mode === 'scenic' ? scenic : strict);
}

async function enqueuePostcardJob(userId, tripId, avatars, scene, action) {
    console.log('userId->', userId);
    console.log('tripId->', tripId);
    console.log('avatars->', avatars);
    console.log('scene->', scene);
    console.log('action->', action);

    const data = {
        userId,
        tripId,
        avatars,
        scene,
        action
    }

    const jobId = await insertPostcard(pool, userId, tripId, avatars, scene, action, caption);
    return jobId;
}

async function processJob(jobId, data) {
    try {
        const { avatars, background, action, mode, userId, userEmail } = data;
        const avatarFiles = avatars.map(name => {
            const filePath = path.resolve(__dirname, `../public/assets/avatars/${name}.png`);
            const base64 = fs.readFileSync(filePath).toString('base64');
            return { base64, mimeType: 'image/png', fileName: `${name}.png` };
        });

        const prompt = buildPrompt({ avatars, background, action, mode });
        const imageDataUrl = await generatePostcardWithGemini(avatarFiles, prompt);

        await updateJobStatus(pool, jobId, {
            status: 'done',
            image_url: imageDataUrl,
            completed_at: new Date(),
        });

        if (userEmail) {
            await sendEmail(userEmail, '🎉 Your Ratambuzza postcard is ready!',
                `Visit https://ratambuzza.ar/postcards to see it now!`);
        }
    } catch (err) {
        await updateJobStatus(pool, jobId, {
            status: 'error',
            error_message: err.message,
        });
    }
}

async function getUserPostcards(userId) {
    console.log('typeof pool:', typeof pool);
    console.log('pool.constructor.name:', pool.constructor.name);

    const [rows] = await pool.execute(`SELECT * from postcards WHERE user_id = ? LIMIT 10`, [userId]);
    return rows;
}

async function getJobResult(jobId) {
    return postcardJobs.get(jobId);
}

async function generatePostcardWithGemini(images, prompt) {
    // Real Gemini logic goes here
    return 'data:image/png;base64,FAKEIMAGE';
}

async function runJobLoop() {
    try {
        const job = await getNextPendingJob(pool);
        if (!job) return; // No job found

        console.log(`🧵 Found job ${job.id}, processing...`);
        await markJobInProgress(pool, job.id);

        const result = await processJobData(job); // generate image, etc.

        await markJobComplete(pool, job.id, result.image_url);

        console.log(`✅ Job ${job.id} completed`);
    } catch (err) {
        console.error("❌ Job processing error:", err);
        if (err.jobId) {
            await markJobFailed(err.jobId, err.message);
        }
    }
}

// Kick off the interval loop
setInterval(runJobLoop, JOB_INTERVAL_MS);

module.exports = {
    enqueuePostcardJob,
    getUserPostcards,
    getJobResult,
    runJobLoop
};
