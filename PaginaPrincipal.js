// ─── Datos del catálogo ────────────────────────
const API_URL = "https://www.freetogame.com/api/games";
const MINIMUM_GAMES = 10;
const FALLBACK_GAMES = [
  { id: 540, title: "Overwatch 2", thumbnail: "https://www.freetogame.com/g/540/thumbnail.jpg", short_description: "Hero shooter por equipos con combates rapidos y personajes variados.", game_url: "https://www.freetogame.com/open/overwatch-2", genre: "Shooter", platform: "PC", publisher: "Blizzard Entertainment", release_date: "2022-10-04" },
  { id: 516, title: "PUBG: BATTLEGROUNDS", thumbnail: "https://www.freetogame.com/g/516/thumbnail.jpg", short_description: "Battle royale tactico donde solo sobrevive el ultimo equipo en pie.", game_url: "https://www.freetogame.com/open/pubg", genre: "Shooter", platform: "PC", publisher: "KRAFTON", release_date: "2022-01-12" },
  { id: 475, title: "Genshin Impact", thumbnail: "https://www.freetogame.com/g/475/thumbnail.jpg", short_description: "RPG de mundo abierto con exploracion, poderes elementales y personajes coleccionables.", game_url: "https://www.freetogame.com/open/genshin-impact", genre: "Action RPG", platform: "PC", publisher: "HoYoverse", release_date: "2020-09-28" },
  { id: 523, title: "Fall Guys", thumbnail: "https://www.freetogame.com/g/523/thumbnail.jpg", short_description: "Fiesta multijugador con rondas de plataformas, obstaculos y eliminacion.", game_url: "https://www.freetogame.com/open/fall-guys", genre: "Battle Royale", platform: "PC", publisher: "Mediatonic", release_date: "2020-08-04" },
  { id: 466, title: "Valorant", thumbnail: "https://www.freetogame.com/g/466/thumbnail.jpg", short_description: "Shooter tactico competitivo con agentes, habilidades y partidas por rondas.", game_url: "https://www.freetogame.com/open/valorant", genre: "Shooter", platform: "PC", publisher: "Riot Games", release_date: "2020-06-02" },
  { id: 452, title: "Call of Duty: Warzone", thumbnail: "https://www.freetogame.com/g/452/thumbnail.jpg", short_description: "Battle royale de Call of Duty con armas modernas y mapas de gran escala.", game_url: "https://www.freetogame.com/open/call-of-duty-warzone", genre: "Shooter", platform: "PC", publisher: "Activision", release_date: "2020-03-10" },
  { id: 340, title: "Game of Thrones Winter is Coming", thumbnail: "https://www.freetogame.com/g/340/thumbnail.jpg", short_description: "Estrategia en navegador basada en construccion, alianzas y conquista.", game_url: "https://www.freetogame.com/open/game-of-thrones-winter-is-coming", genre: "Strategy", platform: "Web Browser", publisher: "GTArcade", release_date: "2019-11-14" },
  { id: 345, title: "Forge of Empires", thumbnail: "https://www.freetogame.com/g/345/thumbnail.jpg", short_description: "Construye una ciudad y avanza por diferentes eras historicas.", game_url: "https://www.freetogame.com/open/forge-of-empires", genre: "Strategy", platform: "Web Browser", publisher: "InnoGames", release_date: "2012-04-17" },
  { id: 212, title: "WolfTeam", thumbnail: "https://www.freetogame.com/g/212/thumbnail.jpg", short_description: "Shooter en linea con transformaciones y modos de combate rapidos.", game_url: "https://www.freetogame.com/open/wolfteam", genre: "Shooter", platform: "PC", publisher: "Aeria Games", release_date: "2009-07-09" },
  { id: 9, title: "Wolfenstein: Enemy Territory", thumbnail: "https://www.freetogame.com/g/9/thumbnail.jpg", short_description: "Shooter clasico por equipos con objetivos, clases y partidas multijugador.", game_url: "https://www.freetogame.com/open/wolfenstein-enemy-territory", genre: "Shooter", platform: "PC", publisher: "Splash Damage", release_date: "2003-05-29" }
];



function getUsers() {
  return JSON.parse(localStorage.getItem("gv_users") || "{}");
}

function saveUsers(users) {
  localStorage.setItem("gv_users", JSON.stringify(users));
}

function getSession() {
  return localStorage.getItem("gv_session") || null;
}

function setSession(username) {
  localStorage.setItem("gv_session", username);
}

function clearSession() {
  localStorage.removeItem("gv_session");
}


async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "gv_salt_2024");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function getFavoriteKey(username) {
  return `gv_favorites_${username}`;
}


let currentUser = getSession();
let favorites = new Set(
  currentUser ? JSON.parse(localStorage.getItem(getFavoriteKey(currentUser)) || "[]") : []
);
let allGames = [];
let currentResults = [];
let usingFallback = false;


