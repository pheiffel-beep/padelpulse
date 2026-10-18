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
