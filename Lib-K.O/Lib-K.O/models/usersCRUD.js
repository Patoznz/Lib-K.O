const sqlite3 = require('sqlite3').verbose();
const db = require('../db/database')

function createUser(username, email, password, photo_url, callback) {
    const adminEmails = process.env.ADMIN_EMAILS 
        ? process.env.ADMIN_EMAILS.split(',') 
        : [];
    
    const isAdmin = adminEmails.includes(email) ? 1 : 0;

    const sql = `INSERT INTO users (username, email, password, photo_url, is_admin) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [username, email, password, photo_url, isAdmin], function(err) {
        callback(err, { id: this.lastID });
    });
}

function getUserById(id, callback) {
  const sql = `SELECT * FROM users WHERE id = ?`;
  db.get(sql, [id], (err, row) => {
    if (err) return callback(err);
    callback(null, row);
  });
}

module.exports = { createUser };