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
const googleSearchButton = document.getElementById('googleSearchButton'); // Ambil tombol Cari di Google

const minimalBtn = document.getElementById('minimalBtn');
const fullBtn = document.getElementById('fullBtn');

// --- New variables for select mode ---
let longPressTimer;
const LONG_PRESS_TIME = 500; // milliseconds
let isSelectMode = false;
// Store character strings (kanji or karakter) as unique identifiers
let selectedCards = new Set();
const selectControlsContainer = document.createElement('div'); // Create a new container for select controls
selectControlsContainer.id = 'selectControls';
// Initial display style will be set by toggleSelectMode
selectControlsContainer.style.textAlign = 'center';
selectControlsContainer.style.marginBottom = '15px';
selectControlsContainer.style.fontWeight = 'normal';
selectControlsContainer.style.color = 'var(--text)';
selectControlsContainer.style.display = 'none'; // Ensure hidden initially

// --- New flag to differentiate long press from click ---
let isLongPressHandled = false;


document.addEventListener('DOMContentLoaded', () => {
    // Insert the new container before the kanjiContainer as early as possible
    if (kanjiContainer && kanjiContainer.parentNode) {
         kanjiContainer.parentNode.insertBefore(selectControlsContainer, kanjiContainer);
    } else {
        console.error("Error: kanjiContainer or its parent not found.");
        // Handle this error case, perhaps delay insertion or show a message
    }


    loadLevelData(currentLevel);
    setupEventListeners();
    loadTheme();
    // Script opsional untuk tahun di footer
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});

async function loadLevelData(level) {
    try {
        statusInfo.textContent = `Memuat data ${level.toUpperCase()}...`;
        if (kanjiContainer) {
             kanjiContainer.innerHTML = '<div class="message">Memuat data...</div>'; // Mengubah teks
        }
        // Sembunyikan pagination dan filter saat memuat
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pageInfo) pageInfo.textContent = '';
        if (searchInput) searchInput.disabled = true;
        if (categoryFilter) categoryFilter.disabled = true;
        if (perPageSelect) perPageSelect.disabled = true;


        let filePath;
        let data;

        if (level.startsWith('n')) {
            filePath = `data/jlpt_${level}.json`;
            currentDataType = 'kanji';
            const response = await fetch(filePath);
            if (!response.ok) { throw new Error(`Gagal memuat data ${level.toUpperCase()} karena file tidak ditemukan atau ada masalah: ${response.status}`); } // Perbaiki pesan error
            data = await response.json();
            loadedData = data; // Simpan data kanji
        } else if (level === 'hiragana') {
            filePath = `data/hirakana.json`; // Path file hiragana/katakana Anda
            currentDataType = 'hiragana';
            const response = await fetch(filePath);
            if (!response.ok) { throw new Error(`Gagal memuat data Hiragana karena file tidak ditemukan atau ada masalah: ${response.status}`); } // Perbaiki pesan error
            data = await response.json();
            loadedData = data.hiragana; // Ambil hanya array hiragana
        } else if (level === 'katakana') {
            filePath = `data/hirakana.json`; // Path file hiragana/katakana Anda
            currentDataType = 'katakana';
            const response = await fetch(filePath);
            if (!response.ok) { throw new Error(`Gagal memuat data Katakana karena file tidak ditemukan atau ada masalah: ${response.status}`); } // Perbaiki pesan error
            data = await response.json();
            loadedData = data.katakana; // Ambil hanya array katakana
        } else {
            loadedData = [];
            currentDataType = 'unknown';
        }

        filteredData = [...loadedData]; // Reset filtered data
        currentPage = 1; // Reset page

        // Exit select mode when loading new data
        toggleSelectMode(false); // This will also hide selectControlsContainer

        // Update Category Filter Options
        populateCategoryFilter(loadedData, currentDataType);

        // Aktifkan kembali kontrol setelah data dimuat
        if (searchInput) searchInput.disabled = false;
        if (categoryFilter) categoryFilter.disabled = false;
        if (perPageSelect) perPageSelect.disabled = false;


        // Set display mode and render
        setDisplayMode(displayMode); // setDisplayMode memanggil renderCharacters()

        updateStatus();

        levelButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });

    } catch (error) {
        if (kanjiContainer) {
            kanjiContainer.innerHTML = `
                <div class="message error" style="color: red;">
                    Gagal memuat data ${level.toUpperCase() || currentLevel}.
                    <br><strong>Error:</strong> ${error.message}
                    <br>Pastikan file data ada di folder yang benar.
                </div>
            `;
        }
        console.error("Error loading data:", error); // Log error yang lebih informatif
        if (statusInfo) statusInfo.textContent = `Gagal memuat data ${level.toUpperCase() || currentLevel}.`;


        // Pastikan kontrol dinonaktifkan jika gagal load
        if (searchInput) searchInput.disabled = true;
        if (categoryFilter) categoryFilter.disabled = true;
        if (perPageSelect) perPageSelect.disabled = true;
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pageInfo) pageInfo.textContent = '';
        loadedData = []; // Reset data
        filteredData = []; // Reset data
        populateCategoryFilter([], currentDataType); // Kosongkan filter kategori
         toggleSelectMode(false); // Exit select mode on error
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


    if (categoryFilter) {
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
    }


    // Mengubah placeholder search input berdasarkan tipe data
    if (searchInput) {
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
}


