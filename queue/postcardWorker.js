// queue/postcardWorker.js
const fs = require('fs/promises');
const path = require('path');
const postcardJobs = new Map();
const { insertPostcard, getNextPendingJob, markJobFailed, markJobInProgress, markJobComplete, updateJobStatus } = require('../lib/postcardJobs');
const { GoogleGenAI, Modality } = require("@google/genai");
// const mime = require('mime-types');
const pool = require("../lib/db");
const { createThumbnail, } = require('../lib/upload');

const JOB_INTERVAL_MS = 5000;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
let workerBusy = false;

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

    const jobId = await insertPostcard(pool, userId, tripId, avatars, scene, action, "pending");
    return jobId;
}

async function processJob(data) {
    let jobId;
    try {
        let { id, avatars, background, action, mode, user_id } = data;

        jobId = id;

        if (!Array.isArray(avatars)) {
            const avatarsString = avatars;
            avatars = [];
            avatars.push(avatarsString);
        }

        const avatarFiles = await Promise.all(
            avatars.map(async name => {
                const filePath = path.resolve(__dirname, `../public/images/avatars/${name}.png`);
                const buffer = await fs.readFile(filePath);
                const base64 = buffer.toString('base64');
                return {
                    base64,
                    mimeType: 'image/png',
                    fileName: `${name}.png`
                };
            })
        );

        const prompt = buildPrompt({ avatars, background, action, mode });

        console.log("gonna call generatePostcardWithGemini");

        const { base64, mimeType } = await generatePostcardWithGemini(avatarFiles, prompt);

        console.log("generatePostcardWithGemini returned!");

        const fileName = `postcard-${Date.now()}.png`;

        const postcardDestinationPath = path.join(__dirname, '../public/uploads', fileName);

        const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

        // fs.writeFile(postcardDestinationPath, Buffer.from(base64Data, 'base64'), (err) => {
        //     if (err) console.error('Failed to write file:', err);
        //     else console.log('✅ File written successfully');
        // });

        try {
            await fs.writeFile(postcardDestinationPath, Buffer.from(base64Data, 'base64'));
            console.log('✅ File written successfully');
        } catch (err) {
            console.error('Failed to write file:', err);
        }

        let thumbName, thumbnailUrl;

        thumbName = `thumb-${fileName}`;
        // const desiredPostcardthumbnailUrl = path.join(process.cwd(), 'public', 'uploads', thumbName);
        thumbnailUrl = await createThumbnail(postcardDestinationPath, thumbName);

        console.log("thumbnail created!");

        await updateJobStatus(pool, jobId, {
            image_url: "/uploads/" + fileName,
            thumbnail_url: thumbnailUrl,
        });

        // if (userEmail) {
        //     await sendEmail(userEmail, '🎉 Your Ratambuzza postcard is ready!',
        //         `Visit https://ratambuzza.ar/postcards to see it now!`);
        // }
        return { success: true };
    } catch (err) {
        console.log('err->', err);
        return { success: false, message: err.message ? err.message : JSON.stringify(err) };
    }
}

async function getUserPostcards(userId) {
    const [rows] = await pool.execute(`SELECT * from postcards WHERE user_id = ?`, [userId]);
    return rows;
}

async function getJobResult(jobId) {
    return postcardJobs.get(jobId);
}

async function generatePostcardWithGemini(avatarImages, prompt) {

    if (avatarImages.length === 0) throw new Error('No valid avatar images found');

    const instruction = `
    You are composing a SINGLE pixel-art “postcard” (one output image only).

    Use the uploaded avatars STRICTLY as visual references for appearance (face, hair, clothing, accessories).
    Do NOT treat any single upload as the canvas to edit; instead COMPOSE a NEW scene that includes ALL the uploaded avatars TOGETHER in a single scene.

    Constraints:
    - Output exactly ONE image (one canvas, one file).
    - Show exactly the number of avatars uploaded — no more, no fewer. Do NOT add extra characters, crowds, or NPCs.
    - Place ALL avatars TOGETHER in the SAME frame, interacting naturally.
    - Think "group selfie / posed group shot" in SNES 16-bit style: smooth pixel shading, detailed sprites, nostalgic retro vibe.
    - Maintain each avatar’s clothing and accessories; you may adjust pose/expression for a natural composition.
    - No text overlays, no borders, no collage. One unified scene.
    - The uploaded images are for APPEARANCE REFERENCE ONLY. Do NOT generate one image per avatar or isolate them.

    If you generate more than one candidate internally, each candidate must still contain all uploaded avatars TOGETHER in one frame. Return only ONE final image.
    `;

    const parts = [{ text: instruction + '\n\nUser style note:\n' + prompt }];

    for (const image of avatarImages) {
        parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            candidateCount: 1,
            responseModalities: [Modality.IMAGE],
        },
    });

    const imagePart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);

    if (!imagePart) throw new Error('Gemini did not return an image');

    const { data, mimeType } = imagePart.inlineData;

    return { base64: data, mimeType };

}

async function runJobLoop() {
    if (workerBusy) {
        console.log("Worker is busy, trying later.")
        return;
    }
    const job = await getNextPendingJob(pool);
    if (!job) return; // No job found

    console.log(`🧵 Found job ${job.id}, processing...`);

    workerBusy = true;

    try {

        await markJobInProgress(pool, job.id);

        const result = await processJob(job); // generate image, etc.

        console.log('processJob result->', result);

        if (result.success) {
            await markJobComplete(pool, job.id);
            console.log(`✅ Job ${job.id} completed`);
        }
        else {
            markJobFailed(pool, job.id, result.message);
            console.log(`❌ Job ${job.id} marked as failed`);
        }

    } catch (err) {
        console.error("❌ Job processing error:", err);
        await markJobFailed(job.id, err.message);
    }
    finally {
        workerBusy = false;
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
