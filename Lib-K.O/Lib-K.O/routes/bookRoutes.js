const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');

// ROTAS DE ADMIN
router.put('/:id/book-of-month', auth.isAdmin, bookController.setBookOfMonth);
// router.delete('/:id', auth.isAdmin, bookController.deleteBook); //caso precise mudar pra admin, atualmente ta uma gambiarra (13)

// ROTAS DE CRIIAÇÃO, EDIÇÃO E DELEÇÃO
router.post('/', auth.authenticate, bookController.createBook);
router.put('/:id', auth.authenticate, bookController.updateBook);
router.delete('/:id', bookController.deleteBook); //gambiara citada (8)

// ROTAS DE LEITURA
router.post('/:id/read', auth.authenticate, bookController.markBookAsRead);
router.post('/:id/unread', auth.authenticate, bookController.unmarkBookAsRead);
router.get('/:id/read-status', auth.authenticate, bookController.checkBookReadStatus);

// ROTAS DE USUÁRIO
router.get('/user/read', bookController.getUserReadBooks);
router.get('/user/:userId', bookController.getBooksByUser);
router.get('/user', auth.authenticate, bookController.getUserBooks);

// ROTAS GERAIS
router.get('/search', bookController.searchBooks);
router.get('/suggestions', bookController.getSuggestions);
router.get('/categories', bookController.getCategories);
router.get('/book-of-month', bookController.getBookOfMonth);
router.get('/:id/categories', bookController.getBookCategories);
router.get('/:id', bookController.getBookDetails);
router.get('/', bookController.getAllBooks);

module.exports = router;
