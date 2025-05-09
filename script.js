document.addEventListener('DOMContentLoaded', () => {
  const levelSelector = document.getElementById('levelSelector');
  const kanjiContainer = document.getElementById('kanjiContainer');
  const statusInfo = document.getElementById('statusInfo');

  // Fungsi untuk memuat data kanji dari file JSON
  function loadKanjiData(level) {
    statusInfo.textContent = `Memuat data ${level}...`;
    
    // Menggunakan fetch untuk mengambil data dari file JSON sesuai level
    fetch(`data/jlpt_${level}.json`)
      .then(response => response.json())
      .then(data => {
        displayKanji(data);
        statusInfo.textContent = `Data ${level} berhasil dimuat`;
      })
      .catch(error => {
        statusInfo.textContent = `Gagal memuat data ${level}`;
        console.error('Error:', error);
      });
  }

  // Fungsi untuk menampilkan kanji di grid
  function displayKanji(data) {
    kanjiContainer.innerHTML = '';  // Bersihkan kontainer sebelum menampilkan data
    data.forEach(kanji => {
      const card = document.createElement('div');
      card.classList.add('kanji-card');
      card.innerHTML = `
        <div class="kanji">${kanji.kanji}</div>
        <div class="furigana">${kanji.furigana}</div>
        <div class="romaji">${kanji.romaji}</div>
        <div class="meaning">${kanji.indo} / ${kanji.inggris}</div>
      `;
      kanjiContainer.appendChild(card);
    });
  }

  // Event listener untuk memilih level JLPT
  levelSelector.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('level-btn')) {
      const selectedLevel = e.target.getAttribute('data-level');
      
      // Mengubah kelas aktif untuk tombol yang dipilih
      const buttons = document.querySelectorAll('.level-btn');
      buttons.forEach(button => button.classList.remove('active'));
      e.target.classList.add('active');
      
      // Muat data berdasarkan level yang dipilih
      loadKanjiData(selectedLevel);
    }
  });

  // Default load kanji N5 saat halaman dimuat pertama kali
  loadKanjiData('n5');
});