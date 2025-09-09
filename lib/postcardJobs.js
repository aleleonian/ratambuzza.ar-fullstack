async function insertPostcard(db, userId, tripId, avatars, scene, action, status) {

  console.log('userId->', userId);
  console.log('tripId->', tripId);
  console.log('avatars->', avatars);
  console.log('scene->', scene);
  console.log('action->', action);
  console.log('status->', status);

  const sql = `
    INSERT INTO postcards (user_id, trip_id, avatars, scene, action, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute(sql, [userId, tripId, JSON.stringify(avatars), scene, action, status]);

  return result.insertId;
}

async function deletePostcard(db, postcardId) {
  await db.execute(`
    DELETE FROM postcards
    WHERE id =?
  `, [postcardId]);
}
async function markJobInProgress(db, jobIb) {
  try {
    await updateJobStatus(db, jobIb, "pending");
    return true;
  }
  catch (error) {
    console.log(error)
    return false;
  }
}
async function markJobComplete(db, jobIb) {
  try {
    await updateJobStatus(db, jobIb, "done");
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

module.exports = { deletePostcard, getTripMembersAvatars, insertPostcard, getNextPendingJob, markJobInProgress, processJobData, updateJobStatus, markJobComplete }