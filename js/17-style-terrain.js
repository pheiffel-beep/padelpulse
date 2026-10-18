/* PadelPulse v4.8 : style « Terrain bleu » (accueil, calendrier, dernières parties) */

const PP_NL = function() { return window.PP_LANG === 'nl'; };

// ----- 1. Filtres Tous / Amicaux / Compétitions dans le bloc bleu -----
const _prevSetMatchTypeFilterStyle = setMatchTypeFilter;
setMatchTypeFilter = function(type) {
    _prevSetMatchTypeFilterStyle(type);
    ['all', 'amical', 'competition'].forEach(function(t) {
        const btn = document.getElementById('filter-type-' + t);
        if (btn) btn.className = 'hero-filter' + (t === type ? ' is-active' : '');
    });
};

// ----- 2. Série des derniers matchs (V / N / D) -----
function resultLetter(m) {
    if (m.result === 'VICTOIRE') return PP_NL() ? 'W' : 'V';
    if (m.result === 'DÉFAITE') return PP_NL() ? 'V' : 'D';
    return PP_NL() ? 'G' : 'N';
}
function resultClass(m) {
    if (m.result === 'VICTOIRE') return 'res-win';
    if (m.result === 'DÉFAITE') return 'res-loss';
    return 'res-draw';
}

