/* PadelPulse : Listes : coéquipiers, joueurs retirés, clubs */
// ===== LISTES : COÉQUIPIERS, JOUEURS RETIRÉS, CLUBS =====
let padelLists = { clubsAdded: [], clubsRemoved: [], hiddenPlayers: [] };
try {
    const rawLists = JSON.parse(localStorage.getItem('padelpulse_lists'));
    if (rawLists && typeof rawLists === 'object') {
        padelLists.clubsAdded = Array.isArray(rawLists.clubsAdded) ? rawLists.clubsAdded : [];
        padelLists.clubsRemoved = Array.isArray(rawLists.clubsRemoved) ? rawLists.clubsRemoved : [];
        padelLists.hiddenPlayers = Array.isArray(rawLists.hiddenPlayers) ? rawLists.hiddenPlayers : [];
    }
} catch (e) {}

function saveLists() {
    try { localStorage.setItem('padelpulse_lists', JSON.stringify(padelLists)); } catch (e) {}
}
function sameName(a, b) { return (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase(); }
function inList(arr, name) { return arr.some(function(x) { return sameName(x, name); }); }
function isPlayerHidden(name) { return inList(padelLists.hiddenPlayers, name); }

// ----- Coéquipiers -----
function getPartnerList() {
    const list = [];
    const push = function(n) {
        n = (n || '').trim();
        if (!n || n === 'Coéquipier' || inList(list, n) || isPlayerHidden(n)) return;
        list.push(n);
    };
    matches.forEach(function(m) { push(m.partner); });
    Object.keys(playersDatabase).forEach(function(n) {
        if (playersDatabase[n] && playersDatabase[n].isPartner) push(n);
    });
    list.sort(function(a, b) { return a.localeCompare(b, 'fr'); });
    return list;
}

function updatePartnerDropdownOptions() {
    const select = document.getElementById('match-partner');
    if (!select) return;
    select.innerHTML = '';
    select.appendChild(new Option('Sélectionner un coéquipier...', ''));
    getPartnerList().forEach(function(name) {
        const rank = (playersDatabase[name] && playersDatabase[name].rank) || 'P200';
        select.appendChild(new Option(name + ' (' + rank + ')', name));
    });
    select.appendChild(new Option('+ Créer un nouveau partenaire...', '__NEW__'));
    select.value = '';
}

// ----- Modifier / retirer un joueur -----
function renamePlayer(oldName, newName) {
    matches.forEach(function(m) {
        if (m.partner === oldName) m.partner = newName;
        if (m.opponents) {
            const parts = m.opponents.split(/&|,|\set\s/).map(function(s) { return s.trim(); }).filter(Boolean);
            if (parts.indexOf(oldName) !== -1) {
                m.opponents = parts.map(function(p) { return p === oldName ? newName : p; }).join(' & ');
            }
        }
    });
    if (playersDatabase[oldName]) {
        const wasPartner = playersDatabase[oldName].isPartner;
        if (!playersDatabase[newName]) playersDatabase[newName] = playersDatabase[oldName];
        else if (wasPartner) playersDatabase[newName].isPartner = true;
        delete playersDatabase[oldName];
    }
    padelLists.hiddenPlayers = padelLists.hiddenPlayers.filter(function(h) { return !sameName(h, newName); });
    saveLists();
}

function openEditPlayerModal(playerName) {
    editingPlayerName = playerName;
    const nameEl = document.getElementById('edit-player-name-input');
    const selectEl = document.getElementById('edit-player-rank-select');
    if (nameEl) nameEl.value = playerName;
    if (selectEl) selectEl.value = (playersDatabase[playerName] && playersDatabase[playerName].rank) || 'P200';
    document.getElementById('modal-edit-player').style.display = 'flex';
}

function savePlayerRankEdit() {
    if (!editingPlayerName) return;
    const oldName = editingPlayerName;
    const nameInput = document.getElementById('edit-player-name-input');
    const newName = ((nameInput && nameInput.value) || '').trim() || oldName;
    const newRank = document.getElementById('edit-player-rank-select').value;
    const newGender = newRank.endsWith('D') ? 'F' : 'M';

    if (newName !== oldName) renamePlayer(oldName, newName);
    if (!playersDatabase[newName]) playersDatabase[newName] = { rank: newRank, gender: newGender };
    else { playersDatabase[newName].rank = newRank; playersDatabase[newName].gender = newGender; }

    saveAllData(); renderMatches(); updateStats(); updatePartnerDropdownOptions(); closeEditPlayerModal();
}

function removePlayerFromLists() {
    if (!editingPlayerName) return;
    if (!isPlayerHidden(editingPlayerName)) padelLists.hiddenPlayers.push(editingPlayerName);
    saveLists();
    updatePartnerDropdownOptions(); renderPlayersStats(); closeEditPlayerModal();
}

// ----- Clubs -----
function getClubList() {
    const list = [];
    const push = function(n) {
        n = (n || '').trim();
        if (!n || inList(list, n) || inList(padelLists.clubsRemoved, n)) return;
        list.push(n);
    };
    matches.forEach(function(m) { push(m.location); });
    padelLists.clubsAdded.forEach(push);
    list.sort(function(a, b) { return a.localeCompare(b, 'fr'); });
    return list;
}

function renderLocationSelect(selected) {
    const sel = document.getElementById('match-location-select');
    const input = document.getElementById('match-location');
    const btn = document.getElementById('btn-remove-club');
    if (!sel || !input) return;
    const wanted = (selected || '').trim();
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
    if (btn) btn.style.display = (current && !editingMatchId) ? 'block' : 'none';
}

function handleLocationSelectChange(val) {
    const input = document.getElementById('match-location');
    const btn = document.getElementById('btn-remove-club');
    if (!input) return;
    if (val === '__NEW__') {
        input.value = '';
        input.style.display = 'block';
        if (btn) btn.style.display = 'none';
        input.focus();
    } else {
        input.value = val;
        input.style.display = 'none';
        if (btn) btn.style.display = (val && !editingMatchId) ? 'block' : 'none';
    }
}

function removeSelectedClub() {
    const sel = document.getElementById('match-location-select');
    const club = sel ? sel.value : '';
    if (!club || club === '__NEW__') return;
    if (!inList(padelLists.clubsRemoved, club)) padelLists.clubsRemoved.push(club);
    padelLists.clubsAdded = padelLists.clubsAdded.filter(function(c) { return !sameName(c, club); });
    saveLists();
    renderLocationSelect('');
}

// ----- Branchement sur les fonctions existantes -----
const _origResetMatchModalForm = resetMatchModalForm;
resetMatchModalForm = function() {
    _origResetMatchModalForm();
    renderLocationSelect('');
};

const _origOpenEditMatchModal = openEditMatchModal;
openEditMatchModal = function(id) {
    _origOpenEditMatchModal(id);
    const m = matches.find(function(x) { return x.id === id; });
    if (!m) return;
    renderLocationSelect(m.location || '');
    const sel = document.getElementById('match-partner');
    if (sel && m.partner && m.partner !== 'Coéquipier') {
        const exists = Array.prototype.some.call(sel.options, function(o) { return o.value === m.partner; });
        if (!exists) sel.add(new Option(m.partner, m.partner), sel.options.length - 1);
        sel.value = m.partner;
    }
};

const _origSubmitExpressMatch = submitExpressMatch;
submitExpressMatch = function() {
    const wasEditing = !!editingMatchId;

    const locInput = document.getElementById('match-location');
    let loc = locInput ? locInput.value.trim() : '';
    if (loc) {
        const known = getClubList().concat(padelLists.clubsRemoved).find(function(c) { return sameName(c, loc); });
        if (known) loc = known;
        locInput.value = loc;
    }

    let partner = document.getElementById('match-partner') ? document.getElementById('match-partner').value : '';
    const newFields = document.getElementById('new-partner-fields');
    if (newFields && newFields.style.display !== 'none') {
        const di = document.querySelector('.new-partner-dynamic-input');
        if (di && di.value.trim()) partner = di.value.trim();
    }
    const opp1 = (document.getElementById('match-opp1-name').value || '').trim();
    const opp2 = (document.getElementById('match-opp2-name').value || '').trim();

    _origSubmitExpressMatch();

    if (!wasEditing) {
        const used = [partner, opp1, opp2];
        padelLists.hiddenPlayers = padelLists.hiddenPlayers.filter(function(h) {
            return !used.some(function(n) { return n && sameName(n, h); });
        });
    }
    if (loc) {
        padelLists.clubsRemoved = padelLists.clubsRemoved.filter(function(c) { return !sameName(c, loc); });
        if (!inList(padelLists.clubsAdded, loc)) padelLists.clubsAdded.push(loc);
    }
    if (partner && partner !== '__NEW__' && playersDatabase[partner]) {
        playersDatabase[partner].isPartner = true;
    }
    saveLists(); saveAllData();
    updatePartnerDropdownOptions();
};

const _origConfirmResetData = confirmResetData;
confirmResetData = function() {
    _origConfirmResetData();
    padelLists = { clubsAdded: [], clubsRemoved: [], hiddenPlayers: [] };
};