const searchInput    = document.querySelector("#searchInput");
const platformFilter = document.querySelector("#platformFilter");
const genreFilter    = document.querySelector("#genreFilter");
const sortFilter     = document.querySelector("#sortFilter");
const gameGrid       = document.querySelector("#gameGrid");
const resultText     = document.querySelector("#resultText");
const emptyState     = document.querySelector("#emptyState");
const totalGamesEl   = document.querySelector("#totalGames");
const favoriteCountEl= document.querySelector("#favoriteCount");
const clearFilters   = document.querySelector("#clearFilters");

const loginBtn    = document.querySelector("#loginBtn");
const authModal   = document.querySelector("#authModal");
const closeModal  = document.querySelector("#closeModal");
const logoutBtn   = document.querySelector("#logoutBtn");
const userMenu    = document.querySelector("#userMenu");
const userAvatarEl= document.querySelector("#userAvatar");
const userNameEl  = document.querySelector("#userName");

const loginUser   = document.querySelector("#loginUser");
const loginPass   = document.querySelector("#loginPass");
const loginSubmit = document.querySelector("#loginSubmit");
const loginError  = document.querySelector("#loginError");

const regUser     = document.querySelector("#regUser");
const regPass     = document.querySelector("#regPass");
const regPass2    = document.querySelector("#regPass2");
const regSubmit   = document.querySelector("#regSubmit");
const regError    = document.querySelector("#regError");

const authTabs    = document.querySelectorAll(".authTab");
const tabLogin    = document.querySelector("#tabLogin");
const tabRegister = document.querySelector("#tabRegister");


function openModal(tab = "login") {
  authModal.hidden = false;
  document.body.style.overflow = "hidden";
  switchTab(tab);
  clearErrors();
}

function closeModalFn() {
  authModal.hidden = true;
  document.body.style.overflow = "";
}

function clearErrors() {
  loginError.hidden = true;
  regError.hidden   = true;
  loginError.textContent = "";
  regError.textContent   = "";
}

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}

function switchTab(tab) {
  authTabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  tabLogin.hidden    = tab !== "login";
  tabRegister.hidden = tab !== "register";
  clearErrors();
}

loginBtn.addEventListener("click", () => openModal("login"));
closeModal.addEventListener("click", closeModalFn);
authModal.addEventListener("click", (e) => { if (e.target === authModal) closeModalFn(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !authModal.hidden) closeModalFn(); });
authTabs.forEach(tab => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));


[loginUser, loginPass].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") loginSubmit.click(); }));
[regUser, regPass, regPass2].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") regSubmit.click(); }));


function updateAuthUI() {
  if (currentUser) {
    loginBtn.hidden  = true;
    userMenu.hidden  = false;
    userNameEl.textContent = currentUser;
    userAvatarEl.textContent = currentUser.charAt(0).toUpperCase();
  } else {
    loginBtn.hidden  = false;
    userMenu.hidden  = true;
  }
}


loginSubmit.addEventListener("click", async () => {
  const username = loginUser.value.trim();
  const password = loginPass.value;

  if (!username || !password) {
    showError(loginError, "Completa todos los campos.");
    return;
  }

  const users = getUsers();
  const hashed = await hashPassword(password);

  if (!users[username] || users[username] !== hashed) {
    showError(loginError, "Usuario o contraseña incorrectos.");
    return;
  }

  currentUser = username;
  setSession(username);
  favorites = new Set(JSON.parse(localStorage.getItem(getFavoriteKey(username)) || "[]"));
  closeModalFn();
  updateAuthUI();
  renderGames();
  loginUser.value = "";
  loginPass.value = "";
});


