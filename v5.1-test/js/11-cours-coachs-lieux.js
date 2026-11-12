/* PadelPulse : Cours : listes des coachs et des lieux */
// ===== COURS : COACHS ET LIEUX (clubs partagés avec les matchs) =====
function ensureCoachLists() {
    if (!Array.isArray(padelLists.coachesAdded)) padelLists.coachesAdded = [];
    if (!Array.isArray(padelLists.coachesRemoved)) padelLists.coachesRemoved = [];
}
try {
    const rawCoaches = JSON.parse(localStorage.getItem('padelpulse_lists'));
    padelLists.coachesAdded = (rawCoaches && Array.isArray(rawCoaches.coachesAdded)) ? rawCoaches.coachesAdded : [];
    padelLists.coachesRemoved = (rawCoaches && Array.isArray(rawCoaches.coachesRemoved)) ? rawCoaches.coachesRemoved : [];
} catch (e) { ensureCoachLists(); }

function getCoachList() {
    ensureCoachLists();
    const list = [];
    const push = function(n) {
        n = (n || '').trim();
        if (!n || n === 'Coach non précisé' || inList(list, n) || inList(padelLists.coachesRemoved, n)) return;
        list.push(n);
    };
    lessons.forEach(function(l) { push(l.coach); });
    padelLists.coachesAdded.forEach(push);
    list.sort(function(a, b) { return a.localeCompare(b, 'fr'); });
    return list;
}

// La liste des clubs inclut aussi les lieux des cours
const _prevGetClubList = getClubList;
getClubList = function() {
    const list = _prevGetClubList();
    lessons.forEach(function(l) {
        const n = (l.location || '').trim();
        if (!n || n === 'Lieu non précisé' || inList(list, n) || inList(padelLists.clubsRemoved, n)) return;
        list.push(n);
    });
    list.sort(function(a, b) { return a.localeCompare(b, 'fr'); });
    return list;
};

// ----- Coach -----
function renderCoachSelect(selected) {
    const sel = document.getElementById('lesson-coach-select');
    const input = document.getElementById('lesson-input-coach');
    const btn = document.getElementById('btn-remove-coach');
    if (!sel || !input) return;
    let wanted = (selected || '').trim();
    if (wanted === 'Coach non précisé') wanted = '';
    const list = getCoachList();
    let current = list.find(function(c) { return sameName(c, wanted); });
    if (wanted && !current) { list.push(wanted); current = wanted; }
    sel.innerHTML = '';
    sel.appendChild(new Option('Sélectionner un coach...', ''));
    list.forEach(function(c) { sel.appendChild(new Option(c, c)); });
    sel.appendChild(new Option('+ Nouveau coach...', '__NEW__'));
    sel.value = current || '';
    input.value = current || '';
    input.style.display = 'none';
    if (btn) btn.style.display = (current && !editingLessonId) ? 'block' : 'none';
}

function handleCoachSelectChange(val) {
    const input = document.getElementById('lesson-input-coach');
    const btn = document.getElementById('btn-remove-coach');
    if (!input) return;
    if (val === '__NEW__') {
        input.value = '';
        input.style.display = 'block';
        if (btn) btn.style.display = 'none';
        input.focus();
    } else {
        input.value = val;
        input.style.display = 'none';
        if (btn) btn.style.display = (val && !editingLessonId) ? 'block' : 'none';
    }
}

function removeSelectedCoach() {
    ensureCoachLists();
    const sel = document.getElementById('lesson-coach-select');
    const coach = sel ? sel.value : '';
    if (!coach || coach === '__NEW__') return;
    if (!inList(padelLists.coachesRemoved, coach)) padelLists.coachesRemoved.push(coach);
    padelLists.coachesAdded = padelLists.coachesAdded.filter(function(c) { return !sameName(c, coach); });
    saveLists();
    renderCoachSelect('');
}