function renderHeroForm() {
    const box = document.getElementById('hero-form');
    if (!box) return;
    const last = getFilteredMatches().slice(0, 5).reverse(); // du plus ancien au plus récent
    if (!last.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
    const n = last.length;
    const label = PP_NL() ? ('Laatste ' + n) : (n > 1 ? n + ' derniers' : 'Dernier');
    box.innerHTML =
        '<span class="text-[11px] font-bold whitespace-nowrap" style="opacity:.85">' + label + '</span>' +
        '<div class="flex gap-1.5">' + last.map(function(m) {
            return '<span class="form-pill ' + resultClass(m) + '">' + resultLetter(m) + '</span>';
        }).join('') + '</div>' +
        '<span class="text-[11px] whitespace-nowrap" style="opacity:.85">' + (PP_NL() ? '→ recent' : '→ récent') + '</span>';
    box.style.display = 'flex';
}

// ----- 3. Récapitulatif : pastilles d'icônes -----
const PIN_SVG = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>';
const USER_SVG = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.5 3.5 5.2"/></svg>';

function restyleSummaryGrid() {
    const grid = document.getElementById('stats-summary-grid');
    if (!grid) return;
    const cards = grid.children;
    if (cards.length < 2) return;
    [[cards[0], 'chip-court', PIN_SVG], [cards[1], 'chip-terra', USER_SVG]].forEach(function(c) {
        const card = c[0];
        const label = card.querySelector('span');
        if (!label) return;
        const icon = label.querySelector('i, svg');
        if (icon) icon.remove();
        label.className = 'text-[11px] font-bold text-padel-muted block';
        const chip = document.createElement('span');
        chip.className = 'icon-chip ' + c[1];
        chip.innerHTML = c[2];
        card.insertBefore(chip, label);
        card.className = 'input-bg p-3 rounded-2xl border border-padel-border space-y-1 min-w-0';
        const name = card.querySelector('p');
        if (name) name.className = 'font-extrabold text-[15px] text-padel-navy truncate';
    });
}

const _prevUpdateStatsStyle = updateStats;
updateStats = function() {
    _prevUpdateStatsStyle();
    restyleSummaryGrid();
    renderHeroForm();
};

// ----- 4. Calendrier semaine : jours de match en terracotta, cours en bleu -----
const _prevRenderWeeklyStyle = renderWeeklySchedule;
renderWeeklySchedule = function() {
    _prevRenderWeeklyStyle();
    const container = document.getElementById('weekly-grid');
    if (!container) return;
    container.className = 'grid grid-cols-7 gap-1.5 text-center';
    container.innerHTML = getCurrentWeekDays().map(function(d) {
        const status = getDayStatus(d.dateStr);
        const kind = status.type === 'match' ? 'day-match' : (status.type === 'lesson' ? 'day-lesson' : 'day-rest');
        return '<div onclick="cycleDayActivity(\'' + d.dateStr + '\')" title="' + d.dateStr + ' : ' + status.label + '" class="day-cell ' + kind + (d.isToday ? ' day-today' : '') + '" style="height:56px">' +
            '<span class="text-[11px] font-extrabold">' + d.letter + '</span>' +
            '<span class="font-num text-[18px] font-bold leading-none">' + d.dateNum + '</span>' +
            '</div>';
    }).join('');
};

// ----- 5. Calendrier mois : même code couleur -----
const _prevRenderMonthlyStyle = renderMonthlySchedule;
renderMonthlySchedule = function() {
    _prevRenderMonthlyStyle();
    const container = document.getElementById('monthly-grid');
    if (!container) return;
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let start = new Date(year, month, 1).getDay() - 1;
    if (start === -1) start = 6;
    const todayStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    let html = '';
    for (let i = 0; i < start; i++) html += '<div style="height:40px"></div>';
    for (let n = 1; n <= daysInMonth; n++) {
        const dateStr = new Date(year, month, n).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const status = getDayStatus(dateStr);
        const kind = status.type === 'match' ? 'day-match' : (status.type === 'lesson' ? 'day-lesson' : 'day-rest');
        html += '<div onclick="cycleDayActivity(\'' + dateStr + '\')" title="' + dateStr + ' : ' + status.label + '" class="day-cell ' + kind + (dateStr === todayStr ? ' day-today' : '') + '" style="height:40px;border-radius:11px">' +
            '<span class="font-num text-[15px] font-bold leading-none">' + n + '</span></div>';
    }
    container.className = 'grid grid-cols-7 gap-1.5 text-center';
    container.innerHTML = html;
};

// ----- 6. Bouton Semaine / Mois et titre de la carte -----
const _prevSetRhythmStyle = setRhythmViewMode;
setRhythmViewMode = function(mode) {
    _prevSetRhythmStyle(mode);
    const isMonth = mode === 'month';
    const w = document.getElementById('btn-rhythm-week');
    const m = document.getElementById('btn-rhythm-month');
    if (w) w.className = 'seg-btn' + (isMonth ? '' : ' is-active');
    if (m) m.className = 'seg-btn' + (isMonth ? ' is-active' : '');
    const title = document.getElementById('rhythm-section-title');
    if (title) title.innerText = isMonth ? 'Ce mois-ci' : 'Cette semaine';
    const count = document.getElementById('weekly-session-count');
    if (count) count.style.display = isMonth ? 'none' : '';
};

// ----- 7. Dernières parties : résultat en carré, score en gros -----
renderRecentMatchRow = function(m) {
    const day = matchDayStr(m);
    const parts = day.split('/');
    let when = day;
    if (parts.length === 3) {
        const dt = new Date(+parts[2], +parts[1] - 1, +parts[0]);
        when = dt.toLocaleDateString(window.PP_LOCALE || 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    const where = m.location ? ' · ' + m.location : '';
    return '<button type="button" onclick="openDayDetails(\'' + day + '\')" class="w-full card-bg px-3 py-2.5 rounded-2xl border border-padel-border flex items-center gap-2.5 text-left active:scale-[0.99] transition">' +
        '<span class="res-square ' + resultClass(m) + '">' + resultLetter(m) + '</span>' +
        '<span class="flex flex-col min-w-0 flex-1">' +
            '<span class="text-[13px] font-bold text-padel-navy truncate">avec ' + (m.partner || '-') + '</span>' +
            '<span class="text-[11px] text-padel-muted truncate">' + when + where + '</span>' +
        '</span>' +
        '<span class="font-num text-[20px] font-bold text-padel-navy shrink-0">' + (m.score || '') + '</span>' +
        '</button>';
};

window.setMatchTypeFilter = setMatchTypeFilter;
window.setRhythmViewMode = setRhythmViewMode;
window.updateStats = updateStats;
window.renderWeeklySchedule = renderWeeklySchedule;
window.renderMonthlySchedule = renderMonthlySchedule;
window.renderRecentMatchRow = renderRecentMatchRow;

// ===== v4.8 (suite) : toutes les pages =====
function ppSvg(paths, size, sw) {
    return '<svg aria-hidden="true" width="' + (size || 14) + '" height="' + (size || 14) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2.2) + '" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0 pointer-events-none">' + paths + '</svg>';
}
const ICON = {
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    ball: '<circle cx="12" cy="12" r="10"/><path d="M5.6 5.6c3.3 3.3 3.3 9.5 0 12.8M18.4 5.6c-3.3 3.3-3.3 9.5 0 12.8"/>',
    pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    pos: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 12h16M12 3v18"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    thumb: '<path d="M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
    meh: '<circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/>',
    battery: '<rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2M6 11v2"/>',
    pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>'
};
window.ppSvg = ppSvg; window.PP_ICON = ICON;

// Réglages : sélecteurs à onglets
markChoice = function(id, active) {
    const el = document.getElementById(id);
    if (el) el.className = 'seg-btn' + (active ? ' is-active' : '');
};

// Filtres de l'onglet Matchs
const _prevSetMatchTypeFilterMatches = setMatchTypeFilter;
setMatchTypeFilter = function(type) {
    _prevSetMatchTypeFilterMatches(type);
    ['all', 'amical', 'competition'].forEach(function(t) {
        const btn = document.getElementById('filter-type-' + t + '-matches');
        if (btn) btn.className = 'seg-btn w-full' + (t === type ? ' is-active' : '');
    });
};
window.setMatchTypeFilter = setMatchTypeFilter;

// Ressenti : texte sans émoji + petite icône
function feelingParts(f) {
    const txt = (f || 'En forme').replace(/^[^A-Za-zÀ-ÿ]+/, '').trim();
    const icon = /forme/i.test(txt) ? ICON.bolt : /normal/i.test(txt) ? ICON.thumb : /moyen/i.test(txt) ? ICON.meh : ICON.battery;
    return { txt: txt, icon: icon };
}

// Carte de match (onglet Matchs et fiche du jour)
renderMatchCard = function(m) {
    const isComp = m.type === 'competition';
    const typeChip = '<span class="meta-chip' + (isComp ? ' is-comp' : '') + '">' + ppSvg(isComp ? ICON.trophy : ICON.ball, 12) + '<span>' + (isComp ? 'Compétition' : 'Amical') + '</span></span>';
    const posChip = '<span class="meta-chip">' + ppSvg(ICON.pos, 12) + '<span>Pos: ' + (m.courtPosition || 'Droite') + '</span></span>';
    const locChip = m.location ? '<span class="meta-chip">' + ppSvg(ICON.pin, 12) + '<span>' + m.location + '</span></span>' : '';
    const fe = feelingParts(m.feeling);
    return '' +
    '<div class="card-bg p-3.5 rounded-2xl border border-padel-border space-y-2.5 relative">' +
        '<div class="flex items-center gap-3">' +
            '<span class="res-square ' + resultClass(m) + '">' + resultLetter(m) + '</span>' +
            '<div class="min-w-0 flex-1">' +
                '<p class="text-[14px] font-extrabold text-padel-navy truncate">avec ' + (m.partner || '-') + '</p>' +
                '<p class="text-[12px] text-padel-muted truncate">vs ' + (m.opponents || '-') + '</p>' +
            '</div>' +
            '<div class="text-right shrink-0 max-w-[42%]">' +
                '<span class="font-num text-[22px] font-bold text-padel-navy block leading-none">' + (m.score || '') + '</span>' +
                '<span class="text-[11px] text-padel-muted block mt-1 leading-tight">' + (m.format || '') + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="flex items-center gap-1.5 flex-wrap">' +
            '<span class="meta-chip">' + ppSvg(ICON.cal, 12) + '<span>' + (m.date || '') + '</span></span>' +
            typeChip + posChip + locChip +
        '</div>' +
        (m.comments ? '<div class="input-bg px-3 py-2 rounded-xl border border-padel-border text-[12px] text-padel-navy italic flex gap-2"><span class="text-padel-muted pt-0.5">' + ppSvg(ICON.quote, 12) + '</span><span class="min-w-0">' + m.comments + '</span></div>' : '') +
        '<div class="flex items-center justify-between gap-2 border-t border-padel-border pt-2">' +
            '<span class="flex items-center gap-1.5 text-[12px] font-semibold text-padel-muted min-w-0">' + ppSvg(fe.icon, 13) + '<span>' + fe.txt + '</span></span>' +
            '<div class="flex items-center gap-0.5 shrink-0">' +
                '<button onclick="openEditMatchModal(' + m.id + ')" title="Modifier" aria-label="Modifier" class="icon-btn">' + ppSvg(ICON.pencil, 16) + '</button>' +
                '<button onclick="deleteMatch(' + m.id + ')" title="Supprimer" aria-label="Supprimer" class="icon-btn">' + ppSvg(ICON.trash, 16) + '</button>' +
            '</div>' +
        '</div>' +
        ((m.tags || []).length ? '<div class="flex gap-1 flex-wrap">' + m.tags.map(function(t) { return '<span class="meta-chip">' + t + '</span>'; }).join('') + '</div>' : '') +
    '</div>';
};
window.renderMatchCard = renderMatchCard;

// Fenêtre après un match : icône au lieu de l'émoji
const _prevShowResultFeedbackStyle = showResultFeedback;
showResultFeedback = function(match) {
    _prevShowResultFeedbackStyle(match);
    const em = document.getElementById('feedback-emoji');
    const icon = match && match.result === 'VICTOIRE' ? ICON.trophy : (match && match.result === 'DÉFAITE' ? ICON.target : ICON.handshake);
    if (em) em.innerHTML = ppSvg(icon, 30, 2);
    const msg = document.getElementById('feedback-message');
    if (msg) msg.innerText = msg.innerText.replace(/\s*[☀-➿\uD83C-􏰀-\uDFFF️]+\s*$/, '');
};
window.showResultFeedback = showResultFeedback;
