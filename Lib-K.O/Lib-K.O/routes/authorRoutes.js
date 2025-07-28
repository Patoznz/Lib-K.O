const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const auth = require('../middleware/auth');

router.post('/', auth.isAdmin, authorController.createAuthor);
router.put('/:id', auth.isAdmin, authorController.updateAuthor);
router.get('/', authorController.getAllAuthors);
router.get('/:id', authorController.getAuthorDetails);
router.get('/:id/books', authorController.getAuthorBooks);

module.exports = router;