const db = require('../db/database');
const bcrypt = require('bcrypt');

exports.addUser = (req, res) => {
    const { username, email, password, photo_url } = req.body;

    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Erro ao gerar hash' });

        const query = `
            INSERT INTO users (username, email, password, photo_url)
            VALUES (?, ?, ?, ?)
        `;

        db.run(query, [username, email, hash, photo_url], function (err) {
            if (err) return res.status(500).json({ error: 'Erro ao inserir usuário: ' + err.message });
            res.status(201).json({ id: this.lastID });
        });
    });
};

exports.promoteToAdmin = async (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ error: 'Acesso negado. Requer permissão de administrador' });
    }

    const userId = req.params.id;
    const adminEmails = process.env.ADMIN_EMAILS ? 
        process.env.ADMIN_EMAILS.split(',') : [];

    try {
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT email FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        if (!adminEmails.includes(user.email)) {
            return res.status(403).json({ 
                error: 'Email não autorizado para promoção',
                email: user.email
            });
        }

        await new Promise((resolve, reject) => {
            db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        res.json({ success: true, message: 'Usuário promovido a administrador' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
  }

  const query = `SELECT * FROM users WHERE email = ?`;

  db.get(query, [email], (err, user) => {
    if (err) {
      console.error('Erro no banco:', err);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos.' });
    }

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) {
        console.error('Erro no bcrypt:', err);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
      }

      if (!match) {
        return res.status(401).json({ error: 'Email ou senha inválidos.' });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.is_admin === 1;
      
      res.json({ 
        id: user.id, 
        username: user.username, 
        email: user.email,
        isAdmin: user.is_admin === 1
      });
    });
  });
};

exports.logoutUser = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};

exports.getUserProfile = (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const sql = `SELECT id, username, email, photo_url, is_admin FROM users WHERE id = ?`;
    db.get(sql, [req.session.userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar perfil' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(row);
    });
};

exports.updateUserProfile = (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }

    const { username, photo_url, email, newPassword } = req.body;
    console.log('Dados recebidos:', { username, photo_url, email });

    if (username && username.trim() === '') {
        return res.status(400).json({ error: 'Nome de usuário não pode estar vazio' });
    }

    const updates = [];
    const params = [];

    if (username) {
        updates.push('username = ?');
        params.push(username.trim());
    }
    if (photo_url) {
        updates.push('photo_url = ?');
        params.push(photo_url);
    }
    if (email) {
        updates.push('email = ?');
        params.push(email);
    }

    const executeUpdate = (passwordUpdates = [], passwordParams = []) => {
        if (updates.length === 0 && passwordUpdates.length === 0) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar' });
        }

        const allUpdates = [...updates, ...passwordUpdates];
        const allParams = [...params, ...passwordParams, req.session.userId];

        const sql = `UPDATE users SET ${allUpdates.join(', ')} WHERE id = ?`;
        console.log('SQL:', sql, allParams);

        db.run(sql, allParams, function(err) {
            if (err) {
                console.error('Erro no banco de dados:', err);
                return res.status(500).json({ error: 'Erro ao atualizar perfil' });
            }
            
            if (username) {
                req.session.username = username;
            }
            
            res.json({ 
                success: true,
                changes: this.changes
            });
        });
    };

    if (newPassword) {
        bcrypt.hash(newPassword, 10, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Erro ao criptografar senha' });
            }
            executeUpdate(['password = ?'], [hash]);
        });
    } else {
        executeUpdate();
    }
};

exports.getUserComments = (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: 'Parâmetro userId é obrigatório' });
    }

    const sql = `
        SELECT 
            c.id,
            c.content,
            c.created_at,
            p.title AS review_title,
            p.id AS review_id,
            b.title AS book_title,
            b.id AS book_id
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        JOIN books b ON p.book_id = b.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error('Erro ao buscar comentários:', err);
            return res.status(500).json({ error: 'Erro interno ao buscar comentários' });
        }
        res.json(rows);
    });
};

exports.getPublicProfile = (req, res) => {
    const userId = req.params.id;
    const sql = `SELECT id, username, photo_url, created_at FROM users WHERE id = ?`;
    
    db.get(sql, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar perfil' });
        }
        if (!row) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(row);
    });
};