function setupEventListeners() {
    levelButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentLevel = btn.dataset.level;
            currentPage = 1;
            if(searchInput) searchInput.value = '';
            if(categoryFilter) categoryFilter.value = ''; // Reset kategori filter saat ganti level
            loadLevelData(currentLevel); // loadLevelData handles data type and rendering
        });
    });

    setupDisplayToggleListeners(); // Setup listeners for display mode buttons

    if(searchInput) searchInput.addEventListener('input', debounce(handleSearch, 300));

    if(categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentPage = 1;
            handleSearch();
        });
    }

    if(perPageSelect) {
        perPageSelect.addEventListener('change', () => {
            perPage = parseInt(perPageSelect.value);
            currentPage = 1;
            toggleSelectMode(false); // Exit select mode on perPage change
            renderCharacters(filteredData, currentDataType); // Panggil render dengan data yang sudah difilter
            updateStatus();
        });
    }

    if(prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                toggleSelectMode(false); // Exit select mode on page change
                renderCharacters(filteredData, currentDataType);
                updateStatus();
            }
        });
    }

    if(nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / perPage);
            if (perPage !== 0 && currentPage < totalPages) {
                currentPage++;
                toggleSelectMode(false); // Exit select mode on page change
                renderCharacters(filteredData, currentDataType);
                updateStatus();
            }
        });
    }

    const themeToggleBtn = document.getElementById("themeToggle");
    if(themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);


    // Event listener untuk modal (Tetap sama) - Modal hanya untuk Kanji
    if(closeModalBtn) closeModalBtn.addEventListener('click', hideKanjiModal);
    if(kanjiModal) {
        kanjiModal.addEventListener('click', (event) => {
            if (event.target === kanjiModal) {
                hideKanjiModal();
            }
        });
    }
}


// --- Fungsi untuk mengatur mode tampilan ---
function setupDisplayToggleListeners() {
    if(minimalBtn) {
        minimalBtn.addEventListener('click', () => {
            setDisplayMode('minimal');
        });
    }
    if(fullBtn) {
        fullBtn.addEventListener('click', () => {
            setDisplayMode('full');
        });
    }
}

// --- Fungsi untuk mengatur mode tampilan ---
function setDisplayMode(mode) {
    displayMode = mode;
    if (kanjiContainer) {
        if (mode === 'minimal') {
            kanjiContainer.classList.remove('display-full');
            kanjiContainer.classList.add('display-minimal');
            if(minimalBtn) minimalBtn.classList.add('active');
            if(fullBtn) fullBtn.classList.remove('active');
        } else { // mode === 'full'
            kanjiContainer.classList.remove('display-minimal');
            kanjiContainer.classList.add('display-full');
            if(fullBtn) fullBtn.classList.add('active');
            if(minimalBtn) minimalBtn.classList.remove('active');
        }
    }
    // Re-render untuk memastikan tampilan card sesuai mode
     // Exit select mode when changing display mode
    toggleSelectMode(false);
    renderCharacters(filteredData, currentDataType);
}


