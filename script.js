let currentLevel = 'n5';
let loadedData = []; // Mengganti kanjiData menjadi loadedData untuk menyimpan data saat ini
let filteredData = [];
let currentPage = 1;
let perPage = 14;
let displayMode = 'minimal'; // State awal tampilan: 'minimal' atau 'full'
let currentDataType = 'kanji'; // 'kanji', 'hiragana', atau 'katakana'

const levelButtons = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const perPageSelect = document.getElementById('perPage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const statusInfo = document.getElementById('statusInfo');
const kanjiContainer = document.getElementById('kanjiContainer'); // Tetap pakai nama ini di JS

// Ambil elemen modal
const kanjiModal = document.getElementById('kanjiModal'); // Tetap pakai nama ini di JS
const closeModalBtn = kanjiModal.querySelector('.close-button');
const modalKanji = kanjiModal.querySelector('.modal-kanji');
const modalFurigana = kanjiModal.querySelector('.modal-furigana');
const modalRomaji = kanjiModal.querySelector('.modal-romaji');
const modalIndo = kanjiModal.querySelector('.modal-indo');
const modalInggris = kanjiModal.querySelector('.modal-inggris');
const modalOnyomiList = kanjiModal.querySelector('.onyomi-list');
const modalKunyomiList = kanjiModal.querySelector('.kunyomi-list');
const modalKategori = kanjiModal.querySelector('.modal-kategori');
const modalJlpt = kanjiModal.querySelector('.modal-jlpt'); // Mengubah referensi di JS

const minimalBtn = document.getElementById('minimalBtn');
const fullBtn = document.getElementById('fullBtn');


document.addEventListener('DOMContentLoaded', () => {
 loadLevelData(currentLevel);
 setupEventListeners();
 loadTheme();
 // Script opsional untuk tahun di footer
 document.getElementById('currentYear').textContent = new Date().getFullYear();
});

async function loadLevelData(level) {
 try {
  statusInfo.textContent = `Memuat data ${level.toUpperCase()}...`;
  kanjiContainer.innerHTML = '<div class="message">Memuat data...</div>'; // Mengubah teks
  // Sembunyikan pagination dan filter saat memuat
   prevBtn.disabled = true;
   nextBtn.disabled = true;
   pageInfo.textContent = '';
  searchInput.disabled = true;
  categoryFilter.disabled = true;
  perPageSelect.disabled = true;

  let filePath;
  let data;

  if (level.startsWith('n')) {
      filePath = `data/jlpt_${level}.json`;
      currentDataType = 'kanji';
      const response = await fetch(filePath);
       if (!response.ok) { throw new Error(`Gagal memuat data ${level.toUpperCase()}: ${response.status}`); }
      data = await response.json();
      loadedData = data; // Simpan data kanji
  } else if (level === 'hiragana') {
      filePath = `data/hirakana.json`; // Path file hiragana/katakana Anda
      currentDataType = 'hiragana';
       const response = await fetch(filePath);
       if (!response.ok) { throw new Error(`Gagal memuat data Hiragana: ${response.status}`); }
      data = await response.json();
      loadedData = data.hiragana; // Ambil hanya array hiragana
  } else if (level === 'katakana') {
      filePath = `data/hirakana.json`; // Path file hiragana/katakana Anda
      currentDataType = 'katakana';
       const response = await fetch(filePath);
       if (!response.ok) { throw new Error(`Gagal memuat data Katakana: ${response.status}`); }
      data = await response.json();
       loadedData = data.katakana; // Ambil hanya array katakana
  } else {
      loadedData = [];
      currentDataType = 'unknown';
  }


  filteredData = [...loadedData]; // Reset filtered data

  // Update Category Filter Options
  populateCategoryFilter(loadedData, currentDataType);

  // Aktifkan kembali kontrol setelah data dimuat
  searchInput.disabled = false;
  categoryFilter.disabled = false;
  perPageSelect.disabled = false;


  // Set display mode and render
  setDisplayMode(displayMode); // setDisplayMode memanggil renderCharacters()

  updateStatus();

  levelButtons.forEach(btn => {
   btn.classList.toggle('active', btn.dataset.level === level);
  });

 } catch (error) {
  kanjiContainer.innerHTML = `
   <div class="message error" style="color: red;">
    Gagal memuat data ${level.toUpperCase() || currentLevel}.
    <br><strong>Error:</strong> ${error.message}
    <br>Pastikan file data ada di folder yang benar.
   </div>
  `;
  console.error("Error:", error);
  statusInfo.textContent = `Gagal memuat data ${level.toUpperCase() || currentLevel}.`;

  // Pastikan kontrol dinonaktifkan jika gagal load
  searchInput.disabled = true;
  categoryFilter.disabled = true;
  perPageSelect.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  pageInfo.textContent = '';
  loadedData = []; // Reset data
  filteredData = []; // Reset data
  populateCategoryFilter([], currentDataType); // Kosongkan filter kategori
 }
}

// Fungsi baru untuk mengisi opsi filter kategori
  function populateCategoryFilter(data, dataType) {
      const categories = new Set();
      // Untuk Kanji, gunakan item.kategori
      if (dataType === 'kanji') {
           data.forEach(item => {
              if (item.kategori) {
                  categories.add(item.kategori);
              }
          });
      } else if (dataType === 'hiragana' || dataType === 'katakana') {
           // Untuk Hiragana/Katakana dari file hirakana.json, gunakan item.kategori
           data.forEach(item => {
              if (item.kategori) {
                  categories.add(item.kategori);
              }
          });
      }


      categoryFilter.innerHTML = '<option value="">Pilih Kategori</option>'; // Reset options
      const sortedCategories = Array.from(categories).sort(); // Urutkan kategori
      sortedCategories.forEach(category => {
          const option = document.createElement('option');
          option.value = category;
          option.textContent = category;
          categoryFilter.appendChild(option);
      });

      // Nonaktifkan filter jika tidak ada kategori unik selain default atau jika data kosong
       // Nonaktifkan filter kategori untuk Hiragana/Katakana jika tidak ada kategori unik
      categoryFilter.disabled = (dataType === 'hiragana' || dataType === 'katakana') && sortedCategories.length === 0;
       // Nonaktifkan juga untuk Kanji jika tidak ada kategori
       if (dataType === 'kanji') {
            categoryFilter.disabled = sortedCategories.length === 0;
       }


      // Mengubah placeholder search input berdasarkan tipe data
      if (dataType === 'kanji') {
          searchInput.placeholder = 'Cari kanji (contoh: 水, mizu, air...)';
      } else if (dataType === 'hiragana') {
           searchInput.placeholder = 'Cari Hiragana (contoh: あ, a)';
      } else if (dataType === 'katakana') {
           searchInput.placeholder = 'Cari Katakana (contoh: ア, a)';
      } else {
           searchInput.placeholder = 'Cari...';
      }
  }


function setupEventListeners() {
 levelButtons.forEach(btn => {
  btn.addEventListener('click', () => {
   currentLevel = btn.dataset.level;
   currentPage = 1;
   searchInput.value = '';
   categoryFilter.value = ''; // Reset kategori filter saat ganti level
   loadLevelData(currentLevel); // loadLevelData handles data type and rendering
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
  renderCharacters(filteredData, currentDataType); // Panggil render dengan data yang sudah difilter
  updateStatus();
 });

 prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
   currentPage--;
   renderCharacters(filteredData, currentDataType);
   updateStatus();
  }
 });

 nextBtn.addEventListener('click', () => {
  const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / perPage);
  if (perPage !== 0 && currentPage < totalPages) {
   currentPage++;
   renderCharacters(filteredData, currentDataType);
   updateStatus();
  }
 });

 document.getElementById("themeToggle").addEventListener('click', toggleTheme);

  // Event listener untuk modal (Tetap sama)
  closeModalBtn.addEventListener('click', hideKanjiModal);
  kanjiModal.addEventListener('click', (event) => {
   if (event.target === kanjiModal) {
    hideKanjiModal();
   }
  });

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
 // Re-render untuk memastikan tampilan card sesuai mode
 renderCharacters(filteredData, currentDataType);
}


