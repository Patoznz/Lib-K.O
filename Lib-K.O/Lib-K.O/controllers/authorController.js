const db = require('../db/database');
const authorsCRUD = require('../models/authorsCRUD');

exports.createAuthor = async (req, res) => {
    const { name, photoUrl, bio } = req.body;
    try {
        const authorId = await authorsCRUD.createAuthor(name, photoUrl, bio);
        res.status(201).json({ id: authorId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAuthor = async (req, res) => {
    const { id } = req.params;
    const { name, photoUrl, bio } = req.body;
    try {
        const sql = `UPDATE authors SET name = ?, photo_url = ?, bio = ? WHERE id = ?`;
        await db.run(sql, [name, photoUrl || null, bio || null, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllAuthors = async (req, res) => {
    try {
        const authors = await db.all('SELECT * FROM authors');
        res.json(authors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAuthorDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const author = await db.get('SELECT * FROM authors WHERE id = ?', [id]);
        if (!author) return res.status(404).json({ error: 'Autor não encontrado' });
        res.json(author);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAuthorBooks = async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT b.* 
            FROM books b
            JOIN book_authors ba ON b.id = ba.book_id
            WHERE ba.author_id = ?
        `;
        const books = await db.all(sql, [id]);
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};