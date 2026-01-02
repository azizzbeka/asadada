// Burger menyu va sidebar uchun mobil funksionallik
document.addEventListener('DOMContentLoaded', function () {
  const burger = document.getElementById('burger-menu');
  const sidebar = document.getElementById('sidebar');
  if (burger && sidebar) {
    burger.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      // Burger tugmasini yashirish/ko'rsatish
      if (sidebar.classList.contains('open')) {
        burger.style.opacity = '0';
        burger.style.pointerEvents = 'none';
      } else {
        burger.style.opacity = '1';
        burger.style.pointerEvents = 'auto';
      }
    });
    // Sidebar ochiq bo'lsa, tashqariga bosilganda yopiladi
    document.addEventListener('click', function (e) {
      if (
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== burger
      ) {
        sidebar.classList.remove('open');
        burger.style.opacity = '1';
        burger.style.pointerEvents = 'auto';
      }
    });
  }
});
/**
 * Anime Recommendation Engine
 * @param {Object[]} animeList - Array of anime objects (from anime-data.json)
 * @param {Object} options
 *   - genre: (string) genre to filter by (optional)
 *   - lastWatched: (string) anime name for similarity (optional)
 *   - exclude: (string[]) anime names to avoid recommending (optional)
 *   - count: (number) number of recommendations (default 5)
 * @returns {Object[]} Array of recommended anime objects
 */
