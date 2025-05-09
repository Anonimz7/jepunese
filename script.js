let currentLevel = 'n5';
let kanjiData = [];
let filteredData = [];
let currentPage = 1;
let perPage = 10;
let displayMode = 'minimal'; // State awal tampilan: 'minimal' atau 'full'

const levelButtons = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const perPageSelect = document.getElementById('perPage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const statusInfo = document.getElementById('statusInfo');
const kanjiContainer = document.getElementById('kanjiContainer');

// Ambil elemen modal
const kanjiModal = document.getElementById('kanjiModal');
const closeModalBtn = kanjiModal.querySelector('.close-button');
const modalKanji = kanjiModal.querySelector('.modal-kanji');
const modalFurigana = kanjiModal.querySelector('.modal-furigana');
const modalRomaji = kanjiModal.querySelector('.modal-romaji');
const modalIndo = kanjiModal.querySelector('.modal-indo');
const modalInggris = kanjiModal.querySelector('.modal-inggris');
const modalOnyomiList = kanjiModal.querySelector('.onyomi-list');
const modalKunyomiList = kanjiModal.querySelector('.kunyomi-list');
const modalKategori = kanjiModal.querySelector('.modal-kategori');
const modalJlpt = kanjiModal.querySelector('.modal-jlpt');

const minimalBtn = document.getElementById('minimalBtn');
const fullBtn = document.getElementById('fullBtn');


document.addEventListener('DOMContentLoaded', () => {
 loadLevelData(currentLevel);
 setupEventListeners();
 loadTheme();
});

async function loadLevelData(level) {
 try {
  statusInfo.textContent = `Memuat data ${level.toUpperCase()}...`;
  kanjiContainer.innerHTML = '<div class="message">Memuat data kanji...</div>';
  // Sembunyikan pagination dan filter saat memuat
   prevBtn.disabled = true; // Dinonaktifkan sementara loading
   nextBtn.disabled = true; // Dinonaktifkan sementara loading
   pageInfo.textContent = ''; // Dikosongkan sementara loading
  searchInput.disabled = true;
  categoryFilter.disabled = true;
  perPageSelect.disabled = true;


  const response = await fetch(`data/jlpt_${level}.json`);
  if (!response.ok) {
   throw new Error(`Gagal memuat data ${level.toUpperCase()}: ${response.status}`);
  }

  kanjiData = await response.json();
  filteredData = [...kanjiData]; // Reset filtered data

  // Aktifkan kembali kontrol setelah data dimuat
  searchInput.disabled = false;
  categoryFilter.disabled = false;
  perPageSelect.disabled = false;


  // Set display mode and render kanji
  setDisplayMode(displayMode); // Memastikan tampilan sesuai mode terakhir
  // renderKanji() dipanggil di dalam setDisplayMode()

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

  // Pastikan kontrol dinonaktifkan jika gagal load
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
   loadLevelData(currentLevel); // loadLevelData now handles enabling controls
  });
 });

 setupDisplayToggleListeners(); // Setup listeners for display mode buttons

 searchInput.addEventListener('input', debounce(handleSearch, 300));

 categoryFilter.addEventListener('change', () => {
  currentPage = 1;
  handleSearch();
 });

 perPageSelect.addEventListener('change', () => {
  perPage = parseInt(perPageSelect.value);
  currentPage = 1;
  renderKanji(); // Panggil renderKanji setelah mengubah perPage
  updateStatus();
 });

 prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
   currentPage--;
   renderKanji(); // Panggil renderKanji setelah pindah halaman
   updateStatus();
  }
 });

 nextBtn.addEventListener('click', () => {
  const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / perPage); // Fix totalPages for perPage=0
  if (perPage !== 0 && currentPage < totalPages) { // Add check for perPage !== 0
   currentPage++;
   renderKanji(); // Panggil renderKanji setelah pindah halaman
   updateStatus();
  }
 });

 document.getElementById("themeToggle").addEventListener('click', toggleTheme);

 // Set initial display mode when page loads (Dipanggil di DOMContentLoaded -> loadLevelData)
 // setDisplayMode(displayMode);
}


// --- Fungsi untuk mengatur mode tampilan ---
function setupDisplayToggleListeners() {
 minimalBtn.addEventListener('click', () => {
  setDisplayMode('minimal');
 });

 fullBtn.addEventListener('click', () => {
  setDisplayMode('full');
 });
}

// --- Fungsi untuk mengatur mode tampilan ---
function setDisplayMode(mode) {
 displayMode = mode;
 if (mode === 'minimal') {
  kanjiContainer.classList.remove('display-full');
  kanjiContainer.classList.add('display-minimal');
  minimalBtn.classList.add('active');
  fullBtn.classList.remove('active');
 } else { // mode === 'full'
  kanjiContainer.classList.remove('display-minimal');
  kanjiContainer.classList.add('display-full');
  fullBtn.classList.add('active');
  minimalBtn.classList.remove('active');
 }
 // Re-render untuk memastikan event listener card diperbarui jika mode minimal
 renderKanji();
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
   item.inggris.toLowerCase().includes(keyword) ||
   (item.onyomi && item.onyomi.some(onyomi => onyomi.kana.toLowerCase().includes(keyword) || onyomi.romaji.toLowerCase().includes(keyword))) ||
   (item.kunyomi && item.kunyomi.some(kunyomi => kunyomi.kana.toLowerCase().includes(keyword) || kunyomi.romaji.toLowerCase().includes(keyword)))
  );

  const matchesCategory = !selectedCategory || item.kategori === selectedCategory;

  return matchesKeyword && matchesCategory;
 });

 currentPage = 1;
 renderKanji(); // Panggil renderKanji setelah filter/cari
 updateStatus();
}