function handleSearch() {
 const keyword = searchInput.value.toLowerCase().trim();
 const selectedCategory = categoryFilter.value;

 filteredData = loadedData.filter(item => {
  const matchesKeyword = !keyword || (
    item.karakter.includes(keyword) ||
    item.romaji.toLowerCase().includes(keyword) ||
    // Tambahkan pencarian untuk field kanji jika data type adalah kanji
    (currentDataType === 'kanji' && (
        item.kanji.includes(keyword) ||
        item.furigana.toLowerCase().includes(keyword) ||
        item.indo.toLowerCase().includes(keyword) ||
        item.inggris.toLowerCase().includes(keyword) ||
        (item.onyomi && item.onyomi.some(onyomi => onyomi.kana.toLowerCase().includes(keyword) || onyomi.romaji.toLowerCase().includes(keyword))) ||
        (item.kunyomi && item.kunyomi.some(kunyomi => kunyomi.kana.toLowerCase().includes(keyword) || kunyomi.romaji.toLowerCase().includes(keyword)))
    ))
  );

  const matchesCategory = !selectedCategory || item.kategori === selectedCategory;

  return matchesKeyword && matchesCategory;
 });

 currentPage = 1;
 renderCharacters(filteredData, currentDataType); // Panggil render dengan data yang sudah difilter
 updateStatus();
}

  // --- Fungsi Rendering Karakter (diganti dari renderKanji) ---
