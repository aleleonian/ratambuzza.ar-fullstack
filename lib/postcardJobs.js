async function insertPostcard(db, userId, tripId, avatars, scene, action, status) {

  const sql = `
    INSERT INTO postcards (user_id, trip_id, avatars, scene, action, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(sql, [userId, tripId, JSON.stringify(avatars), scene, action, status]);

  return result.insertId;
}

async function markJobInProgress(db, jobIb) {
  try {
    await updateJobStatus(db, jobIb, "in progress");
    return true;
  }
  catch (error) {
    console.log(error)
    return false;
  }
}
async function markJobComplete(db, jobIb) {
  try {
    await updateJobStatus(db, jobIb, "complete");
    return true;
  }
  catch (error) {
    console.log(error)
    return false;
  }
}

async function getNextPendingJob(db) {
  const [rows] = await db.execute(`
    SELECT * FROM postcards
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
  `);
  return rows[0];
}

async function updateJobStatus(db, jobId, status, result = {}) {
  const { image_url = null, error_message = null } = result;
  const completedAt = status === 'complete' ? new Date() : null;

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
    ORDER by u.handle ASC
  `, [tripId]);
  return rows;
}

async function processJobData(db, jobId) {
  console.log("processJobData()");
  return { image_url: "https://www.generatedimages.com/my_img" };
}

module.exports = { getTripMembersAvatars, insertPostcard, getNextPendingJob, markJobInProgress, processJobData, updateJobStatus, markJobComplete }