regSubmit.addEventListener("click", async () => {
  const username = regUser.value.trim();
  const password = regPass.value;
  const password2 = regPass2.value;

  if (!username || !password || !password2) {
    showError(regError, "Completa todos los campos.");
    return;
  }

  if (username.length < 3) {
    showError(regError, "El usuario debe tener al menos 3 caracteres.");
    return;
  }

  if (password.length < 6) {
    showError(regError, "La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  if (password !== password2) {
    showError(regError, "Las contraseñas no coinciden.");
    return;
  }

  const users = getUsers();

  if (users[username]) {
    showError(regError, "Ese nombre de usuario ya está en uso.");
    return;
  }

  const hashed = await hashPassword(password);
  users[username] = hashed;
  saveUsers(users);

 
  currentUser = username;
  setSession(username);
  favorites = new Set();
  closeModalFn();
  updateAuthUI();
  renderGames();
  regUser.value  = "";
  regPass.value  = "";
  regPass2.value = "";
});


logoutBtn.addEventListener("click", () => {
  clearSession();
  currentUser = null;
  favorites   = new Set();
  updateAuthUI();
  renderGames();
});


function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTime(date) {
  return new Date(date).getTime() || 0;
}

function fillGenres() {
  const genres = [...new Set(allGames.map(g => g.genre).filter(Boolean))].sort();
  genreFilter.innerHTML = '<option value="todos">Todos</option>';
  genres.forEach(genre => genreFilter.add(new Option(genre, genre)));
}

function getSortedResults() {
  return [...currentResults].sort((a, b) => {
    if (sortFilter.value === "name")        return a.title.localeCompare(b.title);
    if (sortFilter.value === "releaseDesc") return getTime(b.release_date) - getTime(a.release_date);
    if (sortFilter.value === "releaseAsc")  return getTime(a.release_date) - getTime(b.release_date);
    return 0;
  });
}

function filterGames() {
  const query    = searchInput.value.trim().toLowerCase();
  const platform = platformFilter.value;
  const genre    = genreFilter.value;

  currentResults = allGames.filter(game => {
    const searchText = `${game.title} ${game.genre} ${game.platform} ${game.short_description}`.toLowerCase();
    return (
      searchText.includes(query) &&
      (platform === "todos" || game.platform.toLowerCase().includes(platform)) &&
      (genre    === "todos" || game.genre === genre)
    );
  });

  renderGames();
}

function renderGames() {
  const results = getSortedResults();
  gameGrid.innerHTML = "";

  results.forEach(item => {
    const isFavorite = favorites.has(String(item.id));
    const poster     = item.thumbnail || "";
    const card       = document.createElement("article");
    card.className   = "gameCard";
    card.style.setProperty("--cover-color",  "#51d6a3");
    card.style.setProperty("--cover-accent", "#20212c");

    card.innerHTML = `
      <div class="cover ${poster ? "" : "posterFallback"}" ${poster ? `style="background-image: linear-gradient(180deg, transparent 28%, rgba(0,0,0,.86)), url('${escapeHtml(poster)}')"` : ""}>
        <button class="favoriteButton ${isFavorite ? "active" : ""}" type="button"
          aria-label="Marcar ${escapeHtml(item.title)} como favorito"
          data-id="${escapeHtml(item.id)}">
          ${isFavorite ? "&#9733;" : "&#9734;"}
        </button>
        <span class="rating">${escapeHtml(item.genre)}</span>
      </div>
      <div class="cardBody">
        <div class="cardTitleRow">
          <h3>${escapeHtml(item.title)}</h3>
          <span>${escapeHtml(item.release_date || "N/D")}</span>
        </div>
        <p>${escapeHtml(item.short_description)}</p>
        <div class="platforms">
          <span>${escapeHtml(item.platform)}</span>
          <span>${escapeHtml(item.publisher || "FreeToGame")}</span>
        </div>
        <a class="gameLink" href="${escapeHtml(item.game_url)}" target="_blank" rel="noreferrer">Ver juego</a>
      </div>
    `;

    gameGrid.appendChild(card);
  });

  totalGamesEl.textContent    = `${allGames.length} juegos`;
  favoriteCountEl.textContent = `${favorites.size} favoritos`;
  resultText.textContent = results.length
    ? `${usingFallback ? "Modo respaldo: " : ""}Mostrando ${results.length} de ${allGames.length} juegos.`
    : "No hay juegos que coincidan con esos filtros.";
  emptyState.hidden = results.length > 0;
}

function setLoading(message) {
  gameGrid.innerHTML = `<p class="statusLine">${message}</p>`;
  emptyState.hidden  = true;
  resultText.textContent = message;
}

async function loadGames() {
  setLoading("Cargando juegos desde FreeToGame...");
  try {
    const response = await fetch(API_URL);
    const data     = await response.json();
    if (!Array.isArray(data) || data.length < MINIMUM_GAMES) throw new Error();
    usingFallback  = false;
    allGames       = data;
    currentResults = data;
  } catch {
    usingFallback  = true;
    allGames       = FALLBACK_GAMES;
    currentResults = FALLBACK_GAMES;
  }
  fillGenres();
  filterGames();
}

function toggleFavorite(id) {
  if (!currentUser) {
    openModal("login");
    return;
  }
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }
  localStorage.setItem(getFavoriteKey(currentUser), JSON.stringify([...favorites]));
  renderGames();
}

// ─── Eventos ───────────────────────────────────
[searchInput, platformFilter, genreFilter].forEach(el => {
  el.addEventListener("input",  filterGames);
  el.addEventListener("change", filterGames);
});

sortFilter.addEventListener("change", renderGames);

gameGrid.addEventListener("click", e => {
  const btn = e.target.closest(".favoriteButton");
  if (btn) toggleFavorite(btn.dataset.id);
});

clearFilters.addEventListener("click", () => {
  searchInput.value    = "";
  platformFilter.value = "todos";
  genreFilter.value    = "todos";
  sortFilter.value     = "relevance";
  filterGames();
  searchInput.focus();
});

// ─── Init ──────────────────────────────────────
updateAuthUI();
loadGames();