function handleSearch() {
    const keyword = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    filteredData = loadedData.filter(item => {
        let matchesKeyword = false; // Default ke false jika ada keyword dan belum cocok

        if (!keyword) {
            matchesKeyword = true; // Jika tidak ada keyword, semua item cocok
        } else {
            // Jika ada keyword, cek berdasarkan tipe data
            if (currentDataType === 'kanji') {
                // Cek field khusus Kanji
                // Pastikan properti ada sebelum mengaksesnya, meskipun seharusnya ada jika data valid
                const kanji = item.kanji || '';
                const furigana = item.furigana ? item.furigana.toLowerCase() : '';
                const romaji = item.romaji ? item.romaji.toLowerCase() : ''; // Romaji juga ada di data Kanji
                const indo = item.indo ? item.indo.toLowerCase() : '';
                const inggris = item.inggris ? item.inggris.toLowerCase() : '';
                const onyomiMatch = (item.onyomi && item.onyomi.some(o => (o.kana || '').toLowerCase().includes(keyword) || (o.romaji || '').toLowerCase().includes(keyword)));
                const kunyomiMatch = (item.kunyomi && item.kunyomi.some(k => (k.kana || '').toLowerCase().includes(keyword) || (k.romaji || '').toLowerCase().includes(keyword)));

                matchesKeyword =
                    kanji.includes(keyword) ||
                    furigana.includes(keyword) ||
                    romaji.includes(keyword) ||
                    indo.includes(keyword) ||
                    inggris.includes(keyword) ||
                    onyomiMatch ||
                    kunyomiMatch;

            } else if (currentDataType === 'hiragana' || currentDataType === 'katakana') {
                // Cek field khusus Hiragana/Katakana
                const karakter = item.karakter || '';
                const romaji = item.romaji ? item.romaji.toLowerCase() : '';

                matchesKeyword =
                    karakter.includes(keyword) ||
                    romaji.includes(keyword);
            }
            // Jika currentDataType tidak diketahui, matchesKeyword tetap false
        }


        const matchesCategory = !selectedCategory || (item.kategori && item.kategori === selectedCategory); // Tambahkan cek item.kategori


        return matchesKeyword && matchesCategory;
    });

    currentPage = 1;
    toggleSelectMode(false); // Exit select mode on search/filter change
    renderCharacters(filteredData, currentDataType); // Panggil renderCharacters
    updateStatus();
}

