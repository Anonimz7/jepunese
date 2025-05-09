let currentLevel = 'n5';
let kanjiData = [];
let filteredData = [];
let currentPage = 1;
let perPage = 10;

const levelButtons = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const perPageSelect = document.getElementById('perPage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const statusInfo = document.getElementById('statusInfo');
const kanjiContainer = document.getElementById('kanjiContainer');

document.addEventListener('DOMContentLoaded', () => {
  loadLevelData(currentLevel);
  setupEventListeners();
  loadTheme();
});

async function loadLevelData(level) {
  try {
    statusInfo.textContent = `Memuat data ${level.toUpperCase()}...`;
    kanjiContainer.innerHTML = '<div class="message">Memuat data kanji...</div>';

    const response = await fetch(`data/jlpt_${level}.json`);
    if (!response.ok) {
      throw new Error(`Gagal memuat data ${level.toUpperCase()}: ${response.status}`);
    }

    kanjiData = await response.json();
    filteredData = [...kanjiData];

    categoryFilter.disabled = false;
    categoryFilter.value = "";

    renderKanji();
    updateStatus();

    levelButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === level);
    });

  } catch (error) {
    kanjiContainer.innerHTML = `
      <div class="message error" style="color: red;">
        Gagal memuat data ${level.toUpperCase()}.
        <br><strong>Error:</strong> ${error.message}
        <br>Pastikan file <strong>data/jlpt_${level}.json</strong> ada di folder yang benar.
      </div>
    `;
    console.error("Error:", error);
    statusInfo.textContent = `Gagal memuat data ${level.toUpperCase()}.`;

    searchInput.disabled = true;
    categoryFilter.disabled = true;
    perPageSelect.disabled = true;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = '';
  }
}

function setupEventListeners() {
  levelButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentLevel = btn.dataset.level;
      currentPage = 1;
      searchInput.value = '';
      categoryFilter.value = '';
      searchInput.disabled = false;
      categoryFilter.disabled = false;
      perPageSelect.disabled = false;
      perPageSelect.value = 10;
      perPage = 10;
      loadLevelData(currentLevel);
    });
  });

  searchInput.addEventListener('input', debounce(handleSearch, 300));

  categoryFilter.addEventListener('change', () => {
    currentPage = 1;
    handleSearch();
  });

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

  document.getElementById("themeToggle").addEventListener('click', toggleTheme);
}

function handleSearch() {
  const keyword = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;

  filteredData = kanjiData.filter(item => {
    const matchesKeyword = !keyword || (
      item.kanji.includes(keyword) ||
      item.furigana.toLowerCase().includes(keyword) ||
      item.romaji.toLowerCase().includes(keyword) ||
      item.indo.toLowerCase().includes(keyword) ||
      item.inggris.toLowerCase().includes(keyword)
    );

    const matchesCategory = !selectedCategory || item.kategori === selectedCategory;

    return matchesKeyword && matchesCategory;
  });

  currentPage = 1;
  renderKanji();
  updateStatus();
}

function renderKanji() {
  if (filteredData.length === 0) {
    kanjiContainer.innerHTML = `<div class="message">Tidak ditemukan kanji yang cocok.</div>`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = '';
    return;
  }

  let dataToRender;
  if (perPage === 0) {
    dataToRender = filteredData;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    pageInfo.textContent = '';
  } else {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    dataToRender = filteredData.slice(start, end);
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
      <div class="meaning">
        <div class="indo">${item.indo}</div>
        <div class="inggris">${item.inggris}</div>
        <!-- <div class="kategori"><small>${item.kategori}</small></div> -->
      </div>
    </div>
  `).join('');
}

function updateStatus() {
  const totalItems = filteredData.length;
  let statusText = '';

  if (perPage === 0) {
    statusText = `Menampilkan semua ${totalItems} kanji ${currentLevel.toUpperCase()}`;
  } else {
    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);
    statusText = `Menampilkan ${start}-${end} dari ${totalItems} kanji ${currentLevel.toUpperCase()}`;
  }

  statusInfo.textContent = statusText;
}

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

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
