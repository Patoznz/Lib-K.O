const db = require('../db/database');

const createPost = (userId, bookId, title, content, rating, callback) => {
    const sql = `INSERT INTO posts (user_id, book_id, title, content, rating) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [userId, bookId, title, content, rating], function(err) {
        callback(err, this.lastID);
    });
};

const getBookReviews = (bookId, callback) => {
    const sql = `SELECT p.*, u.username, u.photo_url 
                 FROM posts p
                 JOIN users u ON p.user_id = u.id
                 WHERE p.book_id = ?`;
    db.all(sql, [bookId], callback);
};

const addComment = (postId, userId, content, callback) => {
    const sql = `INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)`;
    db.run(sql, [postId, userId, content], function(err) {
        callback(err, this.lastID);
    });
};

const getPostComments = (postId, callback) => {
    const sql = `SELECT c.*, u.username, u.photo_url 
                 FROM comments c
                 JOIN users u ON c.user_id = u.id
                 WHERE c.post_id = ?`;
    db.all(sql, [postId], callback);
};

function getUserReviews(userId, callback) {
    const sql = `
        SELECT 
            p.id AS post_id,
            p.title,
            p.content,
            p.rating,
            p.created_at,
            b.id AS book_id,
            b.title AS book_title,
            b.cover_url
        FROM posts p
        JOIN books b ON p.book_id = b.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    `;
    db.all(sql, [userId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows);
    });
}

module.exports = {
    createPost,
    getBookReviews,
    addComment,
    getPostComments,
    getUserReviews
};