function renderKanji() {
 if (filteredData.length === 0) {
  kanjiContainer.innerHTML = `<div class="message">Tidak ditemukan kanji yang cocok.</div>`;
  // Pastikan pagination dinonaktifkan/sembunyikan jika tidak ada data
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  pageInfo.textContent = '';
  return;
 }

 let dataToRender;
 if (perPage === 0) {
  dataToRender = filteredData;
 } else {
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;
  dataToRender = filteredData.slice(start, end);
 }

 // Terapkan class sesuai mode tampilan sebelum merender
 if (displayMode === 'minimal') {
  kanjiContainer.classList.remove('display-full');
  kanjiContainer.classList.add('display-minimal');
 } else {
  kanjiContainer.classList.remove('display-minimal');
  kanjiContainer.classList.add('display-full');
 }


 kanjiContainer.innerHTML = dataToRender.map(item => `
  <div class="kanji-card" data-kanji='${JSON.stringify(item)}'>
   <div class="kanji">${item.kanji}</div>
   <div class="furigana">${item.furigana}</div>
        <div class="romaji">${item.romaji}</div>
   <div class="meaning">
    <div class="indo">${item.indo}</div>
    <div class="inggris">${item.inggris}</div>
   </div>
  </div>
 `).join('');

 // Atur status halaman setelah merender
 const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / perPage);
 prevBtn.disabled = currentPage === 1 || perPage === 0;
 nextBtn.disabled = currentPage === totalPages || perPage === 0;
 pageInfo.textContent = perPage === 0 ? '' : `Halaman ${currentPage}/${totalPages}`;

 // Tambahkan event listener HANYA di mode minimal
 // Penting: Event listener perlu ditambahkan kembali setiap kali kartu dirender ulang (ganti halaman, filter, dll.)
 const cards = kanjiContainer.querySelectorAll('.kanji-card');
 cards.forEach(card => {
  // Hapus listener sebelumnya untuk mencegah duplikasi
  card.removeEventListener('click', handleCardClick);
  // Tambahkan listener hanya jika dalam mode minimal
  if (displayMode === 'minimal') {
   card.addEventListener('click', handleCardClick);
  }
 });
}

// --- Fungsi handle klik card di mode minimal ---
function handleCardClick(event) {
 const card = event.currentTarget;
 // Mengambil data langsung dari atribut data-kanji
 const kanjiItem = JSON.parse(card.dataset.kanji);
 showKanjiModal(kanjiItem);
}

// --- Fungsi untuk menampilkan modal dengan detail kanji ---
function showKanjiModal(item) {
 modalKanji.textContent = item.kanji;
 modalFurigana.textContent = item.furigana;
 modalRomaji.textContent = item.romaji;
 modalIndo.textContent = item.indo;
 modalInggris.textContent = item.inggris;

 // Render Onyomi
 modalOnyomiList.innerHTML = ''; // Bersihkan list sebelumnya
 if (item.onyomi && item.onyomi.length > 0) {
  item.onyomi.forEach(reading => {
   const li = document.createElement('li');
   li.textContent = `${reading.kana} ${reading.romaji}`;
   modalOnyomiList.appendChild(li);
  });
 } else {
  const li = document.createElement('li');
  li.textContent = '-';
  modalOnyomiList.appendChild(li);
 }

 // Render Kunyomi
 modalKunyomiList.innerHTML = ''; // Bersihkan list sebelumnya
 if (item.kunyomi && item.kunyomi.length > 0) {
  item.kunyomi.forEach(reading => {
   const li = document.createElement('li');
   li.textContent = `${reading.kana} ${reading.romaji}`;
   modalKunyomiList.appendChild(li);
  });
 } else {
  const li = document.createElement('li');
  li.textContent = '-';
  modalKunyomiList.appendChild(li);
 }


 modalKategori.textContent = item.kategori || '-';
 modalJlpt.textContent = item.jlpt || '-';

 kanjiModal.classList.add('visible'); // Tampilkan modal
}

// --- Fungsi untuk menyembunyikan modal ---
function hideKanjiModal() {
 kanjiModal.classList.remove('visible'); // Sembunyikan modal
}

// --- Tambahkan event listener untuk menutup modal ---
closeModalBtn.addEventListener('click', hideKanjiModal);

// Tutup modal jika mengklik di luar modal content
kanjiModal.addEventListener('click', (event) => {
 if (event.target === kanjiModal) {
  hideKanjiModal();
 }
});


function updateStatus() {
 const totalItems = filteredData.length;
 let statusText = '';

 if (totalItems === 0) {
  statusInfo.textContent = `Tidak ada kanji ditemukan untuk N${currentLevel.toUpperCase()} dengan filter saat ini.`;
  return;
 }

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