function getRecommendations(animeList, options = {}) {
  const {
    genre = null,
    lastWatched = null,
    exclude = [],
    count = 5
  } = options;

  // Helper: get genres for a given anime name
  function getGenresByName(name) {
    const found = animeList.find(a => a.name.toLowerCase() === name.toLowerCase());
    return found ? found.genres || found.genre || [] : [];
  }

  // Helper: scoring function
  function score(anime) {
    let s = 0;
    // Genre match
    if (genre && anime.genres.map(g => g.toLowerCase()).includes(genre.toLowerCase())) s += 5;
    // Similarity to last watched
    if (lastWatched) {
      const lastGenres = getGenresByName(lastWatched);
      const common = anime.genres.filter(g => lastGenres.includes(g));
      s += common.length * 2;
    }
    // Popularity (normalized)
    s += (anime.popularity || 0);
    // Rating (normalized, assume 0-10)
    s += (anime.rating || 0) * 2;
    return s;
  }

  // Exclude already recommended or watched anime
  const excludeSet = new Set((exclude || []).map(n => n.toLowerCase()));
  if (lastWatched) excludeSet.add(lastWatched.toLowerCase());

  // Filter and score
  let candidates = animeList.filter(a => !excludeSet.has(a.name.toLowerCase()));
  if (genre) {
    candidates = candidates.filter(a => a.genres.map(g => g.toLowerCase()).includes(genre.toLowerCase()));
    if (candidates.length === 0) candidates = animeList.filter(a => !excludeSet.has(a.name.toLowerCase()));
  }

  // Score and sort
  candidates = candidates
    .map(a => ({ anime: a, score: score(a) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(obj => obj.anime);

  return candidates;
}
// --- Anime AI Chatbot Frontend Only ---
// Author: KIwei AI
// Description: Anime expert AI chatbot (Uzbek) with localStorage memory


const chatArea = document.getElementById('chat-area');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
// Sidebar elements
const sidebar = document.getElementById('sidebar');
const historyList = document.getElementById('history-list');
const newChatBtn = document.getElementById('new-chat');
const sidebarExportBtn = document.getElementById('sidebar-export');
const sidebarImportBtn = document.getElementById('sidebar-import');
const sidebarImportFile = document.getElementById('sidebar-import-file');
const sidebarUsernameInput = document.getElementById('sidebar-username');
const sidebarSaveUsernameBtn = document.getElementById('sidebar-save-username');
// Old header elements (for backward compatibility)
const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username');
const exportBtn = document.getElementById('export-history');
const importBtn = document.getElementById('import-history');
const importFile = document.getElementById('import-file');
const AVATAR_AI = 'https://img.freepik.com/vector-premium/icono-chip-inteligencia-artificial-o-ia-blanco-negro-vector-circuito_1008589-54.jpg';
const AVATAR_USER = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Font_Awesome_5_solid_user-circle.svg/1982px-Font_Awesome_5_solid_user-circle.svg.png';
let animeData = [];

// --- Load anime data ---
fetch('anime-data.json')
  .then(res => res.json())
  .then(data => { animeData = data.anime; })
  .catch(() => { animeData = []; });


// --- Chat memory (multi-history) ---
function getAllHistories() {
  return JSON.parse(localStorage.getItem('animeai_histories') || '[]');
}
function saveAllHistories(histories) {
  localStorage.setItem('animeai_histories', JSON.stringify(histories));
}
function getCurrentHistoryIndex() {
  return parseInt(localStorage.getItem('animeai_current_history') || '0', 10);
}
function setCurrentHistoryIndex(idx) {
  localStorage.setItem('animeai_current_history', idx);
}
function getCurrentHistory() {
  const histories = getAllHistories();
  const idx = getCurrentHistoryIndex();
  return histories[idx] || [];
}
function saveCurrentHistory(history) {
  const histories = getAllHistories();
  const idx = getCurrentHistoryIndex();
  histories[idx] = history;
  saveAllHistories(histories);
}
function addNewHistory() {
  const histories = getAllHistories();
  histories.push([]);
  saveAllHistories(histories);
  setCurrentHistoryIndex(histories.length - 1);
}
function deleteHistory(idx) {
  let histories = getAllHistories();
  histories.splice(idx, 1);
  if (histories.length === 0) histories = [[]];
  saveAllHistories(histories);
  setCurrentHistoryIndex(0);
}
function saveUsername(name) {
  localStorage.setItem('animeai_username', name);
}
function loadUsername() {
  return localStorage.getItem('animeai_username') || '';
}


// --- Render chat ---
function renderChat(history) {
  chatArea.innerHTML = '';
  history.forEach(msg => addMessage(msg.sender, msg.text, false));
  scrollToBottom();
}

// --- Render sidebar histories ---
function renderSidebarHistories() {
  const histories = getAllHistories();
  const idx = getCurrentHistoryIndex();
  historyList.innerHTML = '';
  histories.forEach((h, i) => {
    const li = document.createElement('li');
    li.textContent = h.length && h[0] ? (h[0].text.slice(0, 18) + (h[0].text.length > 18 ? '...' : '')) : 'Yangi chat';
    if (i === idx) li.classList.add('active');
    li.onclick = () => {
      setCurrentHistoryIndex(i);
      renderChat(getCurrentHistory());
      renderSidebarHistories();
    };
    // Right-click to delete
    li.oncontextmenu = (e) => {
      e.preventDefault();
      if (confirm('Ushbu chat tarixini o‘chirasizmi?')) {
        deleteHistory(i);
        renderChat(getCurrentHistory());
        renderSidebarHistories();
      }
    };
    historyList.appendChild(li);
  });
}


// --- Add message to chat ---
function addMessage(sender, text, save = true) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message ' + sender;
  const avatar = document.createElement('img');
  avatar.className = 'avatar';
  avatar.src = sender === 'ai' ? AVATAR_AI : AVATAR_USER;
  const bubble = document.createElement('div');
  bubble.className = 'bubble ' + sender;
  bubble.innerText = text;
  msgDiv.appendChild(avatar);
  msgDiv.appendChild(bubble);
  chatArea.appendChild(msgDiv);
  if (save) {
    const history = getCurrentHistory();
    history.push({ sender, text });
    saveCurrentHistory(history);
    renderSidebarHistories();
  }
  scrollToBottom();
}

function scrollToBottom() {
  setTimeout(() => {
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 80);
}


// --- AI Logic ---
function aiReply(userMsg, history) {
  const msg = userMsg.trim().toLowerCase();
  const username = loadUsername();
  // Custom: "otaku" so'zi uchun javob
  if (msg.includes('otaku')) {
    return 'Otaku — anime va manga ishqibozi uchun ishlatiladigan soʻz!';
  }
  // Greetings
  if (/^(salom|assalomu|hello|hi|yo|konichiwa)/i.test(msg)) {
    return random([
      `Salom${username ? ', ' + username : ''}! Qanday yordam bera olaman?`,
      `Assalomu alaykum${username ? ', ' + username : ''}! Anime haqida savollaringiz bormi?`,
      `Hi${username ? ', ' + username : ''}! Sevimli animengiz bormi?`
    ]);
  }
  // Popular anime
  if (/eng mashhur|top|populyar|mashxur/.test(msg)) {
    const tops = animeData.slice().sort((a,b)=>b.popularity-a.popularity).slice(0,5);
    return 'Eng mashhur animelar:\n' + tops.map(a=>`• ${a.name}`).join('\n');
  }
  // Anime search by name
  const nameMatch = msg.match(/([a-zA-Z0-9' ]+) haqida( ayt| so'zlab ber|)/);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    const found = animeData.find(a => a.name.toLowerCase() === name.toLowerCase());
    if (found) return `${found.name}: ${found.desc}`;
    // Fuzzy search
    const fuzzy = animeData.find(a => a.name.toLowerCase().includes(name.toLowerCase()));
    if (fuzzy) return `${fuzzy.name}: ${fuzzy.desc}`;
    return 'Kechirasiz, bu anime haqida maʼlumot topilmadi.';
  }
  // Genre recommendation
  const genreMatch = msg.match(/([a-zA-Z]+) anime tavsiya qil/);
  if (genreMatch) {
    const genre = genreMatch[1].toLowerCase();
    const found = animeData.filter(a => a.genre.some(g => g.toLowerCase().includes(genre)));
    if (found.length)
      return `${capitalize(genre)} janridagi tavsiya: \n` + found.slice(0,3).map(a=>`• ${a.name}`).join('\n');
    return 'Kechirasiz, bu janrda anime topilmadi.';
  }
  // Anime search (short)
  if (/anime (qidir|izla|top)/.test(msg)) {
    const q = msg.replace(/.*anime (qidir|izla|top)/,'').trim();
    if (!q) return 'Qaysi anime qidiryapsiz?';
    const found = animeData.filter(a => a.name.toLowerCase().includes(q));
    if (found.length)
      return 'Natijalar:\n' + found.map(a=>`• ${a.name}`).join('\n');
    return 'Hech narsa topilmadi.';
  }
  // Recommendation
  if (/anime tavsiya|rekomendatsiya|recommend/.test(msg)) {
    const recs = animeData.slice().sort(()=>0.5-Math.random()).slice(0,3);
    return 'Sizga quyidagi animelar yoqishi mumkin:\n' + recs.map(a=>`• ${a.name}`).join('\n');
  }
  // Contextual fallback (use last user message)
  if (history && history.length > 1) {
    const prev = history.filter(m=>m.sender==='user').slice(-2,-1)[0];
    if (prev) {
      if (/anime/.test(prev.text.toLowerCase()))
        return 'Anime haqida yana savolingiz bormi?';
    }
  }
  // Fallback
  return random([
    `Kechirasiz${username ? ', ' + username : ''}, bu savolga javob bera olmadim. Yana soʻrashingiz mumkin.`,
    `Aniq javob topa olmadim${username ? ', ' + username : ''}. Boshqa savol bormi?`,
    `Qiziqarli savol! Biroq, aniq javob bera olmayman${username ? ', ' + username : ''}.`
  ]);
}

function random(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}


// --- Handle form submit ---
chatForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  addMessage('user', text);
  userInput.value = '';
  userInput.focus();
  setTimeout(() => {
    const history = getCurrentHistory();
    const aiText = aiReply(text, history);
    addMessage('ai', aiText);
  }, 500 + Math.random()*400);
});

// --- Username logic (header and sidebar) ---
function setUsernameInputFields(name) {
  if (usernameInput) usernameInput.value = name;
  if (sidebarUsernameInput) sidebarUsernameInput.value = name;
}
function handleUsernameSave(name) {
  saveUsername(name);
  setUsernameInputFields(name);
  addMessage('ai', name ? `Ismingiz saqlandi: ${name}` : 'Ismingiz o‘chirildi.');
}
if (saveUsernameBtn && usernameInput) {
  saveUsernameBtn.addEventListener('click', function() {
    handleUsernameSave(usernameInput.value.trim());
  });
  usernameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') saveUsernameBtn.click();
  });
}
if (sidebarSaveUsernameBtn && sidebarUsernameInput) {
  sidebarSaveUsernameBtn.addEventListener('click', function() {
    handleUsernameSave(sidebarUsernameInput.value.trim());
  });
  sidebarUsernameInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sidebarSaveUsernameBtn.click();
  });
}

