const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'content.db');
const db = new sqlite3.Database(dbPath);
const categories = require('../public/data/categories.json');

db.serialize(() => {
    const insertStmt = db.prepare('INSERT OR IGNORE INTO categories (id, name) VALUES (?, ?)');

    for (const [id, name] of Object.entries(categories)) {
        insertStmt.run(parseInt(id), name, (err) => {
            if (err) {
                console.error(`Erro ao inserir categoria ${name}:`, err.message);
            } else {
                console.log(`Categoria ${name} inserida ou já existe.`);
            }
        });
    }

    insertStmt.finalize(() => {
        console.log('Processo de inserção de categorias finalizado!');
        db.close();
    });
});
