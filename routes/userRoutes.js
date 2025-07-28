const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Rotas de autenticação
router.post('/login', userController.loginUser);
router.post('/register', userController.addUser);
router.get('/logout', userController.logoutUser);

// Rotas de perfil
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.get('/:id', userController.getPublicProfile);
router.get('/comments/user', userController.getUserComments);


router.put('/:id/promote', 
    auth.authenticate,
    auth.isAdmin,
    auth.isAuthorizedForPromotion,
    userController.promoteToAdmin
);

module.exports = router;