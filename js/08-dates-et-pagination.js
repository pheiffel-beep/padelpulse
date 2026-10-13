/* PadelPulse : Calendriers de dates (raquettes, surgrips, chaussures) et pagination des cours */
// ===== DATES RAQUETTES + PAGINATION COURS =====
function isoToFr(iso) {
    if (!iso) return '';
    const p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
}
function frToIso(fr) {
    const p = (fr || '').split('/');
    return (p.length === 3 && p[2].length === 4) ? p[2] + '-' + p[1] + '-' + p[0] : '';
}
function todayIso() {
    const t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
}

function openRacketModal() {
    editingRacketTarget = null;
    if (document.getElementById('racket-input-name')) document.getElementById('racket-input-name').value = '';
    if (document.getElementById('racket-input-date')) document.getElementById('racket-input-date').value = todayIso();
    document.getElementById('modal-racket').style.display = 'flex';
}

function openEditRacketModal(target) {
    editingRacketTarget = target;
    let currentData = { name: '', date: '' };
    if (target === 'main') currentData = mainRacket;
    else if (target === 'backup') currentData = backupRacket;
    else if (target === 'test') currentData = testRacket;
    else if (typeof target === 'number' && racketsHistory[target]) currentData = { name: racketsHistory[target].name, date: racketsHistory[target].dates };

    if (document.getElementById('racket-input-name')) document.getElementById('racket-input-name').value = currentData.name || '';
    if (document.getElementById('racket-input-date')) document.getElementById('racket-input-date').value = frToIso(currentData.date) || todayIso();
    document.getElementById('modal-racket').style.display = 'flex';
}

function submitRacket() {
    const name = document.getElementById('racket-input-name')?.value.trim();
    const status = document.getElementById('racket-input-status')?.value;
    const date = isoToFr(document.getElementById('racket-input-date')?.value || todayIso());
    if (!name) return;

    if (editingRacketTarget !== null) {
        if (editingRacketTarget === 'main') mainRacket = { ...mainRacket, name: name, date: date };
        else if (editingRacketTarget === 'backup') backupRacket = { ...backupRacket, name: name, date: date };
        else if (editingRacketTarget === 'test') testRacket = { ...testRacket, name: name, date: date };
        else if (typeof editingRacketTarget === 'number' && racketsHistory[editingRacketTarget]) {
            racketsHistory[editingRacketTarget].name = name;
            racketsHistory[editingRacketTarget].dates = date;
        }
    } else {
        if (status === 'main') {
            if (mainRacket.name && mainRacket.name !== 'Aucune raquette enregistrée') {
                racketsHistory.unshift({ name: mainRacket.name, dates: mainRacket.date, matches: (mainRacket.matchesCount || 0) + ' matchs' });
            }
            mainRacket = { name: name, date: date, matchesCount: 0 };
        } else if (status === 'backup') {
            if (backupRacket.name && backupRacket.name !== 'Aucune raquette de réserve') {
                racketsHistory.unshift({ name: backupRacket.name, dates: backupRacket.date, matches: (backupRacket.matchesCount || 0) + ' matchs' });
            }
            backupRacket = { name: name, date: date, matchesCount: 0 };
        } else if (status === 'test') {
            if (testRacket.name && testRacket.name !== 'Aucune raquette test') {
                racketsHistory.unshift({ name: testRacket.name, dates: testRacket.date, matches: (testRacket.matchesCount || 0) + ' matchs' });
            }
            testRacket = { name: name, date: date, matchesCount: 0 };
        } else {
            racketsHistory.unshift({ name: name, dates: date, matches: '0 match' });
        }
    }
    editingRacketTarget = null;
    saveAllData(); renderRackets(); closeRacketModal();
}

let currentLessonsPage = 1;
const lessonsPerPage = 5;

function changeLessonsPage(direction) {
    currentLessonsPage += direction;
    renderLessons();
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.scrollTop = 0;
}