// --- Fungsi Rendering Karakter (diganti dari renderKanji) ---
function renderCharacters(dataToRender, dataType) {
    if (!kanjiContainer) {
         console.error("Error: kanjiContainer not found.");
         return;
    }
    kanjiContainer.innerHTML = ''; // Bersihkan container

    if (dataToRender.length === 0) {
        kanjiContainer.innerHTML = `<div class="message">Tidak ada karakter yang cocok.</div>`; // Mengubah teks
        // Pastikan pagination dinonaktifkan/sembunyikan jika tidak ada data
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
        if(pageInfo) pageInfo.textContent = '';
        updateSelectControls(); // Ensure select controls are hidden
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
        // Use the character string as the identifier for selection
        const characterId = dataType === 'kanji' ? item.kanji : item.karakter;
        const isSelected = isSelectMode && selectedCards.has(characterId);
        const selectedClass = isSelected ? ' selected' : '';
        // Add indicator in select mode for ALL card types
        const selectIndicatorHtml = isSelectMode ? '<div class="select-indicator"><i class="fas fa-check-circle"></i></div>' : '';


        if (dataType === 'kanji') {
            // Struktur HTML untuk Card Kanji
            return `
                <div class="character-card type-kanji${selectedClass}" data-item='${JSON.stringify(item)}'>
                    ${selectIndicatorHtml} <div class="primary-char">${item.kanji}</div>
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
                <div class="character-card type-${dataType}${selectedClass}" data-item='${JSON.stringify(item)}'>
                    ${selectIndicatorHtml} <div class="primary-char">${item.karakter}</div>
                    <div class="secondary-text">${item.romaji}</div>
                </div>
            `;
        }
        return ''; // Fallback kosong jika tipe data tidak diketahui
    }).join('');

    kanjiContainer.innerHTML = cardsHtml;


    // Atur status halaman setelah merender
    const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / perPage);
    if(prevBtn) prevBtn.disabled = currentPage === 1 || perPage === 0;
    if(nextBtn) nextBtn.disabled = currentPage === totalPages || perPage === 0;
    if(pageInfo) pageInfo.textContent = perPage === 0 ? '' : `Halaman ${currentPage}/${totalPages}`;


    // Tambahkan event listener ke SEMUA kartu yang dirender
    const cards = kanjiContainer.querySelectorAll('.character-card');
    cards.forEach(card => {
        // Hapus listener sebelumnya untuk mencegah duplikasi (Pentung!)
        card.removeEventListener('click', handleCardClick);
        card.removeEventListener('mousedown', handleMouseDown);
        card.removeEventListener('mouseup', handleMouseUp);
        card.removeEventListener('mouseleave', handleMouseUp);
        card.removeEventListener('touchstart', handleTouchStart);
        card.removeEventListener('touchend', handleTouchEnd);
        card.removeEventListener('touchmove', handleTouchMove); // Fix: Use handleTouchMove


        // Tambahkan listener baru
        card.addEventListener('click', handleCardClick);
        // Add long press listener to ALL character cards
         card.addEventListener('mousedown', handleMouseDown);
         card.addEventListener('mouseup', handleMouseUp);
         card.addEventListener('mouseleave', handleMouseUp); // Clear timer if mouse leaves
         card.addEventListener('touchstart', handleTouchStart);
         card.addEventListener('touchend', handleTouchEnd);
         card.addEventListener('touchmove', handleTouchMove); // Fix: Use handleTouchMove
    });

     updateSelectControls(); // Ensure select controls are updated after render
     updateStatus(); // Ensure main status is updated
}


// --- New event handler functions for long press (Modified for all types and click differentiation) ---
function handleMouseDown(event) {
    // Only trigger long press on left mouse button
    if (event.button !== 0) return;
    isLongPressHandled = false; // Reset flag
    startLongPressTimer(event.currentTarget);
}

function handleMouseUp(event) {
    // If the timer was cleared before completing (i.e., it was a short press)
    // AND the long press logic didn't fire...
    if (longPressTimer && !isLongPressHandled) {
        // It was a short click action
        const card = event.currentTarget;
        // Manually trigger the "click" behavior for non-select mode
        if (!isSelectMode) {
             const item = JSON.parse(card.dataset.item);
             if (card.classList.contains('type-kanji')) {
                 showKanjiModal(item);
             } else if (card.classList.contains('type-hiragana') || card.classList.contains('type-katakana')) {
                 // Optional: Add visual feedback for non-kanji/kana cards in normal mode if desired
                  console.log(`Klik pendek pada kartu ${card.classList.contains('type-hiragana') ? 'Hiragana' : 'Katakana'}:`, item); // Only log to console
             }
        } else {
            // If in select mode, a short click also toggles selection (this is handled by handleCardClick anyway, but explicit here)
             const item = JSON.parse(card.dataset.item);
             toggleCardSelection(card, item);
        }
    }
    clearLongPressTimer(); // Always clear timer on mouse up
}

function handleTouchStart(event) {
     // Prevent default to avoid scrolling interference and potential double-tap issues
     // if (event.cancelable) { // Check if preventDefault is allowed
          event.preventDefault();
     // }
    isLongPressHandled = false; // Reset flag
    startLongPressTimer(event.currentTarget);
}