// --- Export chat history (header and sidebar) ---
function exportCurrentHistory() {
  const history = getCurrentHistory();
  const blob = new Blob([JSON.stringify(history, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'animeai_chat_history.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
if (exportBtn) exportBtn.addEventListener('click', exportCurrentHistory);
if (sidebarExportBtn) sidebarExportBtn.addEventListener('click', exportCurrentHistory);

// --- Import chat history (header and sidebar) ---
function importHistoryFromFile(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data)) {
        saveCurrentHistory(data);
        renderChat(data);
        renderSidebarHistories();
        addMessage('ai', 'Tarix muvaffaqiyatli yuklandi!');
      } else {
        addMessage('ai', 'Fayl formati noto‘g‘ri.');
      }
    } catch {
      addMessage('ai', 'Faylni o‘qishda xatolik.');
    }
  };
  reader.readAsText(file);
  fileInput.value = '';
}
if (importBtn && importFile) {
  importBtn.addEventListener('click', function() { importFile.click(); });
  importFile.addEventListener('change', function() { importHistoryFromFile(importFile); });
}
if (sidebarImportBtn && sidebarImportFile) {
  sidebarImportBtn.addEventListener('click', function() { sidebarImportFile.click(); });
  sidebarImportFile.addEventListener('change', function() { importHistoryFromFile(sidebarImportFile); });
}

