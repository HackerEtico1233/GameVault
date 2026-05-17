// ═══════════════════════════════════════════════
//  FreeToGame API — Endpoints disponibles
//  GET /api/games                          → todos
//  GET /api/games?platform=windows|browser|all
//  GET /api/games?category={genre}
//  GET /api/games?sort-by=release-date|popularity|alphabetical|relevance
//  GET /api/games?platform=X&category=Y&sort-by=Z
//  GET /api/filter?tag=3d.mmorpg.pvp&platform=windows
//  GET /api/game?id={id}                   → detalle
// ═══════════════════════════════════════════════

const BASE_URL = "https://www.freetogame.com/api";

// Tags disponibles en la API para filtro avanzado
const ALL_TAGS = [
  "mmorpg","shooter","strategy","moba","racing","sports","social","sandbox",
  "open-world","survival","pvp","pve","pixel","voxel","zombie","turn-based",
  "first-person","third-Person","top-down","tank","space","sailing",
  "side-scroller","superhero","permadeath","card","battle-royale","mmo",
  "mmofps","mmotps","3d","2d","anime","fantasy","sci-fi","fighting",
  "action-rpg","action","military","martial-arts","flight","low-spec",
  "tower-defense","horror","mmorts"
];

// ─── Fallback (sin conexión) ───────────────────
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

// ─── Auth local ────────────────────────────────
function getUsers()        { return JSON.parse(localStorage.getItem("gv_users") || "{}"); }
function saveUsers(u)      { localStorage.setItem("gv_users", JSON.stringify(u)); }
function getSession()      { return localStorage.getItem("gv_session") || null; }
function setSession(u)     { localStorage.setItem("gv_session", u); }
function clearSession()    { localStorage.removeItem("gv_session"); }
function favKey(u)         { return `gv_favorites_${u}`; }

