/* PadelPulse : accueil allégé, les 3 derniers matchs en lignes compactes */

function matchDayStr(m) {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(m.date || '')) return m.date;
    if (m.timestamp) return new Date(m.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return dayKeyOf(m);
}

function renderRecentMatchRow(m) {
    let badge = 'bg-slate-500 text-white border-slate-500';
    if (m.result === 'VICTOIRE') badge = 'bg-emerald-600 text-white border-emerald-600';
    if (m.result === 'DÉFAITE') badge = 'bg-rose-600 text-white border-rose-600';
    const day = matchDayStr(m);
    const short = /^\d{2}\/\d{2}\/\d{4}$/.test(day) ? day.slice(0, 5) : (m.date || '');
    return `
        <button type="button" onclick="openDayDetails('${day}')" class="w-full card-bg p-2.5 rounded-xl border border-padel-border flex items-center gap-2 text-left shadow-xs active:scale-[0.99] transition">
            <span class="text-[10px] font-bold ${badge} px-1.5 py-0.5 rounded-full border shrink-0">${m.result}</span>
            <span class="text-[11px] text-padel-muted shrink-0">${short}</span>
            <span class="text-[12px] font-bold text-padel-navy truncate flex-1 min-w-0">avec ${m.partner}</span>
            <span class="text-xs font-black text-padel-terracotta shrink-0">${m.score}</span>
            <span class="text-padel-muted text-sm shrink-0">›</span>
        </button>`;
}

const _prevRenderMatchesCompact = renderMatches;
renderMatches = function() {
    showAllRecentMatches = false;
    _prevRenderMatchesCompact();
    const box = document.getElementById('recent-matches-container');
    if (!box) return;
    const recent = getFilteredMatches().slice(0, 3);
    box.innerHTML = recent.length
        ? recent.map(renderRecentMatchRow).join('')
        : `<p class="text-[11px] text-padel-muted text-center py-4">Aucun match enregistré</p>`;
};

window.renderMatches = renderMatches;

// Changement d'onglet ou de page : on revient tout en haut de l'écran
function scrollToTop() {
    window.scrollTo(0, 0);
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
    const mc = document.getElementById('main-content');
    if (mc) mc.scrollTop = 0;
}
const _prevSwitchTabTop = switchTab;
switchTab = function(tabId) { _prevSwitchTabTop(tabId); scrollToTop(); };
const _prevMatchesPageTop = changeMatchesPage;
changeMatchesPage = function(d) { _prevMatchesPageTop(d); scrollToTop(); };
window.switchTab = switchTab;
window.changeMatchesPage = changeMatchesPage;
const _prevLessonsPageTop = changeLessonsPage;
changeLessonsPage = function(d) { _prevLessonsPageTop(d); scrollToTop(); };
window.changeLessonsPage = changeLessonsPage;