function renderCharacters(dataToRender, dataType) {
  kanjiContainer.innerHTML = ''; // Bersihkan container

  if (dataToRender.length === 0) {
      kanjiContainer.innerHTML = `<div class="message">Tidak ada karakter yang cocok.</div>`; // Mengubah teks
      // Pastikan pagination dinonaktifkan/sembunyikan jika tidak ada data
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      pageInfo.textContent = '';
      return;
  }

  let dataSubset;
  if (perPage === 0) {
      dataSubset = dataToRender;
  } else {
      const start = (currentPage - 1) * perPage;
      const end = start + perPage;
      dataSubset = dataToRender.slice(start, end);
  }


  let cardsHtml = dataSubset.map(item => {
      if (dataType === 'kanji') {
          // Struktur HTML untuk Card Kanji
          return `
              <div class="character-card type-kanji" data-item='${JSON.stringify(item)}'>
                  <div class="primary-char">${item.kanji}</div>
                  <div class="kanji-card-details">
                      <div class="furigana">${item.furigana}</div>
                      <div class="romaji">${item.romaji}</div>
                      <div class="meaning">
                          <div class="indo">${item.indo}</div>
                          <div class="inggris">${item.inggris}</div>
                      </div>
                  </div>
              </div>
          `;
      } else if (dataType === 'hiragana' || dataType === 'katakana') {
           // Struktur HTML untuk Card Hiragana/Katakana
           return `
               <div class="character-card type-${dataType}" data-item='${JSON.stringify(item)}'>
                   <div class="primary-char">${item.karakter}</div>
                   <div class="secondary-text">${item.romaji}</div>
               </div>
           `;
      }
      return ''; // Fallback kosong jika tipe data tidak diketahui
  }).join('');

  kanjiContainer.innerHTML = cardsHtml;


  // Atur status halaman setelah merender
  const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / perPage);
  prevBtn.disabled = currentPage === 1 || perPage === 0;
  nextBtn.disabled = currentPage === totalPages || perPage === 0;
  pageInfo.textContent = perPage === 0 ? '' : `Halaman ${currentPage}/${totalPages}`;


  // Tambahkan event listener ke SEMUA kartu yang dirender
  const cards = kanjiContainer.querySelectorAll('.character-card');
  cards.forEach(card => {
      // Hapus listener sebelumnya untuk mencegah duplikasi
      card.removeEventListener('click', handleCardClick);
      // Tambahkan listener
      card.addEventListener('click', handleCardClick);
  });
}

