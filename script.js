let currentLevel = 'n5';
let loadedData = [];
let filteredData = [];
let currentPage = 1;
let perPage = 3;
let displayMode = 'minimal';
let currentDataType = 'kanji';

const levelButtons = document.querySelectorAll('.level-btn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const perPageSelect = document.getElementById('perPage');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const statusInfo = document.getElementById('statusInfo');
const kanjiContainer = document.getElementById('kanjiContainer');

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
const googleSearchButton = document.getElementById('googleSearchButton');

const minimalBtn = document.getElementById('minimalBtn');
const fullBtn = document.getElementById('fullBtn');

// --- Revised State Variables ---
let pressTimer = null; // Stores the setTimeout ID for long press
let pressTarget = null; // Stores the card element currently being pressed
let movedDuringPress = false; // True if significant movement occurred during the current press
const LONG_PRESS_TIME = 500; // Duration for long press in milliseconds

let isSelectMode = false; // Global state: is select mode active?
let selectedCards = new Set(); // Stores the identifiers of selected cards

let startX = 0; // Starting X coordinate of a press (for drag detection)
let startY = 0; // Starting Y coordinate of a press (for drag detection)
const MOVE_THRESHOLD = 15; // Pixels threshold to consider it a move/drag


const selectControlsContainer = document.createElement('div');
selectControlsContainer.id = 'selectControls';
selectControlsContainer.style.textAlign = 'center';
selectControlsContainer.style.marginBottom = '15px';
selectControlsContainer.style.fontWeight = 'normal';
selectControlsContainer.style.color = 'var(--text)';
selectControlsContainer.style.display = 'none';


document.addEventListener('DOMContentLoaded', () => {
    if (kanjiContainer && kanjiContainer.parentNode) {
         kanjiContainer.parentNode.insertBefore(selectControlsContainer, kanjiContainer);
    } else {
        console.error("Error: kanjiContainer or its parent not found.");
    }

    loadLevelData(currentLevel);
    setupEventListeners();
    loadTheme();
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Add global mouse/touch move/end listeners for robust drag/cleanup detection
    // Use capture phase (true) for move listeners to ensure they run before specific element handlers
    document.addEventListener('mousemove', handleGlobalMouseMove, true);
    document.addEventListener('mouseup', handleGlobalMouseEnd); // Use global mouseup for cleanup if release outside card
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false, capture: true }); // passive: false needed for preventDefault
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd); // Handle touchcancel too


});

async function loadLevelData(level) {
    try {
        statusInfo.textContent = `Memuat data ${level.toUpperCase()}...`;
        if (kanjiContainer) {
             kanjiContainer.innerHTML = '<div class="message">Memuat data...</div>';
        }
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
            if (!response.ok) { throw new Error(`Gagal memuat data ${level.toUpperCase()} karena file tidak ditemukan atau ada masalah: ${response.status}`); }
            data = await response.json();
            loadedData = data;
        } else if (level === 'hiragana') {
            filePath = `data/hirakana.json`;
            currentDataType = 'hiragana';
            const response = await fetch(filePath);
            if (!response.ok) { throw new Error(`Gagal memuat data Hiragana karena file tidak ditemukan atau ada masalah: ${response.status}`); }
            data = await response.json();
            loadedData = data.hiragana;
        } else if (level === 'katakana') {
            filePath = `data/hirakana.json`;
            currentDataType = 'katakana';
            const response = await fetch(filePath);
            if (!response.ok) { throw new Error(`Gagal memuat data Katakana karena file tidak ditemukan atau ada masalah: ${response.status}`); }
            data = await response.json();
            loadedData = data.katakana;
        } else {
            loadedData = [];
            currentDataType = 'unknown';
        }

        filteredData = [...loadedData];
        currentPage = 1;

        toggleSelectMode(false);

        populateCategoryFilter(loadedData, currentDataType);

        if (searchInput) searchInput.disabled = false;
        if (categoryFilter) categoryFilter.disabled = false;
        if (perPageSelect) perPageSelect.disabled = false;

        setDisplayMode(displayMode);

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
        console.error("Error loading data:", error);
        if (statusInfo) statusInfo.textContent = `Gagal memuat data ${level.toUpperCase() || currentLevel}.`;

        if (searchInput) searchInput.disabled = true;
        if (categoryFilter) categoryFilter.disabled = true;
        if (perPageSelect) perPageSelect.disabled = true;
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pageInfo) pageInfo.textContent = '';
        loadedData = [];
        filteredData = [];
        populateCategoryFilter([], currentDataType);
         toggleSelectMode(false);
    }
}