// ----- Lieu du cours (même liste de clubs que les matchs) -----
function renderLessonLocationSelect(selected) {
    const sel = document.getElementById('lesson-location-select');
    const input = document.getElementById('lesson-input-location');
    const btn = document.getElementById('btn-remove-lesson-club');
    if (!sel || !input) return;
    let wanted = (selected || '').trim();
    if (wanted === 'Lieu non précisé') wanted = '';
    const list = getClubList();
    let current = list.find(function(c) { return sameName(c, wanted); });
    if (wanted && !current) { list.push(wanted); current = wanted; }
    sel.innerHTML = '';
    sel.appendChild(new Option('Sélectionner un club...', ''));
    list.forEach(function(c) { sel.appendChild(new Option(c, c)); });
    sel.appendChild(new Option('+ Nouveau club...', '__NEW__'));
    sel.value = current || '';
    input.value = current || '';
    input.style.display = 'none';
    if (btn) btn.style.display = (current && !editingLessonId) ? 'block' : 'none';
}

function handleLessonLocationChange(val) {
    const input = document.getElementById('lesson-input-location');
    const btn = document.getElementById('btn-remove-lesson-club');
    if (!input) return;
    if (val === '__NEW__') {
        input.value = '';
        input.style.display = 'block';
        if (btn) btn.style.display = 'none';
        input.focus();
    } else {
        input.value = val;
        input.style.display = 'none';
        if (btn) btn.style.display = (val && !editingLessonId) ? 'block' : 'none';
    }
}

function removeSelectedLessonClub() {
    const sel = document.getElementById('lesson-location-select');
    const club = sel ? sel.value : '';
    if (!club || club === '__NEW__') return;
    if (!inList(padelLists.clubsRemoved, club)) padelLists.clubsRemoved.push(club);
    padelLists.clubsAdded = padelLists.clubsAdded.filter(function(c) { return !sameName(c, club); });
    saveLists();
    renderLessonLocationSelect('');
}

// ----- Branchement sur les fonctions existantes -----
const _prevOpenLessonModal = openLessonModal;
openLessonModal = function() {
    _prevOpenLessonModal();
    renderCoachSelect('');
    renderLessonLocationSelect('');
};

const _prevOpenEditLessonModal = openEditLessonModal;
openEditLessonModal = function(id) {
    _prevOpenEditLessonModal(id);
    const l = lessons.find(function(x) { return x.id === id; });
    if (!l) return;
    renderCoachSelect(l.coach || '');
    renderLessonLocationSelect(l.location || '');
};

const _prevSubmitLesson = submitLesson;
submitLesson = function() {
    ensureCoachLists();
    const cIn = document.getElementById('lesson-input-coach');
    const lIn = document.getElementById('lesson-input-location');
    let coach = cIn ? cIn.value.trim() : '';
    let place = lIn ? lIn.value.trim() : '';
    if (coach) {
        const knownC = getCoachList().concat(padelLists.coachesRemoved).find(function(c) { return sameName(c, coach); });
        if (knownC) coach = knownC;
        cIn.value = coach;
    }
    if (place) {
        const knownP = getClubList().concat(padelLists.clubsRemoved).find(function(c) { return sameName(c, place); });
        if (knownP) place = knownP;
        lIn.value = place;
    }

    _prevSubmitLesson();

    if (coach) {
        padelLists.coachesRemoved = padelLists.coachesRemoved.filter(function(c) { return !sameName(c, coach); });
        if (!inList(padelLists.coachesAdded, coach)) padelLists.coachesAdded.push(coach);
    }
    if (place) {
        padelLists.clubsRemoved = padelLists.clubsRemoved.filter(function(c) { return !sameName(c, place); });
        if (!inList(padelLists.clubsAdded, place)) padelLists.clubsAdded.push(place);
    }
    saveLists();
};

const _prevConfirmReset = confirmResetData;
confirmResetData = function() {
    _prevConfirmReset();
    padelLists.coachesAdded = [];
    padelLists.coachesRemoved = [];
    saveLists();
};
