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
    await updateJobStatus(db, jobIb, { status: "pending" });
    return true;
  }
  catch (error) {
    console.log(error)
    return false;
  }
}

async function markJobFailed(db, jobIb, errorMessage) {
  try {
    await updateJobStatus(db, jobIb, { status: "error", error_message: errorMessage });
    return true;
  }
  catch (error) {
    console.log(error)
    return false;
  }
}

async function markJobComplete(db, jobIb) {
  try {
    await updateJobStatus(db, jobIb, { status: "done" });
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

async function updateJobStatus(db, jobId, result = {}) {
  console.log('result->', result);
  const { image_url = null, thumbnail_url = null, error_message = null, status } = result;
  const completedAt = status === 'done' ? new Date() : null;

  console.log('status->', status);
  console.log('image_url->', image_url);
  console.log('thumbnailUrl->', thumbnail_url);
  console.log('error_message->', error_message);
  console.log('completedAt->', completedAt);

  let sql = 'UPDATE postcards SET ';

  const replacements = [];

  if (status) {
    sql += 'status = ?,';
    replacements.push(status);
  }

  if (image_url) {
    sql += 'image_url = ?,';
    replacements.push(image_url);
  }

  if (thumbnail_url) {
    sql += 'thumbnail_url = ?,';
    replacements.push(thumbnail_url);
  }

  if (error_message) {
    sql += 'error_message = ?,';
    replacements.push(error_message);
  }

  if (completedAt) {
    sql += 'completed_at = ?,';
    replacements.push(completedAt);
  }
  sql = sql.substring(0, sql.lastIndexOf(','));
  sql += ' WHERE id = ? ';

  console.log('sql->', sql);
  replacements.push(jobId);

  await db.execute(sql, replacements);

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

module.exports = { deletePostcard, getTripMembersAvatars, insertPostcard, getNextPendingJob, markJobInProgress, updateJobStatus, markJobComplete, markJobFailed }