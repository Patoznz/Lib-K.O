const db = require('../db/database');

const createAuthor = (name, photoUrl, bio, callback) => {
    const sql = `INSERT INTO authors (name, photo_url, bio) VALUES (?, ?, ?)`;
    db.run(sql, [name, photoUrl || null, bio || null], function(err) {
        callback(err, this.lastID);
    });
};

const addAuthorToBook = (bookId, authorId, callback) => {
    const sql = `INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)`;
    db.run(sql, [bookId, authorId], callback);
};

const getAuthorBooks = (authorId, callback) => {
    const sql = `SELECT b.* 
                 FROM books b
                 JOIN book_authors ba ON b.id = ba.book_id
                 WHERE ba.author_id = ?`;
    db.all(sql, [authorId], callback);
};

module.exports = {
    createAuthor,
    addAuthorToBook,
    getAuthorBooks
};