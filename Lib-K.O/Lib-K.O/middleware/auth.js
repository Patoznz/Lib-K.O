const db = require('../db/database');

module.exports = {
     authenticate: (req, res, next) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        next();
    },
    
    isAdmin: (req, res, next) => {
        const sql = 'SELECT is_admin FROM users WHERE id = ?';
        db.get(sql, [req.session.userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row || !row.is_admin) {
                return res.status(403).json({ error: 'Acesso negado. Requer permissão de administrador' });
            }
            next();
        });
    },

    isAuthorizedForPromotion: (req, res, next) => {
        const userId = req.params.id;
        const adminEmails = process.env.ADMIN_EMAILS 
            ? process.env.ADMIN_EMAILS.split(',') 
            : [];

        const sql = 'SELECT email FROM users WHERE id = ?';
        db.get(sql, [userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Usuário não encontrado' });
            
            if (!adminEmails.includes(row.email)) {
                return res.status(403).json({ 
                    error: 'Email não autorizado para promoção',
                    email: row.email
                });
            }
            next();
        });
    }
};