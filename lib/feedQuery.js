function buildFeedWhereClause({ tripId, search, userFilter, excludeIds = [] }) {
    let clause = 'WHERE p.trip_id = ?';
    const params = [tripId];

    if (search) {
        clause += ' AND p.content LIKE ?';
        params.push(`%${search}%`);
    }

    if (userFilter) {
        clause += ' AND p.user_id = ?';
        params.push(userFilter);
    }

    if (excludeIds.length) {
        const placeholders = excludeIds.map(() => '?').join(',');
        clause += ` AND p.id NOT IN (${placeholders})`;
        params.push(...excludeIds);
    }

    return { clause, params };
}

function getFeedSelectColumns() {
    return `
    SELECT p.*, u.handle, u.avatar_head_file_name,
      EXISTS (
        SELECT 1 FROM likes_posts WHERE user_id = ? AND post_id = p.id
      ) AS liked_by_user,
      (SELECT COUNT(*) FROM likes_posts WHERE post_id = p.id) AS like_count,
      (SELECT COUNT(*) FROM post_replies WHERE post_id = p.id) AS replies_count
    FROM posts p
    JOIN users u ON u.id = p.user_id
  `;
}

async function getFeedPosts(db, {
    tripId,
    userId,
    search,
    userFilter,
    excludeIds = [],
    limit = 10 // or POSTS_PER_PAGE, null for no limit
}) {
    const { clause, params } = buildFeedWhereClause({ tripId, search, userFilter, excludeIds });
    const finalParams = [userId, ...params];

    // Add LIMIT clause only if limit is specified
    const limitClause = limit ? `LIMIT ${limit}` : '';

    const [posts] = await db.execute(`
    ${getFeedSelectColumns()}
    ${clause}
    ORDER BY p.created_at DESC, p.id DESC
    ${limitClause}
  `, finalParams);

    await Promise.all(posts.map(async post => {
        const [mediaRows] = await db.execute(`
      SELECT id, url, thumbnail_url, width, height
      FROM media
      WHERE post_id = ?
    `, [post.id]);
        post.media = mediaRows;
    }));

    return posts;
}

module.exports = { buildFeedWhereClause, getFeedSelectColumns, getFeedPosts }