async function hashPassword(password) {
  const data = new TextEncoder().encode(password + "gv_salt_2024");
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Estado ────────────────────────────────────
let currentUser    = getSession();
let favorites      = new Set(currentUser ? JSON.parse(localStorage.getItem(favKey(currentUser)) || "[]") : []);
let allGames       = [];       // catálogo completo cargado
let currentResults = [];       // resultado filtrado local
let usingFallback  = false;
let selectedTags   = new Set();
let detailCache    = {};       // cache de fichas individuales

// ─── DOM ───────────────────────────────────────
const searchInput     = document.querySelector("#searchInput");
const platformFilter  = document.querySelector("#platformFilter");
const genreFilter     = document.querySelector("#genreFilter");
const sortFilter      = document.querySelector("#sortFilter");
const tagFilter       = document.querySelector("#tagFilter");
const gameGrid        = document.querySelector("#gameGrid");
const resultText      = document.querySelector("#resultText");
const emptyState      = document.querySelector("#emptyState");
const totalGamesEl    = document.querySelector("#totalGames");
const favoriteCountEl = document.querySelector("#favoriteCount");
const clearFilters    = document.querySelector("#clearFilters");
const tagCloud        = document.querySelector("#tagCloud");

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

// Modal detalle
const detailModal   = document.querySelector("#detailModal");
const detailClose   = document.querySelector("#detailClose");
const detailContent = document.querySelector("#detailContent");

// ─── Modal Auth ────────────────────────────────
function openModal(tab = "login") {
  authModal.hidden = false;
  document.body.style.overflow = "hidden";
  switchTab(tab);
  clearErrors();
}
function closeModalFn() { authModal.hidden = true; document.body.style.overflow = ""; }
function clearErrors()  { loginError.hidden = regError.hidden = true; loginError.textContent = regError.textContent = ""; }
function showError(el, msg) { el.textContent = msg; el.hidden = false; }
function switchTab(tab) {
  authTabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  tabLogin.hidden    = tab !== "login";
  tabRegister.hidden = tab !== "register";
  clearErrors();
}

loginBtn.addEventListener("click", () => openModal("login"));
closeModal.addEventListener("click", closeModalFn);
authModal.addEventListener("click", e => { if (e.target === authModal) closeModalFn(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") { if (!authModal.hidden) closeModalFn(); if (!detailModal.hidden) closeDetail(); } });
authTabs.forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));
[loginUser, loginPass].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") loginSubmit.click(); }));
[regUser, regPass, regPass2].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") regSubmit.click(); }));

// ─── Auth UI ───────────────────────────────────
function updateAuthUI() {
  if (currentUser) {
    loginBtn.hidden = true; userMenu.hidden = false;
    userNameEl.textContent   = currentUser;
    userAvatarEl.textContent = currentUser.charAt(0).toUpperCase();
  } else {
    loginBtn.hidden = false; userMenu.hidden = true;
  }
}

loginSubmit.addEventListener("click", async () => {
  const u = loginUser.value.trim(), p = loginPass.value;
  if (!u || !p) { showError(loginError, "Completa todos los campos."); return; }
  const users = getUsers(), h = await hashPassword(p);
  if (!users[u] || users[u] !== h) { showError(loginError, "Usuario o contraseña incorrectos."); return; }
  currentUser = u; setSession(u);
  favorites = new Set(JSON.parse(localStorage.getItem(favKey(u)) || "[]"));
  closeModalFn(); updateAuthUI(); renderGames();
  loginUser.value = loginPass.value = "";
});

regSubmit.addEventListener("click", async () => {
  const u = regUser.value.trim(), p = regPass.value, p2 = regPass2.value;
  if (!u || !p || !p2)  { showError(regError, "Completa todos los campos."); return; }
  if (u.length < 3)     { showError(regError, "El usuario debe tener al menos 3 caracteres."); return; }
  if (p.length < 6)     { showError(regError, "La contraseña debe tener al menos 6 caracteres."); return; }
  if (p !== p2)         { showError(regError, "Las contraseñas no coinciden."); return; }
  const users = getUsers();
  if (users[u])         { showError(regError, "Ese nombre de usuario ya está en uso."); return; }
  users[u] = await hashPassword(p); saveUsers(users);
  currentUser = u; setSession(u); favorites = new Set();
  closeModalFn(); updateAuthUI(); renderGames();
  regUser.value = regPass.value = regPass2.value = "";
});

logoutBtn.addEventListener("click", () => {
  clearSession(); currentUser = null; favorites = new Set();
  updateAuthUI(); renderGames();
});

// ─── Tag Cloud ─────────────────────────────────
function buildTagCloud() {
  tagCloud.innerHTML = "";
  ALL_TAGS.forEach(tag => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tagBtn";
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener("click", () => toggleTag(tag, btn));
    tagCloud.appendChild(btn);
  });
}

function toggleTag(tag, btn) {
  if (selectedTags.has(tag)) { selectedTags.delete(tag); btn.classList.remove("active"); }
  else                       { selectedTags.add(tag);    btn.classList.add("active"); }
  loadGamesFromAPI();
}

// ─── Construcción de URL API ───────────────────
function buildApiUrl() {
  // Si hay tags seleccionados → usar /filter
  if (selectedTags.size > 0) {
    const tags     = [...selectedTags].join(".");
    const platform = platformFilter.value !== "todos"
      ? (platformFilter.value === "pc" ? "windows" : "browser")
      : null;
    let url = `${BASE_URL}/filter?tag=${encodeURIComponent(tags)}`;
    if (platform) url += `&platform=${platform}`;
    return url;
  }

  // Sin tags → /games con parámetros
  const params = new URLSearchParams();
  const platform = platformFilter.value;
  const genre    = genreFilter.value;
  const sort     = sortFilter.value;

  if (platform !== "todos") params.set("platform", platform === "pc" ? "windows" : "browser");

  // Categoría directa desde la API si coincide con un tag conocido
  if (genre !== "todos") {
    const apiCategory = genre.toLowerCase().replace(/\s+/g, "-");
    params.set("category", apiCategory);
  }

  // Ordenamiento API
  const sortMap = { name: "alphabetical", releaseDesc: "release-date", releaseAsc: "release-date", relevance: "relevance" };
  if (sortMap[sort]) params.set("sort-by", sortMap[sort]);

  const qs = params.toString();
  return qs ? `${BASE_URL}/games?${qs}` : `${BASE_URL}/games`;
}

// ─── Carga de juegos ───────────────────────────
async function loadGamesFromAPI() {
  setLoading("Consultando FreeToGame API...");
  try {
    const url      = buildApiUrl();
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("Sin resultados");

    usingFallback  = false;
    allGames       = data;
    currentResults = data;
    fillGenresFromData(data);
    filterGamesLocally();
  } catch (err) {
    // Si ya teníamos datos, no reemplazarlos
    if (allGames.length > 0) { filterGamesLocally(); return; }
    usingFallback  = true;
    allGames       = FALLBACK_GAMES;
    currentResults = FALLBACK_GAMES;
    fillGenresFromData(FALLBACK_GAMES);
    filterGamesLocally();
  }
}

// ─── Géneros desde los datos recibidos ─────────
function fillGenresFromData(games) {
  const current = genreFilter.value;
  const genres  = [...new Set(games.map(g => g.genre).filter(Boolean))].sort();
  genreFilter.innerHTML = '<option value="todos">Todos</option>';
  genres.forEach(g => genreFilter.add(new Option(g, g)));
  if ([...genreFilter.options].some(o => o.value === current)) genreFilter.value = current;
}

// ─── Filtro local (búsqueda de texto) ──────────
function filterGamesLocally() {
  const query = searchInput.value.trim().toLowerCase();
  currentResults = query
    ? allGames.filter(g => `${g.title} ${g.genre} ${g.platform} ${g.short_description}`.toLowerCase().includes(query))
    : [...allGames];
  renderGames();
}

// ─── Ordenamiento local (solo releaseAsc necesita inversión) ──
function getSortedResults() {
  const sorted = [...currentResults];
  const s = sortFilter.value;
  if (s === "name")        sorted.sort((a, b) => a.title.localeCompare(b.title));
  if (s === "releaseDesc") sorted.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  if (s === "releaseAsc")  sorted.sort((a, b) => new Date(a.release_date) - new Date(b.release_date));
  return sorted;
}

// ─── Render ────────────────────────────────────
function escapeHtml(v) {
  return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function renderGames() {
  const results = getSortedResults();
  gameGrid.innerHTML = "";

  results.forEach(item => {
    const isFav  = favorites.has(String(item.id));
    const poster = item.thumbnail || "";
    const card   = document.createElement("article");
    card.className = "gameCard";
    card.style.setProperty("--cover-color",  "#51d6a3");
    card.style.setProperty("--cover-accent", "#20212c");

    card.innerHTML = `
      <div class="cover ${poster ? "" : "posterFallback"}" ${poster ? `style="background-image:linear-gradient(180deg,transparent 28%,rgba(0,0,0,.86)),url('${escapeHtml(poster)}')"` : ""}>
        <button class="favoriteButton ${isFav ? "active" : ""}" type="button"
          aria-label="Favorito ${escapeHtml(item.title)}" data-id="${escapeHtml(item.id)}">
          ${isFav ? "&#9733;" : "&#9734;"}
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
        <div class="cardActions">
          <a class="gameLink" href="${escapeHtml(item.game_url)}" target="_blank" rel="noreferrer">Ver juego</a>
          <button class="detailBtn" type="button" data-id="${escapeHtml(item.id)}">+ Info</button>
        </div>
      </div>
    `;
    gameGrid.appendChild(card);
  });

  const label = usingFallback ? "Modo sin conexión — " : "";
  totalGamesEl.textContent    = `${allGames.length} juegos`;
  favoriteCountEl.textContent = `${favorites.size} favoritos`;
  resultText.textContent      = results.length
    ? `${label}Mostrando ${results.length} de ${allGames.length} juegos.`
    : "No hay juegos que coincidan.";
  emptyState.hidden = results.length > 0;
}

function setLoading(msg) {
  gameGrid.innerHTML = `<p class="statusLine">${msg}</p>`;
  emptyState.hidden  = true;
  resultText.textContent = msg;
}

// ─── Modal Detalle ─────────────────────────────
async function openDetail(id) {
  detailModal.hidden   = false;
  document.body.style.overflow = "hidden";
  detailContent.innerHTML = `<p class="detailLoading">Cargando ficha del juego...</p>`;

  try {
    let game = detailCache[id];
    if (!game) {
      const res = await fetch(`${BASE_URL}/game?id=${id}`);
      if (!res.ok) throw new Error();
      game = await res.json();
      detailCache[id] = game;
    }

    const screenshots = (game.screenshots || []).slice(0, 3);

    detailContent.innerHTML = `
      <div class="detailHero" style="background-image:linear-gradient(to bottom,transparent 40%,#14181f),url('${escapeHtml(game.thumbnail)}')"></div>
      <div class="detailBody">
        <div class="detailMeta">
          <span class="detailGenre">${escapeHtml(game.genre)}</span>
          <span class="detailPlatform">${escapeHtml(game.platform)}</span>
          ${game.release_date ? `<span class="detailDate">${escapeHtml(game.release_date)}</span>` : ""}
        </div>
        <h2 class="detailTitle">${escapeHtml(game.title)}</h2>
        <p class="detailDesc">${escapeHtml(game.description || game.short_description)}</p>

        <div class="detailGrid">
          ${game.developer  ? `<div class="detailStat"><span>Desarrollador</span><strong>${escapeHtml(game.developer)}</strong></div>` : ""}
          ${game.publisher  ? `<div class="detailStat"><span>Publisher</span><strong>${escapeHtml(game.publisher)}</strong></div>` : ""}
          ${game.freetogame_profile_url ? `<div class="detailStat"><span>Perfil</span><a href="${escapeHtml(game.freetogame_profile_url)}" target="_blank" rel="noreferrer">FreeToGame ↗</a></div>` : ""}
        </div>

        ${screenshots.length ? `
          <div class="detailScreenshots">
            ${screenshots.map(s => `<img src="${escapeHtml(s.image)}" alt="Screenshot" loading="lazy">`).join("")}
          </div>` : ""}

        <div class="detailFooter">
          <a class="gameLink" href="${escapeHtml(game.game_url)}" target="_blank" rel="noreferrer">Jugar ahora</a>
          ${game.freetogame_profile_url ? `<a class="detailProfileLink" href="${escapeHtml(game.freetogame_profile_url)}" target="_blank" rel="noreferrer">Ver en FreeToGame</a>` : ""}
        </div>
      </div>
    `;
  } catch {
    detailContent.innerHTML = `<p class="detailLoading" style="color:#ffd3d3">No se pudo cargar la ficha de este juego.</p>`;
  }
}

function closeDetail() {
  detailModal.hidden = true;
  document.body.style.overflow = "";
}

detailClose.addEventListener("click", closeDetail);
detailModal.addEventListener("click", e => { if (e.target === detailModal) closeDetail(); });

// ─── Eventos del grid ──────────────────────────
gameGrid.addEventListener("click", e => {
  const favBtn    = e.target.closest(".favoriteButton");
  const detailBtn = e.target.closest(".detailBtn");
  if (favBtn)    toggleFavorite(favBtn.dataset.id);
  if (detailBtn) openDetail(detailBtn.dataset.id);
});

function toggleFavorite(id) {
  if (!currentUser) { openModal("login"); return; }
  if (favorites.has(id)) favorites.delete(id);
  else                   favorites.add(id);
  localStorage.setItem(favKey(currentUser), JSON.stringify([...favorites]));
  renderGames();
}

// ─── Eventos de filtros ────────────────────────
// Plataforma, género y ordenamiento → recarga desde API
[platformFilter, genreFilter].forEach(el => {
  el.addEventListener("change", loadGamesFromAPI);
});

sortFilter.addEventListener("change", () => {
  // El sort local no requiere nueva llamada a la API
  renderGames();
});

// Búsqueda → solo filtro local sobre los datos ya cargados
searchInput.addEventListener("input", filterGamesLocally);

clearFilters.addEventListener("click", () => {
  searchInput.value    = "";
  platformFilter.value = "todos";
  genreFilter.value    = "todos";
  sortFilter.value     = "relevance";
  // Limpiar tags
  selectedTags.clear();
  document.querySelectorAll(".tagBtn.active").forEach(b => b.classList.remove("active"));
  loadGamesFromAPI();
  searchInput.focus();
});

// ─── Init ──────────────────────────────────────
updateAuthUI();
buildTagCloud();
loadGamesFromAPI();