function handleTouchEnd(event) {
     // If the timer was cleared before completing (i.e., it was a short press)
     // AND the long press logic didn't fire...
     if (longPressTimer && !isLongPressHandled) {
         // It was a short touch action
         const card = event.currentTarget;
         // Manually trigger the "click" behavior for non-select mode
         if (!isSelectMode) {
              const item = JSON.parse(card.dataset.item);
              if (card.classList.contains('type-kanji')) {
                  showKanjiModal(item);
              } else if (card.classList.contains('type-hiragana') || card.classList.contains('type-katakana')) {
                  // Optional: Add visual feedback
                   console.log(`Tap pendek pada kartu ${card.classList.contains('type-hiragana') ? 'Hiragana' : 'Katakana'}:`, item); // Only log to console
              }
         } else {
             // If in select mode, a short tap also toggles selection (handled by handleCardClick)
              const item = JSON.parse(card.dataset.item);
              toggleCardSelection(card, item);
         }
     }
    clearLongPressTimer(); // Always clear timer on touch end
    // Note: event.preventDefault() in touchstart might prevent click event generation,
    // so explicitly handling short press in touchend is more reliable here.
}

function handleTouchMove() {
    // If the touch moves significantly before the timer finishes, cancel the long press
    clearLongPressTimer();
    isLongPressHandled = false; // Ensure flag is reset
}


function startLongPressTimer(cardElement) {
    clearLongPressTimer(); // Clear any existing timer
    longPressTimer = setTimeout(() => {
        // Long press detected
        isLongPressHandled = true; // Set flag

        if (!isSelectMode) {
            toggleSelectMode(true);
        }

        // Select the card if not already selected
        if (isSelectMode) {
            const item = JSON.parse(cardElement.dataset.item);
            // Use the character string for selection
            const characterId = cardElement.classList.contains('type-kanji') ? item.kanji : item.karakter;
             if (!selectedCards.has(characterId)) {
                toggleCardSelection(cardElement, item);
            }
        }
        // Prevent default browser behavior (like context menu) on long press
         // This is often handled by preventDefault on touchstart/mousedown,
         // but setting the flag here can also signal to prevent subsequent actions.
    }, LONG_PRESS_TIME);
}

function clearLongPressTimer() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}
// --- End New event handler functions for long press ---


// --- Fungsi handle klik card (Modified) ---
function handleCardClick(event) {
    // Clear long press timer just in case click fires after touchstart but before timeout
    clearLongPressTimer();

    // --- Fix: Only handle click if long press was NOT handled ---
    // In this revised logic, short clicks are handled in handleMouseUp/handleTouchEnd.
    // This handleCardClick will primarily handle the case where the long-press timer
    // *didn't* complete, and the browser still generated a click event.
    // Or, it handles clicks when already in select mode.

    const card = event.currentTarget;
    const item = JSON.parse(card.dataset.item); // Get data from data-item attribute

    if (isSelectMode) {
        // If in select mode, always toggle selection on click
         toggleCardSelection(card, item);
    } else {
        // If NOT in select mode, and long press wasn't handled, this is a standard click.
        // However, the logic for standard click (showing modal) is now moved to
        // handleMouseUp/handleTouchEnd when !isLongPressHandled.
        // So, if we reach here and !isSelectMode, it might be a click event that
        // wasn't caught by the touchend/mouseup logic immediately after timer clear.
        // We can safely ignore it here or add a console log if needed for debugging.
        console.log("Click event ignored because short press handled in mouseup/touchend or already in select mode.");
         // If for some reason the touchend/mouseup short-press logic didn't fire,
         // and isSelectMode is false, we could potentially put the modal logic back here as a fallback,
         // but the current structure aims to handle it in touchend/mouseup for better click/long-press distinction.
         // Let's keep it focused on select mode toggling for now.
    }
}


