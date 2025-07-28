const booksCRUD = require('../models/booksCRUD');
const db = require('../db/database');
const Fuse = require('fuse.js');

exports.getBookCategories = async (req, res) => {
    const bookId = req.params.id;
    
    try {
        const categories = await new Promise((resolve, reject) => {
            db.all(`
                SELECT c.id, c.name 
                FROM categories c
                JOIN book_categories bc ON c.id = bc.category_id
                WHERE bc.book_id = ?
            `, [bookId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllCategories = async () => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM categories', [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await this.getAllCategories();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createBook = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const { title, sinopse, coverUrl, backgroundUrl, authors, isBookOfMonth, bookOfMonthDate, pageCount, readingTime, categories } = req.body;

    try {
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT is_admin FROM users WHERE id = ?', [req.session.userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        
        if (isBookOfMonth && !user.is_admin) {
            return res.status(403).json({ error: 'Apenas administradores podem definir livro do mês' });
        }

        const bookId = await new Promise((resolve, reject) => {
            const sql = `INSERT INTO books (
                title, 
                sinopse, 
                cover_url, 
                background_url, 
                is_book_of_month, 
                book_of_month_date,
                added_by,
                page_count,
                reading_time
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            db.run(sql, [
                title, 
                sinopse, 
                coverUrl, 
                backgroundUrl, 
                isBookOfMonth ? 1 : 0,
                isBookOfMonth ? bookOfMonthDate : null,
                req.session.userId,
                pageCount || 0,
                readingTime || 0
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        const authorIds = [];
        for (const authorName of authors) {
            const existingAuthor = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM authors WHERE name = ?', [authorName], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            let authorId;
            if (existingAuthor) {
                authorId = existingAuthor.id;
            } else {
                authorId = await new Promise((resolve, reject) => {
                    db.run('INSERT INTO authors (name) VALUES (?)', [authorName], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID); 
                    });
                });
            }
            authorIds.push(authorId);
        }
        for (const authorId of authorIds) {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)', 
                    [bookId, authorId], 
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        if (categories && categories.length > 0) {
            for (const categoryId of categories) {
                await new Promise((resolve, reject) => {
                    db.run('INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)', 
                        [bookId, categoryId], 
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        res.status(201).json({ id: bookId });
    } catch (err) {
        console.error('Erro no createBook:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateBook = async (req, res) => {
    const bookId = req.params.id;
    const { title, sinopse, coverUrl, backgroundUrl, pageCount, readingTime, authors, categories } = req.body;
    
    try {
        const book = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!book) return res.status(404).json({ error: 'Livro não encontrado' });
        
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        
        if (!user.is_admin && book.added_by !== req.session.userId) {
            return res.status(403).json({ error: 'Permissão negada' });
        }
        
        await new Promise((resolve, reject) => {
            const sql = `UPDATE books SET 
                title = ?, 
                sinopse = ?, 
                cover_url = ?, 
                background_url = ?,
                page_count = ?,
                reading_time = ?
                WHERE id = ?`;
                
            db.run(sql, [title, sinopse, coverUrl, backgroundUrl, pageCount, readingTime, bookId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM book_authors WHERE book_id = ?', [bookId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        for (const authorName of authors) {
            let author = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM authors WHERE name = ?', [authorName], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            let authorId;
            if (author) {
                authorId = author.id;
            } else {
                authorId = await new Promise((resolve, reject) => {
                    db.run('INSERT INTO authors (name) VALUES (?)', [authorName], function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });
            }

            await new Promise((resolve, reject) => {
                db.run('INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)', 
                    [bookId, authorId], 
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        await new Promise((resolve, reject) => {
            db.run('DELETE FROM book_categories WHERE book_id = ?', [bookId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        for (const categoryId of categories) {
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO book_categories (book_id, category_id) VALUES (?, ?)', 
                    [bookId, categoryId], 
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteBook = async (req, res) => {
    const bookId = req.params.id;
    
    try {
        const book = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!book) return res.status(404).json({ error: 'Livro não encontrado' });
        
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE id = ?', [req.session.userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
        
        if (!user.is_admin && book.added_by !== req.session.userId) {
            return res.status(403).json({ error: 'Apenas administradores podem excluir livros' });
        }
        
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM books WHERE id = ?', [bookId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.setBookOfMonth = async (req, res) => {
    const bookId = req.params.id;
    const { monthYear } = req.body;
    
    try {
        const changes = await booksCRUD.setBookOfMonth(bookId, monthYear);
        res.json({ success: true, changes });
    } catch (err) {
        console.error('Erro ao definir livro do mês:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getBookOfMonth = async (req, res) => {
    try {
        let month = req.query.month?.replace('-', '/');
        
        if (!month) {
            const today = new Date();
            month = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
        }

        const book = await new Promise((resolve, reject) => {
            db.get(`
                SELECT * FROM books 
                WHERE is_book_of_month = 1 
                AND book_of_month_date = ?
                LIMIT 1
            `, [month], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });

        if (!book) {
            return res.status(404).json({ 
                error: 'Nenhum livro do mês encontrado',
                month: month
            });
        }

        const [authors, categories] = await Promise.all([
            new Promise((resolve) => {
                db.all(`
                    SELECT a.name FROM authors a
                    JOIN book_authors ba ON a.id = ba.author_id
                    WHERE ba.book_id = ?
                `, [book.id], (err, rows) => {
                    resolve(err ? [] : rows.map(r => r.name));
                });
            }),
            new Promise((resolve) => {
                db.all(`
                    SELECT c.name FROM categories c
                    JOIN book_categories bc ON c.id = bc.category_id
                    WHERE bc.book_id = ?
                `, [book.id], (err, rows) => {
                    resolve(err ? [] : rows.map(r => r.name));
                });
            })
        ]);

        res.json({
            ...book,
            authors: authors.join(', '),
            categories: categories.join(', ')
        });

    } catch (err) {
        console.error('Erro em getBookOfMonth:', err);
        res.status(500).json({ 
            error: 'Erro interno ao buscar livro do mês',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

exports.getAllBooks = async (req, res) => {
    try {
        const books = await new Promise((resolve, reject) => {
            const sql = `
                SELECT b.*, 
                GROUP_CONCAT(a.name, ', ') AS authors,
                GROUP_CONCAT(c.name, ', ') AS categories
                FROM books b
                LEFT JOIN book_authors ba ON b.id = ba.book_id
                LEFT JOIN authors a ON ba.author_id = a.id
                LEFT JOIN book_categories bc ON b.id = bc.book_id
                LEFT JOIN categories c ON bc.category_id = c.id
                GROUP BY b.id
                ORDER BY b.created_at DESC
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getBookDetails = async (req, res) => {
    const bookId = req.params.id;
    console.log(`Recebida requisição para detalhes do livro ID: ${bookId}`);
    
    try {
        const book = await new Promise((resolve, reject) => {
            const sql = `
                SELECT b.*, 
                GROUP_CONCAT(a.name, ', ') AS authors,
                AVG(p.rating) AS avg_rating
                FROM books b
                LEFT JOIN book_authors ba ON b.id = ba.book_id
                LEFT JOIN authors a ON ba.author_id = a.id
                LEFT JOIN posts p ON b.id = p.book_id
                WHERE b.id = ?
                GROUP BY b.id`;
                
            db.get(sql, [bookId], (err, row) => {
                if (err) {
                    console.error('Erro na consulta SQL:', err);
                    reject(err);
                } else {
                    console.log('Resultado da consulta:', row);
                    resolve(row);
                }
            });
        });
        
        if (!book) {
            console.log(`Livro com ID ${bookId} não encontrado`);
            return res.status(404).json({ error: 'Livro não encontrado' });
        }
        
        console.log('Enviando resposta:', book);
        res.json(book);
    } catch (err) {
        console.error('Erro em getBookDetails:', err);
        res.status(500).json({ 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

exports.getBooksByUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        const books = await new Promise((resolve, reject) => {
            const sql = `
                SELECT b.*, 
                GROUP_CONCAT(a.name, ', ') AS authors
                FROM books b
                LEFT JOIN book_authors ba ON b.id = ba.book_id
                LEFT JOIN authors a ON ba.author_id = a.id
                WHERE b.added_by = ?
                GROUP BY b.id
            `;
            db.all(sql, [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserBooks = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    try {
        const books = await new Promise((resolve, reject) => {
            const sql = `
                SELECT b.*, 
                GROUP_CONCAT(a.name, ', ') AS authors
                FROM books b
                LEFT JOIN book_authors ba ON b.id = ba.book_id
                LEFT JOIN authors a ON ba.author_id = a.id
                WHERE b.added_by = ?
                GROUP BY b.id
                ORDER BY b.created_at DESC
            `;
            db.all(sql, [req.session.userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.markBookAsRead = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const bookId = req.params.id;
    
    try {
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT INTO user_books (user_id, book_id) 
                VALUES (?, ?)
                ON CONFLICT(user_id, book_id) DO NOTHING
            `, [req.session.userId, bookId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.unmarkBookAsRead = async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const bookId = req.params.id;
    
    try {
        await new Promise((resolve, reject) => {
            db.run(`
                DELETE FROM user_books 
                WHERE user_id = ? AND book_id = ?
            `, [req.session.userId, bookId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserReadBooks = async (req, res) => {
    const userId = req.query.userId;

    if (!userId) {
        return res.status(400).json({ error: 'Parâmetro userId é obrigatório' });
    }

    try {
        const bookIds = await new Promise((resolve, reject) => {
            db.all("SELECT book_id FROM user_books WHERE user_id = ?", [userId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(row => row.book_id));
            });
        });

        if (bookIds.length === 0) {
            return res.json([]);
        }

        const books = [];

        for (const bookId of bookIds) {
            const book = await new Promise((resolve) => {
                db.get("SELECT id, title, cover_url FROM books WHERE id = ?", [bookId], (err, row) => {
                    resolve(row || null);
                });
            });

            if (book) {
                const authors = await new Promise((resolve) => {
                    db.all(`
                        SELECT a.name 
                        FROM authors a
                        JOIN book_authors ba ON a.id = ba.author_id
                        WHERE ba.book_id = ?
                    `, [bookId], (err, rows) => {
                        resolve(rows.map(r => r.name).join(', '));
                    });
                });

                books.push({
                    ...book,
                    authors: authors
                });
            }
        }

        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.checkBookReadStatus = async (req, res) => {
    if (!req.session.userId) {
        return res.json({ read: false });
    }
    
    const bookId = req.params.id;
    
    try {
        const result = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 1 as read 
                FROM user_books 
                WHERE user_id = ? AND book_id = ?
            `, [req.session.userId, bookId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        res.json({ read: !!result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.searchBooks = async (req, res) => {
    const query = req.query.q;
    const sort = req.query.sort || 'relevance';
    
    if (!query) {
        return res.status(400).json({ error: 'Parâmetro de busca ausente' });
    }

    try {
        const allBooks = await new Promise((resolve, reject) => {
            const sql = `
                SELECT b.*, 
                GROUP_CONCAT(a.name, ', ') AS authors,
                GROUP_CONCAT(c.name, ', ') AS categories
                FROM books b
                LEFT JOIN book_authors ba ON b.id = ba.book_id
                LEFT JOIN authors a ON ba.author_id = a.id
                LEFT JOIN book_categories bc ON b.id = bc.book_id
                LEFT JOIN categories c ON bc.category_id = c.id
                GROUP BY b.id
            `;
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const fuseOptions = {
            keys: ['title', 'authors', 'categories'],
            includeScore: true,
            threshold: 0.3,
            minMatchCharLength: 2
        };
        
        const fuse = new Fuse(allBooks, fuseOptions);
        let results = fuse.search(query).map(result => result.item);

        if (sort === 'newest') {
            results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sort === 'oldest') {
            results.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSuggestions = async (req, res) => {
    const query = req.query.q;
    
    if (!query || query.length < 2) {
        return res.json([]);
    }

    try {
        const allBooks = await new Promise((resolve, reject) => {
            const sql = "SELECT id, title FROM books";
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const fuseOptions = {
            keys: ['title'],
            includeScore: true,
            threshold: 0.4,
            minMatchCharLength: 2
        };
        
        const fuse = new Fuse(allBooks, fuseOptions);
        const results = fuse.search(query)
            .slice(0, 5)
            .map(result => result.item);

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};