// --- New chat ---
if (newChatBtn) {
  newChatBtn.addEventListener('click', function() {
    addNewHistory();
    renderChat([]);
    renderSidebarHistories();
    setTimeout(() => {
      const username = loadUsername();
      addMessage('ai', `Salom${username ? ', ' + username : ''}! Yangi chat boshlandi. Anime haqida savol bering yoki tavsiya soʻrang!`);
    }, 400);
  });
}

// --- On load: restore chat, histories, and username ---
window.addEventListener('DOMContentLoaded', () => {
  // Migrate old single history if exists
  if (!localStorage.getItem('animeai_histories')) {
    const old = localStorage.getItem('animeai_history');
    if (old) {
      saveAllHistories([JSON.parse(old)]);
      setCurrentHistoryIndex(0);
      localStorage.removeItem('animeai_history');
    } else {
      saveAllHistories([[]]);
      setCurrentHistoryIndex(0);
    }
  }
  const username = loadUsername();
  setUsernameInputFields(username);
  renderSidebarHistories();
  const history = getCurrentHistory();
  if (history.length) {
    renderChat(history);
  } else {
    setTimeout(() => {
      addMessage('ai', `Salom${username ? ', ' + username : ''}! Men Anime AI yordamchingizman. Anime haqida savol bering yoki tavsiya soʻrang!`);
    }, 400);
  }
});