// --- New functions for select mode (Modified for all types) ---
function toggleSelectMode(enable) {
    // Select mode can be activated for any character type now
    isSelectMode = enable;
    selectedCards.clear(); // Clear selection when entering or exiting mode

    const cards = kanjiContainer ? kanjiContainer.querySelectorAll('.character-card') : [];
    cards.forEach(card => {
        card.classList.remove('selected'); // Remove selected class from all cards
        // Remove or add select indicator based on new mode state for ALL cards
        const existingIndicator = card.querySelector('.select-indicator');
        if (isSelectMode && !existingIndicator) {
            const indicator = document.createElement('div');
            indicator.classList.add('select-indicator');
            indicator.innerHTML = '<i class="fas fa-check-circle"></i>';
            card.insertBefore(indicator, card.firstChild); // Add indicator
        } else if (!isSelectMode && existingIndicator) {
            existingIndicator.remove(); // Remove indicator if exiting mode
        }
    });

    // Show/hide select controls and update them
    if(selectControlsContainer) selectControlsContainer.style.display = isSelectMode ? 'flex' : 'none'; // Use flex for centering buttons
    updateSelectControls();

    // Update status display to reflect select mode
    updateStatus();
}

function toggleCardSelection(cardElement, item) {
    // Use the appropriate character string for Set operations
    const characterId = cardElement.classList.contains('type-kanji') ? item.kanji : item.karakter;

    if (selectedCards.has(characterId)) {
        selectedCards.delete(characterId);
        cardElement.classList.remove('selected');
    } else {
        selectedCards.add(characterId);
        cardElement.classList.add('selected');
    }
    updateSelectControls(); // Update the count and button state
}

