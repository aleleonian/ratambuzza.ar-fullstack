async function enqueuePostcardJob(db, userId, tripId, avatars, scene, action, caption) {
    const sql = `
    INSERT INTO postcards (user_id, trip_id, avatars, scene, action, caption, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;
    await db.execute(sql, [userId, tripId, JSON.stringify(avatars), scene, action, caption]);
}

async function getNextPendingJob(db, tripId) {
    const [rows] = await db.execute(`
    SELECT * FROM postcards
    WHERE status = 'pending'
    AND trip_id = ?
    ORDER BY created_at ASC
    LIMIT 1
  `, [tripId]);
    return rows[0];
}

async function updateJobStatus(db, jobId, status, result = {}) {
    const { image_url = null, error_message = null } = result;
    const completedAt = status === 'done' ? new Date() : null;

    await db.execute(`
    UPDATE postcards
    SET status = ?, image_url = ?, error_message = ?, completed_at = ?
    WHERE id = ?
  `, [status, image_url, error_message, completedAt, jobId]);
}

async function getTripMembersAvatars(db, tripId) {
    const [rows] = await db.execute(`
    SELECT u.handle, u.avatar_head_file_name, u.avatar_file_name FROM trip_members 
    JOIN users u on u.id = trip_members.user_id
    WHERE trip_id = ?
  `, [tripId]);
    return rows;
}

module.exports = { getTripMembersAvatars, enqueuePostcardJob, getNextPendingJob, updateJobStatus }