function populateCategoryFilter(data, dataType) {
    const categories = new Set();
    if (dataType === 'kanji') {
        data.forEach(item => {
            if (item.kategori) {
                categories.add(item.kategori);
            }
        });
    } else if (dataType === 'hiragana' || dataType === 'katakana') {
        data.forEach(item => {
            if (item.kategori) {
                categories.add(item.kategori);
            }
        });
    }

    if (categoryFilter) {
        categoryFilter.innerHTML = '<option value="">Pilih Kategori</option>';
        const sortedCategories = Array.from(categories).sort();
        sortedCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        categoryFilter.disabled = (dataType === 'hiragana' || dataType === 'katakana') && sortedCategories.length === 0;
        if (dataType === 'kanji') {
            categoryFilter.disabled = sortedCategories.length === 0;
        }
    }

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
            if(categoryFilter) categoryFilter.value = '';
            loadLevelData(currentLevel);
        });
    });

    setupDisplayToggleListeners();

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
            toggleSelectMode(false);
            renderCharacters(filteredData, currentDataType);
            updateStatus();
        });
    }

    if(prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                toggleSelectMode(false);
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
                toggleSelectMode(false);
                renderCharacters(filteredData, currentDataType);
                updateStatus();
            }
        });
    }

    const themeToggleBtn = document.getElementById("themeToggle");
    if(themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

    if(closeModalBtn) closeModalBtn.addEventListener('click', hideKanjiModal);
    if(kanjiModal) {
        kanjiModal.addEventListener('click', (event) => {
            if (event.target === kanjiModal) {
                hideKanjiModal();
            }
        });
    }
}

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

function setDisplayMode(mode) {
    displayMode = mode;
    if (kanjiContainer) {
        if (mode === 'minimal') {
            kanjiContainer.classList.remove('display-full');
            kanjiContainer.classList.add('display-minimal');
            if(minimalBtn) minimalBtn.classList.add('active');
            if(fullBtn) fullBtn.classList.remove('active');
        } else {
            kanjiContainer.classList.remove('display-minimal');
            kanjiContainer.classList.add('display-full');
            if(fullBtn) fullBtn.classList.add('active');
            if(minimalBtn) minimalBtn.classList.remove('active');
        }
    }
    toggleSelectMode(false);
    renderCharacters(filteredData, currentDataType);
}

function handleSearch() {
    const keyword = searchInput.value.toLowerCase().trim();
    const selectedCategory = categoryFilter.value;

    filteredData = loadedData.filter(item => {
        let matchesKeyword = false;

        if (!keyword) {
            matchesKeyword = true;
        } else {
            if (currentDataType === 'kanji') {
                const kanji = item.kanji || '';
                const furigana = item.furigana ? item.furigana.toLowerCase() : '';
                const romaji = item.romaji ? item.romaji.toLowerCase() : '';
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
                const karakter = item.karakter || '';
                const romaji = item.romaji ? item.romaji.toLowerCase() : '';

                matchesKeyword =
                    karakter.includes(keyword) ||
                    romaji.includes(keyword);
            }
        }
        const matchesCategory = !selectedCategory || (item.kategori && item.kategori === selectedCategory);

        return matchesKeyword && matchesCategory;
    });

    currentPage = 1;
    toggleSelectMode(false);
    renderCharacters(filteredData, currentDataType);
    updateStatus();
}

