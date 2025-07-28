const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'content.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database error:", err);
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        photo_url TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL UNIQUE,
        sinopse TEXT NOT NULL,
        cover_url TEXT NOT NULL,
        background_url TEXT NOT NULL,
        is_book_of_month BOOLEAN DEFAULT 0,
        book_of_month_date TEXT,
        added_by INTEGER REFERENCES users(id),
        page_count INTEGER DEFAULT 0,
        reading_time INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS book_authors (
        book_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        PRIMARY KEY (book_id, author_id),
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY(author_id) REFERENCES authors(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        rating INTEGER CHECK(rating BETWEEN 1 AND 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS book_categories (
        book_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (book_id, category_id),
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_books (
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, book_id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
    )`);
});

module.exports = db;