// --- Fungsi handle klik card ---
  function handleCardClick(event) {
      const card = event.currentTarget;
      const item = JSON.parse(card.dataset.item); // Ambil data dari data-item

      if (card.classList.contains('type-kanji')) {
          // Jika kartu adalah Kanji, tampilkan modal
          showKanjiModal(item);
      } else if (card.classList.contains('type-hiragana') || card.classList.contains('type-katakana')) {
          // Jika kartu adalah Hiragana/Katakana, tidak lakukan apa-apa (tanpa popup)
          // Atau tambahkan efek lain jika diinginkan (misal: flip card untuk sembunyikan romaji)
          console.log(`Klik pada kartu ${card.classList.contains('type-hiragana') ? 'Hiragana' : 'Katakana'}:`, item); // Hanya log ke konsol
      }
      // Kartu tipe lain tidak melakukan apa-apa
  }


// --- Fungsi untuk menampilkan modal dengan detail kanji (Tidak berubah, hanya dipanggil untuk Kanji) ---
function showKanjiModal(item) {
 modalKanji.textContent = item.kanji;
 modalFurigana.textContent = item.furigana;
 modalRomaji.textContent = item.romaji;
 modalIndo.textContent = item.indo;
 modalInggris.textContent = item.inggris;

 // Render Onyomi
 modalOnyomiList.innerHTML = '';
 if (item.onyomi && item.onyomi.length > 0) {
  item.onyomi.forEach(reading => { const li = document.createElement('li'); li.textContent = `${reading.kana} ${reading.romaji}`; modalOnyomiList.appendChild(li); });
 } else { modalOnyomiList.innerHTML = '<li>-</li>'; }

 // Render Kunyomi
 modalKunyomiList.innerHTML = '';
 if (item.kunyomi && item.kunyomi.length > 0) {
  item.kunyomi.forEach(reading => { const li = document.createElement('li'); li.textContent = `${reading.kana} ${reading.romaji}`; modalKunyomiList.appendChild(li); });
 } else { modalKunyomiList.innerHTML = '<li>-</li>'; }

 modalKategori.textContent = item.kategori || '-';
 modalJlpt.textContent = item.jlpt || '-'; // Mengubah referensi di JS

 kanjiModal.classList.add('visible'); // Tampilkan modal
}

// --- Fungsi untuk menyembunyikan modal (Tidak Berubah) ---
function hideKanjiModal() {
 kanjiModal.classList.remove('visible'); // Sembunyikan modal
}

function updateStatus() {
 const totalItems = filteredData.length;
 let statusText = '';

 if (totalItems === 0) {
  statusInfo.textContent = `Tidak ada karakter ditemukan untuk ${currentLevel.toUpperCase() || currentDataType.charAt(0).toUpperCase() + currentDataType.slice(1)} dengan filter saat ini.`; // Mengubah teks
  // Sembunyikan paginasi jika tidak ada data
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  pageInfo.textContent = '';
  return;
 }

 const typeLabel = currentDataType === 'kanji' ? 'kanji' : (currentDataType === 'hiragana' ? 'hiragana' : 'katakana'); // Tentukan label tipe data

 if (perPage === 0) {
  statusText = `Menampilkan semua ${totalItems} ${typeLabel} ${currentDataType === 'kanji' ? currentLevel.toUpperCase() : ''}`.trim(); // Sesuaikan teks
 } else {
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);
  statusText = `Menampilkan ${start}-${end} dari ${totalItems} ${typeLabel} ${currentDataType === 'kanji' ? currentLevel.toUpperCase() : ''}`.trim(); // Sesuaikan teks
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