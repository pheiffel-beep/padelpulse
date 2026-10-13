/* PadelPulse : Calendrier en lecture seule + fiche du jour (toucher une case du calendrier) */

// Le calendrier reflète uniquement les matchs et cours enregistrés.
// Les anciens changements manuels (Repos / Match / Cours) sont abandonnés.
weeklyOverrides = {};
localStorage.removeItem('padelpulse_weekly_overrides');

function dayKeyOf(item) {
    // Renvoie la date "jj/mm/aaaa" d'un match ou d'un cours
    if (item.date === "Aujourd'hui") return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return item.date;
}

function isSameDay(item, dateStr) {
    if (dayKeyOf(item) === dateStr) return true;
    if (item.timestamp) {
        const d = new Date(item.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (d === dateStr) return true;
    }
    return false;
}

getDayStatus = function(dateStr) {
    if (matches.some(m => isSameDay(m, dateStr))) return { type: 'match', label: 'Match', icon: '🎾' };
    if (lessons.some(l => isSameDay(l, dateStr))) return { type: 'lesson', label: 'Cours', icon: '🎓' };
    return { type: 'rest', label: 'Repos', icon: '💤' };
};

// ----- Fiche du jour -----
let openDayStr = null;

function dayTitle(dateStr) {
    const [d, m, y] = dateStr.split('/').map(n => parseInt(n, 10));
    const txt = new Date(y, m - 1, d).toLocaleDateString(window.PP_LOCALE || 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function renderDayLessonCard(l) {
    const notes = (l.notes || []).filter(n => n && n.trim());
    return `
        <div class="input-bg p-3 rounded-2xl border border-padel-border space-y-1.5">
            <div class="flex justify-between items-start gap-2">
                <span class="text-[12px] font-bold text-padel-terracotta bg-padel-terracotta/10 px-2 py-0.5 rounded border border-padel-terracotta/20">🎓 Cours</span>
                <button onclick="openEditLessonModal(${l.id})" title="Modifier" class="text-padel-muted hover:text-padel-terracotta text-xs p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
            </div>
            <p class="text-[12px] text-padel-muted">${l.coach || ''}${l.location ? ' • ' + l.location : ''}</p>
            <p class="text-xs text-padel-navy font-extrabold">Thème : ${l.theme || '-'}</p>
            ${notes.length ? `<ul class="lesson-notes text-[12px] font-medium text-slate-800 dark:text-slate-300 space-y-0.5 list-disc list-inside">${notes.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
        </div>`;
}

function renderDaySheet() {
    if (!openDayStr) return;
    const dayMatches = matches.filter(m => isSameDay(m, openDayStr));
    const dayLessons = lessons.filter(l => isSameDay(l, openDayStr));
    document.getElementById('day-sheet-title').innerText = dayTitle(openDayStr);
    const box = document.getElementById('day-sheet-content');
    if (dayMatches.length === 0 && dayLessons.length === 0) {
        box.innerHTML = `
            <div class="text-center py-5 space-y-1">
                <div class="text-2xl">💤</div>
                <p class="text-xs font-bold text-padel-muted">Rien ce jour-là</p>
            </div>`;
    } else {
        box.innerHTML = dayMatches.map(m => renderMatchCard(m)).join('') + dayLessons.map(l => renderDayLessonCard(l)).join('');
    }
    if (window.lucide) lucide.createIcons();
}

function openDayDetails(dateStr) {
    openDayStr = dateStr;
    renderDaySheet();
    document.getElementById('modal-day').style.display = 'flex';
    const box = document.getElementById('day-sheet-content');
    if (box) box.scrollTop = 0;
}

function closeDayDetails() {
    openDayStr = null;
    document.getElementById('modal-day').style.display = 'none';
}

function isoOf(dateStr) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
}

function addMatchOnDay() {
    const iso = isoOf(openDayStr);
    closeDayDetails();
    openMatchModal();
    const input = document.getElementById('match-date-input');
    if (input) input.value = iso;
}

function addLessonOnDay() {
    const iso = isoOf(openDayStr);
    closeDayDetails();
    openLessonModal();
    const input = document.getElementById('lesson-date-input');
    if (input) input.value = iso;
}

// Toucher une case n'altère plus le calendrier : elle ouvre la fiche du jour
cycleDayActivity = function(dateStr) { openDayDetails(dateStr); };

// Après un ajout, une modification ou une suppression, la fiche ouverte se met à jour
const _prevRenderWeeklyForDay = renderWeeklySchedule;
renderWeeklySchedule = function() {
    _prevRenderWeeklyForDay();
    if (openDayStr) renderDaySheet();
};

window.cycleDayActivity = cycleDayActivity;
window.openDayDetails = openDayDetails;
window.closeDayDetails = closeDayDetails;
window.addMatchOnDay = addMatchOnDay;
window.addLessonOnDay = addLessonOnDay;
