/* PadelPulse : recherche rapide du coéquipier + historique par joueur */

const NLMODE = function() { return window.PP_LANG === 'nl'; };
function normName(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// ----- 1. Recherche rapide dans la liste des coéquipiers -----
function partnerMatchesQuery(name, q) {
    if (!q) return true;
    const n = normName(name);
    if (n.startsWith(q)) return true;
    return n.split(/[\s\-']+/).some(w => w.startsWith(q));
}

function filterPartnerOptions() {
    const input = document.getElementById('partner-search');
    const select = document.getElementById('match-partner');
    if (!input || !select) return;
    const q = normName(input.value);
    const previous = select.value;
    const found = getPartnerList().filter(n => partnerMatchesQuery(n, q));
    select.innerHTML = '';
    const first = q
        ? (found.length === 0 ? (NLMODE() ? 'Geen partner gevonden' : 'Aucun coéquipier trouvé')
            : (NLMODE() ? found.length + ' gevonden – kies…' : found.length + ' trouvé' + (found.length > 1 ? 's' : '') + ' – choisis…'))
        : 'Sélectionner un coéquipier...';
    select.appendChild(new Option(first, ''));
    found.forEach(name => {
        const rank = (playersDatabase[name] && playersDatabase[name].rank) || 'P200';
        select.appendChild(new Option(name + ' (' + rank + ')', name));
    });
    select.appendChild(new Option('+ Créer un nouveau partenaire...', '__NEW__'));
    if (found.length === 1 && q) {
        select.value = found[0];
        handlePartnerSelectChange(found[0]);
    } else if (found.includes(previous)) {
        select.value = previous;
    } else {
        select.value = '';
        if (previous && previous !== '__NEW__') handlePartnerSelectChange('');
    }
}

function refreshPartnerSearchVisibility() {
    const input = document.getElementById('partner-search');
    if (!input) return;
    input.value = '';
    input.style.display = getPartnerList().length > 5 ? 'block' : 'none';
}

const _prevUpdatePartnerOptions = updatePartnerDropdownOptions;
updatePartnerDropdownOptions = function() {
    _prevUpdatePartnerOptions();
    refreshPartnerSearchVisibility();
};

// À chaque ouverture du formulaire, la recherche repart de zéro (liste complète)
const _prevResetMatchForm = resetMatchModalForm;
resetMatchModalForm = function() {
    const input = document.getElementById('partner-search');
    if (input && input.value) { input.value = ''; filterPartnerOptions(); }
    refreshPartnerSearchVisibility();
    _prevResetMatchForm();
};

// ----- 2. Historique d'un joueur (toucher sa fiche dans « Bilan joueurs ») -----
function oppNamesOf(m) {
    return (m.opponents || '').split(/&|,|\set\s/).map(s => s.trim()).filter(Boolean);
}

function resultCounts(list) {
    const w = list.filter(m => m.result === 'VICTOIRE').length;
    const d = list.filter(m => m.result === 'MATCH NUL').length;
    return { w: w, d: d, l: list.length - w - d };
}

function summaryText(list) {
    const c = resultCounts(list);
    const n = list.length;
    if (NLMODE()) return `${n} ${n === 1 ? 'match' : 'matchen'} · ${c.w}W${c.d ? ' – ' + c.d + 'G' : ''} – ${c.l}V`;
    return `${n} match${n > 1 ? 's' : ''} · ${c.w}V${c.d ? ' – ' + c.d + 'N' : ''} – ${c.l}D`;
}

function sortByDateDesc(list) {
    const key = m => {
        if (m.timestamp) return m.timestamp;
        const p = matchDayStr(m).split('/');
        return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]).getTime() : 0;
    };
    return list.slice().sort((a, b) => key(b) - key(a));
}

function playerMatchRow(m, asPartner) {
    const day = matchDayStr(m);
    const label = asPartner ? 'vs ' + (m.opponents || '-') : 'avec ' + (m.partner || '-');
    return `
        <button type="button" onclick="openDayDetails('${day}')" class="w-full input-bg p-2.5 rounded-xl border border-padel-border text-left active:scale-[0.99] transition">
            <div class="flex items-center gap-2.5">
                <span class="res-square ${resultClass(m)}" style="width:30px;height:30px;border-radius:10px;font-size:16px">${resultLetter(m)}</span>
                <span class="flex flex-col min-w-0 flex-1">
                    <span class="text-[12px] text-padel-navy font-bold truncate">${label}</span>
                    <span class="text-[11px] text-padel-muted truncate">${day}${m.location ? ' · ' + m.location : ''}</span>
                </span>
                <span class="font-num text-[18px] font-bold text-padel-navy shrink-0">${m.score}</span>
            </div>
        </button>`;
}

function playerSection(title, list, asPartner) {
    if (!list.length) return '';
    return `
        <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2 px-1">
                <span class="text-[11px] font-bold text-padel-muted uppercase tracking-wider">${title}</span>
                <span class="text-[11px] font-bold text-padel-navy">${summaryText(list)}</span>
            </div>
            ${sortByDateDesc(list).map(m => playerMatchRow(m, asPartner)).join('')}
        </div>`;
}

let openPlayerName = null;

function renderPlayerHistory() {
    if (!openPlayerName) return;
    const key = normName(openPlayerName);
    const withList = matches.filter(m => normName(m.partner) === key);
    const againstList = matches.filter(m => oppNamesOf(m).some(o => normName(o) === key));
    const info = playersDatabase[openPlayerName];
    document.getElementById('player-sheet-title').innerText = openPlayerName + (info && info.rank ? ' (' + info.rank + ')' : '');
    const box = document.getElementById('player-sheet-content');
    if (!withList.length && !againstList.length) {
        box.innerHTML = `<p class="text-xs text-padel-muted text-center py-5">Aucun match enregistré</p>`;
    } else {
        box.innerHTML = playerSection('Ensemble', withList, true) + playerSection('Contre', againstList, false);
    }
}

function openPlayerHistory(name) {
    openPlayerName = name;
    renderPlayerHistory();
    document.getElementById('modal-player').style.display = 'flex';
    const box = document.getElementById('player-sheet-content');
    if (box) box.scrollTop = 0;
}

function closePlayerHistory() {
    openPlayerName = null;
    document.getElementById('modal-player').style.display = 'none';
}

// Après une modification ou une suppression de match, la fiche ouverte se met à jour
const _prevRenderWeeklyForPlayer = renderWeeklySchedule;
renderWeeklySchedule = function() {
    _prevRenderWeeklyForPlayer();
    if (openPlayerName) renderPlayerHistory();
};

window.filterPartnerOptions = filterPartnerOptions;
window.openPlayerHistory = openPlayerHistory;
window.closePlayerHistory = closePlayerHistory;
