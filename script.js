// Config
let currentLevel = 'n5';
let kanjiData = [];
let filteredData = [];
let currentPage = 1;
let perPage = 10;

// DOM Elements
const levelButtons = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('searchInput');
const perPageSelect = document.getElementById('perPage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const statusInfo = document.getElementById('statusInfo');
const kanjiContainer = document.getElementById('kanjiContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadLevelData(currentLevel);
  setupEventListeners();
  loadTheme();
});

// Load JSON Data for Selected Level
async function loadLevelData(level) {
  try {
    statusInfo.textContent = `Memuat data ${level.toUpperCase()}...`;
    kanjiContainer.innerHTML = '<div class="message">Memuat data kanji...</div>';

    // Pastikan path ke file JSON benar relatif terhadap file HTML
    const response = await fetch(`data/${level}.json`);
    if (!response.ok) {
        if (response.status === 404) {
             throw new Error(`File data/${level}.json tidak ditemukan.`);
        } else {
             throw new Error(`Gagal memuat data ${level.toUpperCase()}: ${response.status}`);
        }
    }

    kanjiData = await response.json();
    filteredData = [...kanjiData];

    renderKanji();
    updateStatus();

    // Update active level button
    levelButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === level);
    });

  } catch (error) {
    kanjiContainer.innerHTML = `
      <div class="message error" style="color: red;">
        Gagal memuat data ${level.toUpperCase()}.
        <br><strong>Error:</strong> ${error.message}
        <br>Pastikan file <strong>data/${level}.json</strong> ada di folder yang benar.
      </div>
    `;
    console.error("Error:", error);
    statusInfo.textContent = `Gagal memuat data ${level.toUpperCase()}.`;
    // Disable controls if data fails to load
    searchInput.disabled = true;
    perPageSelect.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = ''; // Clear page info
  }
}

// Event Listeners
function setupEventListeners() {
  // Level selector
  levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentLevel = btn.dataset.level;
      currentPage = 1;
      // Reset controls state when loading new level
      searchInput.value = '';
      searchInput.disabled = false;
      perPageSelect.disabled = false;
      perPageSelect.value = 10; // Reset to default per page
      perPage = 10;
      loadLevelData(currentLevel);
    });
  });

  // Search with debounce
  searchInput.addEventListener('input', debounce(handleSearch, 300));

  // Pagination controls
  perPageSelect.addEventListener('change', () => {
    perPage = parseInt(perPageSelect.value);
    currentPage = 1;
    renderKanji();
    updateStatus();
  });

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderKanji();
      updateStatus();
    }
  });

  nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / perPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderKanji();
      updateStatus();
    }
  });

  // Theme toggle
  document.getElementById("themeToggle").addEventListener('click', toggleTheme);
}

// Search Function
function handleSearch() {
  const keyword = searchInput.value.toLowerCase().trim();

  if (!keyword) {
    filteredData = [...kanjiData];
  } else {
    filteredData = kanjiData.filter(item =>
      item.kanji.includes(keyword) ||
      item.furigana.toLowerCase().includes(keyword) ||
      item.romaji.toLowerCase().includes(keyword) ||
      item.meaning.toLowerCase().includes(keyword)
    );
  }

  currentPage = 1;
  renderKanji();
  updateStatus();
}

// Render Kanji Cards
function renderKanji() {
  if (filteredData.length === 0) {
    kanjiContainer.innerHTML = `
      <div class="message">
        Tidak ditemukan kanji yang cocok.
      </div>
    `;
    // Disable pagination if no results
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = '';
    return;
  }

  // Pagination logic
  let dataToRender;
  if (perPage === 0) { // Show All
    dataToRender = filteredData;
     // Disable pagination controls when showing all
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = '';
  } else {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    dataToRender = filteredData.slice(start, end);
     // Enable/disable pagination controls based on pages
    const totalPages = Math.ceil(filteredData.length / perPage);
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    pageInfo.textContent = `Halaman ${currentPage}/${totalPages}`;
  }


  kanjiContainer.innerHTML = dataToRender.map(item => `
    <div class="kanji-card">
      <div class="kanji">${item.kanji}</div>
      <div class="furigana">${item.furigana}</div>
      <div class="romaji">${item.romaji}</div>
      <div class="meaning">${item.meaning}</div>
    </div>
  `).join('');
}

// Update Status
function updateStatus() {
  const totalItems = filteredData.length;
  let statusText = '';

  if (perPage === 0) {
    statusText = `Menampilkan semua ${totalItems} kanji ${currentLevel.toUpperCase()}`;
  } else {
    const totalPages = Math.ceil(totalItems / perPage);
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);

    statusText = `Menampilkan ${start}-${end} dari ${totalItems} kanji ${currentLevel.toUpperCase()}`;
    // Page info text handled within renderKanji when perPage is not 0
  }

  statusInfo.textContent = statusText;
}

// Debounce Function
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// Theme Functions
function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.querySelector('.theme-toggle i');

  if (theme === 'dark') {
    icon.classList.replace('fa-moon', 'fa-sun');
  } else {
    icon.classList.replace('fa-sun', 'fa-moon');
  }
}