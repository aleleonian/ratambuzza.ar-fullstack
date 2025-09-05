// queue/postcardWorker.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const postcardJobs = new Map();
const { insertPostcard } = require('../lib/postcardJobs');
// const { sendEmail } = require('../lib/email');

function buildPrompt({ avatars, background, action, caption, mode }) {
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

async function enqueuePostcardJob(data) {
    const jobId = uuidv4();
    await insertPostcard({ id: jobId, ...data, status: 'pending' });
    setTimeout(() => processJob(jobId, data), 0);
    return jobId;
}

async function processJob(jobId, data) {
    try {
        const { avatars, background, action, caption, mode, userId, userEmail } = data;
        const avatarFiles = avatars.map(name => {
            const filePath = path.resolve(__dirname, `../public/assets/avatars/${name}.png`);
            const base64 = fs.readFileSync(filePath).toString('base64');
            return { base64, mimeType: 'image/png', fileName: `${name}.png` };
        });

        const prompt = buildPrompt({ avatars, background, action, caption, mode });
        const imageDataUrl = await generatePostcardWithGemini(avatarFiles, prompt);

        await db.updatePostcard(jobId, {
            status: 'done',
            image_url: imageDataUrl,
            completed_at: new Date(),
        });

        if (userEmail) {
            await sendEmail(userEmail, '🎉 Your Ratambuzza postcard is ready!',
                `Visit https://ratambuzza.ar/postcards to see it now!`);
        }
    } catch (err) {
        await db.updatePostcard(jobId, {
            status: 'error',
            error_message: err.message,
        });
    }
}

async function getUserPostcards(db, userId) {
    const [rows] = await db.execute(`SELECT * from postcards WHERE user_id = ? LIMIT 10`, [userId]);
    return rows;
}

async function getJobResult(jobId) {
    return postcardJobs.get(jobId);
}

async function generatePostcardWithGemini(images, prompt) {
    // Real Gemini logic goes here
    return 'data:image/png;base64,FAKEIMAGE';
}

module.exports = {
    enqueuePostcardJob,
    getUserPostcards,
    getJobResult
};
