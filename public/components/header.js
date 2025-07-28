let currentUserId;

document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();
});

async function loadProfile() {
  const response = await fetch('/api/check-session');
  const data = await response.json();

  if (data.loggedIn) {
    const responsee = await fetch('/api/users/profile');
    const profile = await responsee.json();

    document.getElementById('nameUser').textContent = profile.username;

    const oldAvatar = document.getElementById('avatarUser');
    const newAvatar = document.createElement('img');
    newAvatar.src = profile.photo_url;
    newAvatar.alt = 'foto user';
    newAvatar.id = 'avatarUser';
    newAvatar.classList.add('avatar-img');

    oldAvatar.replaceWith(newAvatar);
  }
}

async function goToProfile() {
  const response = await fetch('/api/check-session');
  const data = await response.json();
  if (data.loggedIn) {
    window.location.href='/perfil'
  } else {
    window.location.href='/login'
  }
}

export function createHeader() {
  const header = document.createElement('header');
  header.innerHTML = `
    <div class="navbar">
    <button class="menu-toggle" aria-label="Abrir menu">
    <span class="hamburger"></span>
    </button>
      <div class="navbar-left">
        <a href="index.html"><img src="/imgs/logo.png" class="logo" onclick="window.location.href='/'"></a>
        <div class="search-container">
          <input type="text" id="global-search" placeholder="Buscar livros...">
          <div id="global-suggestions" class="suggestions-box"></div>
          <button id="search-button"><i class="fas fa-search"></i></button>
        </div>
      </div>

      <div class="navbar-center">
        <a href="/" class="home-button">Home</a>
        <a href="/adicionar-livro">Adicionar Livro</a>
      </div>

      <div class="navbar-right">
        <div id="usersDiv" class="users" onclick="goToProfile()">
          <div id="avatarUser"><i class="fa-solid fa-user"></i></div>
          <a href="/perfil"><span id="nameUser" class="nameUser">Fazer Login</span></a>
        </div>
      </div>

      <!-- Menu móvel -->
      <div class="mobile-menu">
        <a href="/" class="home-button">Home</a>
        <a href="/perfil">Meus</a>
        <a href="/adicionar-livro">Adicionar Livro</a>
      </div>

    </div>
  `;

  const menuToggle = header.querySelector('.menu-toggle');
  const mobileMenu = header.querySelector('.mobile-menu');
  const hamburger = header.querySelector('.hamburger');

  // Adiciona o evento de clique
  menuToggle.addEventListener('click', () => {
    // Alterna a classe 'active' no menu móvel
  mobileMenu.classList.toggle('active');
    
    // Animação do botão (opcional)
  hamburger.classList.toggle('active');
  });

  const globalSearch = header.querySelector('#global-search');
  const searchButton = header.querySelector('#search-button');
  const suggestionsBox = header.querySelector('#global-suggestions');

  searchButton.addEventListener('click', performGlobalSearch);
  globalSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performGlobalSearch();
  });

  globalSearch.addEventListener('input', async () => {
    const query = globalSearch.value.trim();
    
    if (query.length < 2) {
      suggestionsBox.style.display = 'none';
      return;
    }
    
    try {
      const response = await fetch(`/api/books/suggestions?q=${encodeURIComponent(query)}`);
      const suggestions = await response.json();
      showSuggestions(suggestions);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      suggestionsBox.style.display = 'none';
    }
  });

  function showSuggestions(suggestions) {
    suggestionsBox.innerHTML = '';
    
    if (suggestions.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }
    
    suggestions.forEach(suggestion => {
      const suggestionEl = document.createElement('div');
      suggestionEl.className = 'suggestion-item';
      suggestionEl.textContent = suggestion.title;
      suggestionEl.onclick = () => {
        globalSearch.value = suggestion.title;
        suggestionsBox.style.display = 'none';
        performGlobalSearch();
      };
      suggestionsBox.appendChild(suggestionEl);
    });
    
    suggestionsBox.style.display = 'block';
  }

  function performGlobalSearch() {
    const query = globalSearch.value.trim();
    suggestionsBox.style.display = 'none';
    
    if (query) {
      window.location.href = `/results.html?q=${encodeURIComponent(query)}`;
    }
  }

  return header;
}