function updateSelectControls() {
    if (!isSelectMode) {
        if(selectControlsContainer) {
             selectControlsContainer.innerHTML = ''; // Clear controls if not in select mode
             selectControlsContainer.style.display = 'none'; // Ensure hidden
        }
        return;
    }

    if (!selectControlsContainer) {
         console.error("Error: selectControlsContainer not found.");
         return;
    }

    // Count ALL displayed character cards
    const cards = kanjiContainer ? kanjiContainer.querySelectorAll('.character-card') : [];
    const totalDisplayed = cards.length;
    const selectedCount = selectedCards.size;

    let selectControlsHtml = `
        <span id="selectedCountInfo">
            <span id="selectedCount">${selectedCount}</span> dipilih
        </span>
        <button id="selectAllBtn"></button>
        <button id="cancelSelectBtn">Batal</button>
        <button id="shuffleBtn">Acak Tampilan Ini</button>
    `;

    // Set innerHTML to update the DOM with new buttons
    selectControlsContainer.innerHTML = selectControlsHtml;

    // --- Get button references *after* setting innerHTML ---
    const selectAllBtn = document.getElementById('selectAllBtn');
    const cancelSelectBtn = document.getElementById('cancelSelectBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    // --- End Get button references ---

    // Determine Select All/Deselect All text based on selected displayed cards
    if (selectedCount === totalDisplayed && totalDisplayed > 0) {
        if(selectAllBtn) selectAllBtn.textContent = 'Batal Pilih Semua';
    } else {
        if(selectAllBtn) selectAllBtn.textContent = 'Pilih Semua';
    }

    // Disable Shuffle button if no cards are selected
    if (shuffleBtn) {
        shuffleBtn.disabled = selectedCount === 0;
    }

    // Add event listeners to the new buttons
    // Ensure listeners are added only once or removed before adding
    // Since we replace innerHTML, old listeners are removed automatically.
    // Just add the new ones.
    if (selectAllBtn) {
         selectAllBtn.addEventListener('click', handleSelectAllToggle);
    }
    if (cancelSelectBtn) {
        cancelSelectBtn.addEventListener('click', handleCancelSelect);
    }
     if (shuffleBtn) {
         shuffleBtn.addEventListener('click', handleShuffleDisplay);
     }


    // Update the main status text visibility
    if(statusInfo) statusInfo.style.display = isSelectMode ? 'none' : 'block';

    // Update the count display within the selectControlsContainer
    const selectedCountSpan = document.getElementById('selectedCount');
    if(selectedCountSpan) {
        selectedCountSpan.textContent = selectedCount;
    }
}


function handleSelectAllToggle() {
    const cards = kanjiContainer ? kanjiContainer.querySelectorAll('.character-card') : []; // Target ALL displayed cards
    const totalDisplayed = cards.length;
    const selectedCount = selectedCards.size;

    if (selectedCount === totalDisplayed && totalDisplayed > 0) {
        // Deselect all currently displayed cards
        cards.forEach(card => {
            const item = JSON.parse(card.dataset.item);
             const characterId = card.classList.contains('type-kanji') ? item.kanji : item.karakter;
             selectedCards.delete(characterId);
             card.classList.remove('selected');
        });
    } else {
        // Select all currently displayed cards
        selectedCards.clear(); // Clear existing selection first
        cards.forEach(card => {
            const item = JSON.parse(card.dataset.item);
            const characterId = card.classList.contains('type-kanji') ? item.kanji : item.karakter;
            selectedCards.add(characterId);
            card.classList.add('selected');
        });
    }
    updateSelectControls();
}

function handleCancelSelect() {
    toggleSelectMode(false); // Exit select mode
}

// --- Modified: Shuffle only selected displayed items of ANY type ---
function handleShuffleDisplay() {
    if (!isSelectMode || selectedCards.size === 0) return; // Only shuffle in select mode and if items are selected

    if (!kanjiContainer) {
         console.error("Error: kanjiContainer not found for shuffle.");
         return;
    }

    const currentCardElements = Array.from(kanjiContainer.querySelectorAll('.character-card')); // Get ALL displayed cards
    // Get the data items corresponding to the currently displayed cards
    const currentDisplayedItems = currentCardElements.map(card => JSON.parse(card.dataset.item));

    // Separate selected and non-selected items from the *currently displayed* set
    const selectedDisplayedItems = currentDisplayedItems.filter(item => {
         const characterId = item.kanji || item.karakter; // Get the identifier
         return selectedCards.has(characterId);
    });

    const nonSelectedDisplayedItems = currentDisplayedItems.filter(item => {
         const characterId = item.kanji || item.karakter; // Get the identifier
         return !selectedCards.has(characterId);
    });

    // Shuffle ONLY the selected items
    const shuffledSelectedItems = shuffleArray([...selectedDisplayedItems]); // Create a copy before shuffling

    // Create a new ordered list of displayed items, with selected items shuffled
    const newOrderedDisplayedItems = []; // This will hold all items (any type) in the new order
    let shuffledIndex = 0;

    currentDisplayedItems.forEach(item => {
         const characterId = item.kanji || item.karakter; // Get the identifier
         if (selectedCards.has(characterId)) {
             // Replace the original selected item with the next item from the shuffled selected list
             // Ensure we don't go out of bounds if something is wrong (shouldn't happen with correct logic)
              if (shuffledIndex < shuffledSelectedItems.length) {
                 newOrderedDisplayedItems.push(shuffledSelectedItems[shuffledIndex]);
                 shuffledIndex++;
             } else {
                 // Fallback: if shuffled items run out, just push the original (should not happen)
                  newOrderedDisplayedItems.push(item);
             }
         } else {
             // Keep non-selected items in their original relative positions
             newOrderedDisplayedItems.push(item);
         }
    });

    // Clear the selection after shuffling the displayed items
    selectedCards.clear();

    // Re-render the displayed cards using the new ordered list
    // We can directly call renderCharacters with this new list as the dataToRender
    // because it represents the complete set of items currently shown on the page.
    // Note: This re-renders the *current page* with the shuffled items.
    renderCharacters(newOrderedDisplayedItems, currentDataType); // Re-render the displayed subset

    updateSelectControls(); // Update controls (count will be 0, shuffle button disabled)
     // Keep the status info consistent with the displayed items after shuffle
     // The main status text is hidden anyway in select mode.
}
// --- End Modified ---


// Helper function to shuffle an array (Fisher-Yates Algorithm)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // Swap elements
        [array[currentIndex], array[randomIndex]] = [ array[randomIndex], array[currentIndex]];
    }
    return array;
}
// --- End New functions for select mode ---