function renderLessons() {
    const container = document.getElementById('lessons-container');
    const toggleBtn = document.getElementById('btn-toggle-all-lessons');
    const pagination = document.getElementById('lessons-pagination-controls');
    if (!container) return;
    if (toggleBtn) toggleBtn.style.display = 'none';

    if (lessons.length === 0) {
        container.innerHTML = `<p class="text-[12px] text-padel-muted text-center py-4">Aucun cours privé enregistré</p>`;
        if (pagination) pagination.style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(lessons.length / lessonsPerPage) || 1;
    if (currentLessonsPage > totalPages) currentLessonsPage = totalPages;
    if (currentLessonsPage < 1) currentLessonsPage = 1;
    const startIdx = (currentLessonsPage - 1) * lessonsPerPage;
    const pageItems = lessons.slice(startIdx, startIdx + lessonsPerPage);

    container.innerHTML = pageItems.map(l => `
        <div class="input-bg p-3 rounded-xl border border-padel-border space-y-2 relative group">
            <div class="flex justify-between items-start gap-2">
                <span class="text-[12px] font-bold text-padel-terracotta bg-padel-terracotta/10 px-2 py-0.5 rounded border border-padel-terracotta/20">${l.date}</span>
                <div class="flex items-center gap-2">
                    <div class="text-right flex items-center gap-1.5 text-[12px] text-padel-muted">
                        <span class="font-medium text-padel-navy flex items-center gap-1"><i data-lucide="user" class="w-3 h-3 text-padel-terracotta"></i> ${l.coach}</span>
                        <span>•</span>
                        <span class="text-padel-muted flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3 text-amber-600"></i> ${l.location}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="openEditLessonModal(${l.id})" title="Modifier" class="text-padel-muted hover:text-padel-terracotta text-xs p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                        <button onclick="deleteLesson(${l.id})" title="Supprimer" class="text-padel-muted hover:text-rose-500 text-xs p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                    </div>
                </div>
            </div>
            <p class="text-xs text-padel-navy font-extrabold pt-0.5">Thème : ${l.theme}</p>
            <ul class="lesson-notes text-sm font-medium text-slate-800 dark:text-slate-300 space-y-1 list-disc list-inside">
                ${l.notes.map(n => `<li>${n}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    if (pagination) {
        if (lessons.length > lessonsPerPage) {
            pagination.style.display = 'flex';
            pagination.innerHTML = `
                <button onclick="changeLessonsPage(-1)" ${currentLessonsPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl text-xs font-bold card-bg border border-padel-border ${currentLessonsPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 text-padel-terracotta'} transition shadow-xs">◀ Précédent</button>
                <span class="text-[12px] font-bold text-padel-muted">Page ${currentLessonsPage} / ${totalPages}</span>
                <button onclick="changeLessonsPage(1)" ${currentLessonsPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl text-xs font-bold card-bg border border-padel-border ${currentLessonsPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 text-padel-terracotta'} transition shadow-xs">Suivant ▶</button>
            `;
        } else {
            pagination.style.display = 'none';
        }
    }
    if (window.lucide) lucide.createIcons();
}
// ===== DATES SURGRIPS + CHAUSSURES =====
function anyDateToIso(str) {
    const m = (str || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : '';
}

function openSurgripModal() {
    editingSurgripTarget = null;
    if (document.getElementById('surgrip-input-name')) document.getElementById('surgrip-input-name').value = '';
    if (document.getElementById('surgrip-input-date')) document.getElementById('surgrip-input-date').value = todayIso();
    document.getElementById('modal-surgrip').style.display = 'flex';
}

function openEditSurgripModal(target) {
    editingSurgripTarget = target;
    let currentData = { name: '', date: '' };
    if (target === 'current') currentData = currentSurgrip;
    else if (typeof target === 'number' && surgripsHistory[target]) currentData = { name: surgripsHistory[target].name, date: surgripsHistory[target].date };

    if (document.getElementById('surgrip-input-name')) document.getElementById('surgrip-input-name').value = currentData.name || '';
    if (document.getElementById('surgrip-input-date')) document.getElementById('surgrip-input-date').value = anyDateToIso(currentData.date) || todayIso();
    document.getElementById('modal-surgrip').style.display = 'flex';
}

function submitSurgrip() {
    const name = document.getElementById('surgrip-input-name')?.value.trim();
    const date = isoToFr(document.getElementById('surgrip-input-date')?.value || todayIso());
    if (!name) return;

    if (editingSurgripTarget !== null) {
        if (editingSurgripTarget === 'current') currentSurgrip = { name: name, date: date };
        else if (typeof editingSurgripTarget === 'number' && surgripsHistory[editingSurgripTarget]) {
            surgripsHistory[editingSurgripTarget].name = name;
            surgripsHistory[editingSurgripTarget].date = 'Posé le ' + date;
        }
    } else {
        if (currentSurgrip.name && currentSurgrip.name !== 'Aucun surgrip enregistré') {
            surgripsHistory.unshift({ name: currentSurgrip.name, date: 'Posé le ' + currentSurgrip.date, matches: currentSurgripMatchCount + ' matchs' });
        }
        currentSurgrip = { name: name, date: date };
        currentSurgripMatchCount = 0;
    }
    editingSurgripTarget = null;
    saveAllData(); renderMatches(); renderSurgrips(); closeSurgripModal();
}

function openShoesModal() {
    editingShoesTarget = null;
    if (document.getElementById('shoes-input-name')) document.getElementById('shoes-input-name').value = '';
    if (document.getElementById('shoes-input-date')) document.getElementById('shoes-input-date').value = todayIso();
    document.getElementById('modal-shoes').style.display = 'flex';
}

function openEditShoesModal(target) {
    editingShoesTarget = target;
    let currentData = { name: '', date: '' };
    if (target === 'current') currentData = currentShoes;
    else if (typeof target === 'number' && shoesHistory[target]) currentData = { name: shoesHistory[target].name, date: shoesHistory[target].date };

    if (document.getElementById('shoes-input-name')) document.getElementById('shoes-input-name').value = currentData.name || '';
    if (document.getElementById('shoes-input-date')) document.getElementById('shoes-input-date').value = anyDateToIso(currentData.date) || todayIso();
    document.getElementById('modal-shoes').style.display = 'flex';
}

function submitShoes() {
    const name = document.getElementById('shoes-input-name')?.value.trim();
    const date = isoToFr(document.getElementById('shoes-input-date')?.value || todayIso());
    if (!name) return;

    if (editingShoesTarget !== null) {
        if (editingShoesTarget === 'current') currentShoes = { name: name, date: date };
        else if (typeof editingShoesTarget === 'number' && shoesHistory[editingShoesTarget]) {
            shoesHistory[editingShoesTarget].name = name;
            shoesHistory[editingShoesTarget].date = 'Acquises le ' + date;
        }
    } else {
        if (currentShoes.name && currentShoes.name !== 'Aucune paire enregistrée') {
            shoesHistory.unshift({ name: currentShoes.name, date: 'Acquises le ' + currentShoes.date, matches: currentShoesMatchCount + ' matchs' });
        }
        currentShoes = { name: name, date: date };
        currentShoesMatchCount = 0;
    }
    editingShoesTarget = null;
    saveAllData(); renderMatches(); renderShoes(); closeShoesModal();
}
