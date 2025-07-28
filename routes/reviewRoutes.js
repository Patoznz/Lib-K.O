const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');

router.post('/', auth.authenticate, reviewController.createReview);
router.put('/:id', auth.authenticate, reviewController.updateReview);
router.delete('/:id', auth.authenticate, reviewController.deleteReview);
router.post('/:id/comments', auth.authenticate, reviewController.addComment);
router.get('/book/:bookId', reviewController.getBookReviews);
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/:postId/comments', reviewController.getPostComments);
  
router.get('/user', auth.authenticate, (req, res) => {
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }

  reviewController.getUserReviews({ params: { userId } }, res);
});


// router.get('/comments', (req, res) => {
//     const postId = req.query.postId;
//     if (!postId) {
//         return res.status(400).json({ error: 'ID do post é obrigatório' });
//     }
    
//     reviewsCRUD.getPostComments(postId, (err, comments) => {
//         if (err) {
//             return res.status(500).json({ error: err.message });
//         }
//         res.json(comments);
//     });
// });

module.exports = router;