// --- Fungsi untuk menampilkan modal dengan detail kanji (Tidak berubah, hanya dipanggil untuk Kanji) ---
function showKanjiModal(item) {
    if(!kanjiModal) return;

    if(modalKanji) modalKanji.textContent = item.kanji;
    if(modalFurigana) modalFurigana.textContent = item.furigana;
    if(modalRomaji) modalRomaji.textContent = item.romaji;
    if(modalIndo) modalIndo.textContent = item.indo;
    if(modalInggris) modalInggris.textContent = item.inggris;

    // Render Onyomi
    if(modalOnyomiList) {
        modalOnyomiList.innerHTML = '';
        if (item.onyomi && item.onyomi.length > 0) {
            item.onyomi.forEach(reading => { const li = document.createElement('li'); li.textContent = `${reading.kana} ${reading.romaji}`; modalOnyomiList.appendChild(li); });
        } else { modalOnyomiList.innerHTML = '<li>-</li>'; }
    }

    // Render Kunyomi
    if(modalKunyomiList) {
        modalKunyomiList.innerHTML = '';
        if (item.kunyomi && item.kunyomi.length > 0) {
            item.kunyomi.forEach(reading => { const li = document.createElement('li'); li.textContent = `${reading.kana} ${reading.romaji}`; modalKunyomiList.appendChild(li); });
        } else { modalKunyomiList.innerHTML = '<li>-</li>'; }
    }

    if(modalKategori) modalKategori.textContent = item.kategori || '-';
    if(modalJlpt) modalJlpt.textContent = item.jlpt || '-'; // Mengubah referensi di JS

    if (googleSearchButton && item.kanji) {
        const searchTerm = encodeURIComponent("Jelaskan kanji: " + item.kanji);
        googleSearchButton.href = `https://www.google.com/search?q=${searchTerm}`;

        googleSearchButton.innerHTML = `<i class="fas fa-search"></i> Cari ${item.kanji} di Google`;

        googleSearchButton.style.display = ''; // Pastikan tombol terlihat
    } else if (googleSearchButton) {
        googleSearchButton.style.display = 'none';
    }

    kanjiModal.classList.add('visible'); // Tampilkan modal
}

// --- Fungsi untuk menyembunyikan modal (Tidak Berubah) ---
function hideKanjiModal() {
    if(kanjiModal) kanjiModal.classList.remove('visible'); // Sembunyikan modal
}

function updateStatus() {
    // This function now primarily updates the main status text
    // The select mode status is handled by updateSelectControls()

    const totalItems = filteredData.length;
    let statusText = '';

    if (totalItems === 0) {
        statusText = `Tidak ada karakter ditemukan untuk ${currentLevel.toUpperCase() || currentDataType.charAt(0).toUpperCase() + currentDataType.slice(1)} dengan filter saat ini.`; // Mengubah teks
        // Sembunyikan paginasi jika tidak ada data
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
        if(pageInfo) pageInfo.textContent = '';
    } else {
        const typeLabel = currentDataType === 'kanji' ? 'kanji' : (currentDataType === 'hiragana' ? 'hiragana' : 'katakana'); // Tentukan label tipe data
        if (perPage === 0) {
            statusText = `Menampilkan semua ${totalItems} ${typeLabel} ${currentDataType === 'kanji' ? currentLevel.toUpperCase() : ''}`.trim(); // Sesuaikan teks
        } else {
            const start = (currentPage - 1) * perPage + 1;
            const end = Math.min(currentPage * perPage, totalItems);
            statusText = `Menampilkan ${start}-${end} dari ${totalItems} ${typeLabel} ${currentDataType === 'kanji' ? currentLevel.toUpperCase() : ''}`.trim(); // Sesuaikan teks
        }
    }

    if(statusInfo) statusInfo.textContent = statusText;
    // Hide statusInfo when select mode is active
    if(statusInfo) statusInfo.style.display = isSelectMode ? 'none' : 'block';
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
    if (icon) {
        if (theme === 'dark') {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    }
}