function renderCharacters(dataToRender, dataType) {
    if (!kanjiContainer) {
         console.error("Error: kanjiContainer not found.");
         return;
    }
    kanjiContainer.innerHTML = '';

    if (dataToRender.length === 0) {
        kanjiContainer.innerHTML = `<div class="message">Tidak ada karakter yang cocok.</div>`;
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
        if(pageInfo) pageInfo.textContent = '';
        updateSelectControls();
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
        const characterId = dataType === 'kanji' ? item.kanji : item.karakter;
        const isSelected = isSelectMode && selectedCards.has(characterId);
        const selectedClass = isSelected ? ' selected' : '';
        const selectIndicatorHtml = isSelectMode ? '<div class="select-indicator"><i class="fas fa-check-circle"></i></div>' : '';

        if (dataType === 'kanji') {
            return `
                <div class="character-card type-kanji${selectedClass}" data-item='${JSON.stringify(item)}'>
                    ${selectIndicatorHtml}
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
            return `
                <div class="character-card type-${dataType}${selectedClass}" data-item='${JSON.stringify(item)}'>
                    ${selectIndicatorHtml}
                    <div class="primary-char">${item.karakter}</div>
                    <div class="secondary-text">${item.romaji}</div>
                </div>
            `;
        }
        return '';
    }).join('');

    kanjiContainer.innerHTML = cardsHtml;

    const totalPages = perPage === 0 ? 1 : Math.ceil(filteredData.length / perPage);
    if(prevBtn) prevBtn.disabled = currentPage === 1 || perPage === 0;
    if(nextBtn) nextBtn.disabled = currentPage === totalPages || perPage === 0;
    if(pageInfo) pageInfo.textContent = perPage === 0 ? '' : `Halaman ${currentPage}/${totalPages}`;

    const cards = kanjiContainer.querySelectorAll('.character-card');
    cards.forEach(card => {
        // Remove old listeners - remove ALL previous potential mouse/touch listeners
        // We don't need local mousemove/touchmove/globalend listeners on cards with the new global approach
        card.removeEventListener('click', handleCardClick); // This one was already mostly disabled
        card.removeEventListener('mousedown', handleMouseDown);
        card.removeEventListener('mouseup', handleMouseUp);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('touchstart', handleTouchStart);
        card.removeEventListener('touchend', handleTouchEnd);
        // Removed: card.removeEventListener('touchmove', handleTouchMove); // This was the source of the error

        // Add new listeners - only mousedown/mouseup/mouseleave and touchstart/touchend on the card
        card.addEventListener('mousedown', handleMouseDown);
        card.addEventListener('mouseup', handleMouseUp);
        card.addEventListener('mouseleave', handleMouseLeave);
        card.addEventListener('touchstart', handleTouchStart);
        card.addEventListener('touchend', handleTouchEnd);

    });

     updateSelectControls();
     updateStatus();
}


// --- Event Handlers using Revised State ---

function handleMouseDown(event) {
    // Only handle left click
    if (event.button !== 0) return;
    // Only start a new press if one is not already active
    if (pressTarget !== null) {
         // If a press is already active, something unexpected happened (e.g., right click during left click press).
         // Clean up the old press state before starting a new one.
          if (pressTimer !== null) {
              clearTimeout(pressTimer);
          }
          pressTarget = null;
          movedDuringPress = false;
     }


    pressTarget = event.currentTarget;
    movedDuringPress = false;
    startX = event.clientX; // Use clientX for desktop
    startY = event.clientY;

    // Start the long press timer
    pressTimer = setTimeout(() => {
        // Long press detected
        if (pressTarget && !movedDuringPress) {
            // Ensure it's still the same target and no move occurred
            // Action: Activate select mode and select the long-pressed card
            if (!isSelectMode) {
                toggleSelectMode(true); // This activates the mode
            }
            // Select the card that was long-pressed (will only select if mode just became active or already active)
             // Ensure pressTarget is still a valid DOM element and part of the document
            if (pressTarget && pressTarget.isConnected && isSelectMode && !selectedCards.has(getCharacterId(pressTarget))) { // Check if already selected before toggling
                 const item = JSON.parse(pressTarget.dataset.item);
                 toggleCardSelection(pressTarget, item); // Select initial card
             } else if (pressTarget && pressTarget.isConnected && isSelectMode && selectedCards.has(getCharacterId(pressTarget))) {
                 // If already selected, a long press while selected should maybe deselect?
                 // Or maybe do nothing. Current spec is unclear. Sticking to "select if not already selected".
             }
        }
        pressTimer = null; // Clear timer after execution
    }, LONG_PRESS_TIME);
}

// Global mousemove listener to detect movement during press
function handleGlobalMouseMove(event) {
    // Check if we have an active press and the timer is still running
    if (pressTarget && pressTimer !== null) {
        const currentX = event.clientX;
        const currentY = event.clientY;
        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

        // Check if movement exceeds the threshold
        if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
            movedDuringPress = true; // Mark that movement occurred
            // Cancel the long press timer immediately on significant move
            if (pressTimer !== null) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
             // No preventDefault here to allow native scrolling
        }
    }
}

function handleMouseUp(event) {
    // Check if this release is on the active press target
    if (pressTarget === event.currentTarget) {
        // It's the end of a press on the same target
        if (pressTimer !== null) {
            // Timer was still running - it was a click
            clearTimeout(pressTimer); // Clear the long press timer
            pressTimer = null;

            if (!movedDuringPress) { // Only trigger click action if no move occurred during the press
                // It was a clean click/tap
                const card = event.currentTarget;
                const item = JSON.parse(card.dataset.item);

                if (isSelectMode) {
                    // If in select mode, a clean click toggles selection
                    toggleCardSelection(card, item);
                } else {
                    // If not in select mode, show modal (if Kanji)
                    if (card.classList.contains('type-kanji')) {
                        showKanjiModal(item);
                    } else if (card.classList.contains('type-hiragana') || card.classList.contains('katakana')) {
                        console.log(`Klik pendek pada kartu ${card.classList.contains('type-hiragana') ? 'Hiragana' : 'Katakana'}:`, item);
                    }
                }
            }
            // If movedDuringPress is true, it was a drag (but ended on the same target), no specific action here.
        }
        // If pressTimer was null, it means long press timer already fired (action handled in setTimeout callback).
        // No further action needed on mouseup if timer fired.

        // Reset press state
        pressTarget = null;
        movedDuringPress = false;

        // Prevent default click after handling mouseup to avoid double events
        event.preventDefault();
    }
    // If release is on a different target, global mouseup listener handles cleanup
}

function handleMouseLeave() {
    // If mouse leaves card while pressing and timer is running, treat as move intent
    if (pressTarget && pressTarget === event.currentTarget && pressTimer !== null) {
        movedDuringPress = true; // Mark as moved
        // Cancel the long press timer when mouse leaves the element during press
        clearTimeout(pressTimer);
        pressTimer = null;
        // Note: pressTarget is NOT set to null here, it will be cleared on mouseup/globalmouseup.
    }
}

// Global mouseup listener for cleanup (if press ends outside any card)
function handleGlobalMouseEnd() {
    // If there was an active press target when mouseup happened anywhere
    if (pressTarget !== null) {
        // If the timer was still running, clear it
        if (pressTimer !== null) {
            clearTimeout(pressTimer);
        }
        // Reset press state regardless of where the mouseup occurred
        pressTarget = null;
        movedDuringPress = false;
    }
}


function handleTouchStart(event) {
    // Only handle single touch
    if (event.touches.length !== 1) return;
    // Only start a new press if one is not already active
    if (pressTarget !== null) {
         // If a press is already active (e.g., multi-touch scenario or unexpected event order)
         // Clean up the old press state.
         if (pressTimer !== null) {
             clearTimeout(pressTimer);
         }
         pressTarget = null;
         movedDuringPress = false;
     }

    pressTarget = event.currentTarget;
    movedDuringPress = false;
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;

    // No prevent default here on touchstart to allow natural scrolling initially
    // event.preventDefault(); // Keep REMOVED

    // Start the long press timer
    pressTimer = setTimeout(() => {
        if (pressTarget && !movedDuringPress) {
            // Long press detected
             // Ensure pressTarget is still a valid DOM element and part of the document
            if (pressTarget && pressTarget.isConnected) {
                 if (!isSelectMode) {
                     toggleSelectMode(true); // Activate mode
                 }
                 // Select the card that was long-pressed (will only select if mode just became active or already active)
                 if (isSelectMode && !selectedCards.has(getCharacterId(pressTarget))) { // Check if already selected
                     const item = JSON.parse(pressTarget.dataset.item);
                     toggleCardSelection(pressTarget, item); // Select initial card
                 }
            }
        }
        pressTimer = null; // Clear timer after execution
    }, LONG_PRESS_TIME);
}

// Global touchmove listener for movedDuringPress and cancelling long press early
function handleGlobalTouchMove(event) {
    // Check if we have an active press and the timer is still running, and it's a single touch
    if (pressTarget && pressTimer !== null && event.touches.length === 1) {
        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

        // Use a slightly larger threshold for touch to account for finger wobble
        const touchMoveThreshold = 20;

        if (deltaX > touchMoveThreshold || deltaY > touchMoveThreshold) {
            movedDuringPress = true; // Mark that movement occurred
            // Cancel the long press timer immediately on significant move
            if (pressTimer !== null) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            // Allowing default here lets the browser handle scrolling naturally
             // event.preventDefault(); // Keep REMOVED
        }
    }
     // If not an active single touch press with timer, allow default behavior (e.g. multi-touch zoom, natural scroll)
}

function handleTouchEnd(event) {
    // Check if this release is on the active press target AND the touch that started the press is ending
    // event.changedTouches contains the touches that ended
     let touchEndedOnTarget = false;
     for (let i = 0; i < event.changedTouches.length; i++) {
         const endedTouch = event.changedTouches[i];
         // We can't directly match the original touch ID easily here,
         // so we rely on the touch ending *on the same element* and the global state (pressTarget).
         // This is a simplification. A more robust way needs tracking touch IDs.
         // For now, let's assume if the release is on the pressTarget element, it's the correct touch.
         if (endedTouch.target === pressTarget) {
              touchEndedOnTarget = true;
              break;
         }
     }

    // Only process if the touch ended on the currently active press target element
    if (touchEndedOnTarget && pressTarget !== null) {
         if (pressTimer !== null) {
             // Timer was still running - it was a tap
             clearTimeout(pressTimer); // Clear the long press timer
             pressTimer = null;

             if (!movedDuringPress) { // Only trigger tap action if no move occurred during the press
                 // It was a clean tap
                 const card = pressTarget; // Use pressTarget which is the card element
                 const item = JSON.parse(card.dataset.item);

                 if (isSelectMode) {
                     // If in select mode, a clean tap toggles selection
                     toggleCardSelection(card, item);
                 } else {
                     // If not in select mode, show modal (if Kanji)
                     if (card.classList.contains('type-kanji')) {
                         showKanjiModal(item);
                     } else if (card.classList.contains('type-hiragana') || card.classList.contains('katakana')) {
                          console.log(`Tap pendek pada kartu ${card.classList.contains('type-hiragana') ? 'Hiragana' : 'Katakana'}:`, item);
                     }
                 }
             }
             // If movedDuringPress is true, it was a drag (but ended on the same target), no specific action here.
         }
         // If pressTimer was null, it means long press timer already fired (action handled in setTimeout callback).
         // No further action needed on touchend if timer fired.

         // Reset press state
         pressTarget = null;
         movedDuringPress = false;

         // Prevent default behaviors like tap highlight, click generation on this element
         event.preventDefault();
     }
     // If touch ended on a different target or not on any element, global touchend/touchcancel handles cleanup.
}

// Global touchend/touchcancel listener for cleanup
function handleGlobalTouchEnd(event) {
    // If there was an active press target when touchend happened anywhere
     if (pressTarget !== null) {
         // Check if *any* of the touches that ended were the one that started the press.
         // This requires tracking touch IDs, which is complex with the current state.
         // A simpler cleanup: if any touch ends while pressTarget is set, clear the state.
         // This might occasionally cancel a press if another finger is lifted, but it's safer than a lingering state.

         // If any touch ended, clear the current press state
         if (event.changedTouches.length > 0) {
             if (pressTimer !== null) {
                 clearTimeout(pressTimer);
             }
             pressTarget = null;
             movedDuringPress = false;
         }
     }
}


// Helper to get character ID regardless of type
function getCharacterId(cardElement) {
     // Ensure item data exists
     if (!cardElement || !cardElement.dataset || !cardElement.dataset.item) {
         console.error("Invalid card element or data for getCharacterId");
         return null; // Return null or handle error appropriately
     }
     try {
         const item = JSON.parse(cardElement.dataset.item);
         return item.kanji || item.karakter;
     } catch (e) {
         console.error("Error parsing item data for getCharacterId:", e);
         return null;
     }
}


// --- Other functions ---

function showKanjiModal(item) {
    if(!kanjiModal) return;

    if(modalKanji) modalKanji.textContent = item.kanji;
    if(modalFurigana) modalFurigana.textContent = item.furigana;
    if(modalRomaji) modalRomaji.textContent = item.romaji;
    if(modalIndo) modalIndo.textContent = item.indo;
    if(modalInggris) modalInggris.textContent = item.inggris;

    if(modalOnyomiList) {
        modalOnyomiList.innerHTML = '';
        if (item.onyomi && item.onyomi.length > 0) {
            item.onyomi.forEach(reading => { const li = document.createElement('li'); li.textContent = `${reading.kana} ${reading.romaji}`; modalOnyomiList.appendChild(li); });
        } else { modalOnyomiList.innerHTML = '<li>-</li>'; }
    }

    if(modalKunyomiList) {
        modalKunyomiList.innerHTML = '';
        if (item.kunyomi && item.kunyomi.length > 0) {
            item.kunyomi.forEach(reading => { const li = document.createElement('li'); li.textContent = `${reading.kana} ${reading.romaji}`; modalKunyomiList.appendChild(li); });
        } else { modalKunyomiList.innerHTML = '<li>-</li>'; }
    }

    if(modalKategori) modalKategori.textContent = item.kategori || '-';
    if(modalJlpt) modalJlpt.textContent = item.jlpt || '-';

    if (googleSearchButton && item.kanji) {
        const searchTerm = encodeURIComponent("Jelaskan kanji: " + item.kanji);
        googleSearchButton.href = `https://www.google.com/search?q=${searchTerm}`;
        googleSearchButton.innerHTML = `<i class="fas fa-search"></i> Cari ${item.kanji} di Google`;
        googleSearchButton.style.display = '';
    } else if (googleSearchButton) {
        googleSearchButton.style.display = 'none';
    }

    kanjiModal.classList.add('visible');
}

function hideKanjiModal() {
    if(kanjiModal) kanjiModal.classList.remove('visible');
}

function updateStatus() {
    const totalItems = filteredData.length;
    let statusText = '';

    if (totalItems === 0) {
        statusText = `Tidak ada karakter ditemukan untuk ${currentLevel.toUpperCase() || currentDataType.charAt(0).toUpperCase() + currentDataType.slice(1)} dengan filter saat ini.`;
        if(prevBtn) prevBtn.disabled = true;
        if(nextBtn) nextBtn.disabled = true;
        if(pageInfo) pageInfo.textContent = '';
    } else {
        const typeLabel = currentDataType === 'kanji' ? 'kanji' : (currentDataType === 'hiragana' ? 'hiragana' : 'katakana');
        if (perPage === 0) {
            statusText = `Menampilkan semua ${totalItems} ${typeLabel} ${currentDataType === 'kanji' ? currentLevel.toUpperCase() : ''}`.trim();
        } else {
            const start = (currentPage - 1) * perPage + 1;
            const end = Math.min(currentPage * perPage, totalItems);
            statusText = `Menampilkan ${start}-${end} dari ${totalItems} ${typeLabel} ${currentDataType === 'kanji' ? currentLevel.toUpperCase() : ''}`.trim();
        }
    }

    if(statusInfo) statusInfo.textContent = statusText;
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


function toggleSelectMode(enable) {
    isSelectMode = enable;
    selectedCards.clear();

    const cards = kanjiContainer ? kanjiContainer.querySelectorAll('.character-card') : [];
    cards.forEach(card => {
        card.classList.remove('selected');
        const existingIndicator = card.querySelector('.select-indicator');
        if (isSelectMode && !existingIndicator) {
            const indicator = document.createElement('div');
            indicator.classList.add('select-indicator');
            indicator.innerHTML = '<i class="fas fa-check-circle"></i>';
            card.insertBefore(indicator, card.firstChild);
        } else if (!isSelectMode && existingIndicator) {
            existingIndicator.remove();
        }
    });

    if(selectControlsContainer) selectControlsContainer.style.display = isSelectMode ? 'flex' : 'none';
    updateSelectControls();
    updateStatus();
}

function toggleCardSelection(cardElement, item) {
    const characterId = item.kanji || item.karakter;

    if (selectedCards.has(characterId)) {
        selectedCards.delete(characterId);
        cardElement.classList.remove('selected');
    } else {
        selectedCards.add(characterId);
        cardElement.classList.add('selected');
    }
    updateSelectControls();
}

function updateSelectControls() {
    if (!isSelectMode) {
        if(selectControlsContainer) {
             selectControlsContainer.innerHTML = '';
             selectControlsContainer.style.display = 'none';
        }
        return;
    }

    if (!selectControlsContainer) {
         console.error("Error: selectControlsContainer not found.");
         return;
    }

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

    selectControlsContainer.innerHTML = selectControlsHtml;

    const selectAllBtn = document.getElementById('selectAllBtn');
    const cancelSelectBtn = document.getElementById('cancelSelectBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');

    if (selectedCount === totalDisplayed && totalDisplayed > 0) {
        if(selectAllBtn) selectAllBtn.textContent = 'Batal Pilih Semua';
    } else {
        if(selectAllBtn) selectAllBtn.textContent = 'Pilih Semua';
    }

    if (shuffleBtn) {
        shuffleBtn.disabled = selectedCount === 0;
    }

    if (selectAllBtn) {
         selectAllBtn.addEventListener('click', handleSelectAllToggle);
    }
    if (cancelSelectBtn) {
        cancelSelectBtn.addEventListener('click', handleCancelSelect);
    }
     if (shuffleBtn) {
         shuffleBtn.addEventListener('click', handleShuffleDisplay);
     }

    if(statusInfo) statusInfo.style.display = isSelectMode ? 'none' : 'block';
    const selectedCountSpan = document.getElementById('selectedCount');
    if(selectedCountSpan) {
        selectedCountSpan.textContent = selectedCount;
    }
}

function handleSelectAllToggle() {
    const cards = kanjiContainer ? kanjiContainer.querySelectorAll('.character-card') : [];
    const totalDisplayed = cards.length;
    const selectedCount = selectedCards.size;

    if (selectedCount === totalDisplayed && totalDisplayed > 0) {
        cards.forEach(card => {
            const item = JSON.parse(card.dataset.item);
             const characterId = item.kanji || item.karakter;
             selectedCards.delete(characterId);
             card.classList.remove('selected');
        });
    } else {
        selectedCards.clear();
        cards.forEach(card => {
            const item = JSON.parse(card.dataset.item);
            const characterId = item.kanji || item.karakter;
            selectedCards.add(characterId);
            card.classList.add('selected');
        });
    }
    updateSelectControls();
}

function handleCancelSelect() {
    toggleSelectMode(false);
}

function handleShuffleDisplay() {
    if (!isSelectMode || selectedCards.size === 0) return;

    if (!filteredData || filteredData.length === 0) {
         console.error("Error: Data not found for shuffle.");
         return;
    }

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = perPage === 0 ? filteredData.length : Math.min(startIndex + perPage, filteredData.length);

    const currentViewItems = filteredData.slice(startIndex, endIndex);

    const selectedCurrentViewItems = currentViewItems.filter(item => {
         const characterId = item.kanji || item.karakter;
         return selectedCards.has(characterId);
    });

    const nonSelectedCurrentViewItems = currentViewItems.filter(item => {
         const characterId = item.kanji || item.karakter;
         return !selectedCards.has(characterId);
    });

    const shuffledSelectedCurrentViewItems = shuffleArray([...selectedCurrentViewItems]);

    const newOrderedCurrentViewItems = [];
    let shuffledIndex = 0;

    currentViewItems.forEach(item => {
         const characterId = item.kanji || item.karakter;
         if (selectedCards.has(characterId)) {
              if (shuffledIndex < shuffledSelectedCurrentViewItems.length) {
                 newOrderedCurrentViewItems.push(shuffledSelectedCurrentViewItems[shuffledIndex]);
                 shuffledIndex++;
             } else {
                  newOrderedCurrentViewItems.push(item);
             }
         } else {
             newOrderedCurrentViewItems.push(item);
         }
    });

    const updatedFilteredData = [
        ...filteredData.slice(0, startIndex),
        ...newOrderedCurrentViewItems,
        ...filteredData.slice(endIndex)
    ];

    filteredData = updatedFilteredData;

    selectedCards.clear();
    renderCharacters(filteredData, currentDataType);
    updateSelectControls();
}

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [ array[randomIndex], array[currentIndex]];
    }
    return array;
}

// This click handler is mostly disabled in the new logic,
// as mouseup/touchend handle the actions.
function handleCardClick(event) {
    console.log("Click event fired. Handled by mouseup/touchend.");
    // event.preventDefault();
}
