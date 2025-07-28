const reviewsCRUD = require('../models/reviewsCRUD');

exports.createReview = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const { bookId, title, content, rating } = req.body;
    try {
        const postId = await new Promise((resolve, reject) => {
            reviewsCRUD.createPost(
                req.session.userId, 
                bookId, 
                title, 
                content, 
                rating,
                (err, id) => {
                    if (err) reject(err);
                    else resolve(id);
                }
            );
        });
        res.status(201).json({ id: postId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateReview = async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
};

exports.deleteReview = async (req, res) => {
    res.status(501).json({ error: 'Not implemented yet' });
};

exports.addComment = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const postId = req.params.id;
    const { content } = req.body;
    try {
        const commentId = await new Promise((resolve, reject) => {
            reviewsCRUD.addComment(
                postId, 
                req.session.userId, 
                content,
                (err, id) => {
                    if (err) reject(err);
                    else resolve(id);
                }
            );
        });
        res.status(201).json({ id: commentId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBookReviews = async (req, res) => {
    const bookId = req.params.bookId;
    try {
        const reviews = await new Promise((resolve, reject) => {
            reviewsCRUD.getBookReviews(bookId, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserReviews = async (req, res) => {
    const userId = req.params.userId;
    try {
        const reviews = await new Promise((resolve, reject) => {
            reviewsCRUD.getUserReviews(userId, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPostComments = async (req, res) => {
    const postId = req.params.postId;
    try {
        const comments = await new Promise((resolve, reject) => {
            reviewsCRUD.getPostComments(postId, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};