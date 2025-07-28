const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./db/database');

const app = express();
const port = 3000;

// Middlewares
app.use('/fa', express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Configuração de sessão
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.join(__dirname, 'db')
  }),
  secret: 'MeuCuTaAbertoMeComeVaiComeMeComaIssoFodeFodeAIAIAIFodeSenha12345',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000 //a desgraça do tempo de sessão
  }
}));

// arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Import rotas
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// rotas API
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/debug/session', (req, res) => {
    res.json({ userId: req.session.userId });
});


// Rotas para páginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/perfil', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/user/:userId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});


app.get('/livro', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'livro.html'));
});

app.get('/editar-livro', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'editar-livro.html'));
});


app.get('/configuracoes', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Rota para verificar sessão
app.get('/api/check-session', (req, res) => {
  if (req.session.userId) {
    db.get('SELECT id, username, is_admin FROM users WHERE id = ?', 
      [req.session.userId], 
      (err, row) => {
        if (err || !row) {
          return res.json({ loggedIn: false });
        }
        res.json({ 
          loggedIn: true, 
          userId: row.id,
          username: row.username,
          isAdmin: row.is_admin === 1 //essa porra aqui é pra saber se é boolean (não tira essa porra arthur seu viado do caralho)
        });
      }
    );
  } else {
    res.json({ loggedIn: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

app.get('/adicionar-livro', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'add-book.html'));
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`use "npm run dev" para hotreload no app.js`)
});

// Após todas as rotas
app.use((err, req, res, next) => {
  console.error('\x1b[31m', '--- ERRO ---', '\x1b[0m');
  console.error('Data:', new Date().toISOString());
  console.error('Path:', req.path);
  console.error('Body:', req.body);
  console.error('Error:', err.stack);
  
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message
  });
});