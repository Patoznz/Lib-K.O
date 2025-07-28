const db = require('../db/database');

const createBook = (title, sinopse, coverUrl, backgroundUrl, isBookOfMonth, bookOfMonthDate, addedBy) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO books (
            title, 
            sinopse, 
            cover_url, 
            background_url, 
            is_book_of_month, 
            book_of_month_date,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [
            title, 
            sinopse, 
            coverUrl, 
            backgroundUrl, 
            isBookOfMonth ? 1 : 0,
            bookOfMonthDate,
            addedBy
        ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

const setBookOfMonth = (bookId, monthYear) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE books 
                     SET is_book_of_month = 1, book_of_month_date = ?
                     WHERE id = ?`;
        db.run(sql, [monthYear, bookId], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
};

const getBookOfMonth = (month) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM books 
                     WHERE is_book_of_month = 1 
                     AND book_of_month_date = ?`;
        db.get(sql, [month], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const getBookDetails = (bookId) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT b.*, 
            GROUP_CONCAT(a.name, ', ') AS authors,
            AVG(p.rating) AS avg_rating
            FROM books b
            LEFT JOIN book_authors ba ON b.id = ba.book_id
            LEFT JOIN authors a ON ba.author_id = a.id
            LEFT JOIN posts p ON b.id = p.book_id
            WHERE b.id = ?
            GROUP BY b.id`;
        db.get(sql, [bookId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

module.exports = {
    createBook,
    setBookOfMonth,
    getBookOfMonth,
    getBookDetails
};