/* PadelPulse : Résultat « match nul » */
// ===== MATCH NUL =====
function drawsOf(item) {
    return matches.filter(function(m) {
        if (m.result !== 'MATCH NUL') return false;
        if (item.type === 'partner') return m.partner === item.name;
        return (m.opponents || '').split(/&|,|\set\s/).map(function(s) { return s.trim(); }).indexOf(item.name) !== -1;
    }).length;
}

function showResultFeedback(match) {
    const modal = document.getElementById('modal-result-feedback');
    const card = document.getElementById('feedback-card');
    const iconWrap = document.getElementById('feedback-icon-wrapper');
    const emojiEl = document.getElementById('feedback-emoji');
    const badgeEl = document.getElementById('feedback-badge');
    const titleEl = document.getElementById('feedback-title');
    const msgEl = document.getElementById('feedback-message');
    const partnerEl = document.getElementById('feedback-partner-text');
    const scoreEl = document.getElementById('feedback-score-text');
    const oppEl = document.getElementById('feedback-opponents-text');

    if (!modal || !card) return;

    if (partnerEl) partnerEl.innerText = `avec ${match.partner} (${match.courtPosition || 'Droite'})`;
    if (scoreEl) scoreEl.innerText = match.score;
    if (oppEl) oppEl.innerText = `vs ${match.opponents}`;

    if (match.result === 'VICTOIRE') {
        card.className = "card-bg w-full max-w-[320px] rounded-3xl p-5 space-y-3.5 shadow-2xl relative my-auto shrink-0 text-center border border-emerald-600/50 animate-pop-in";
        if (iconWrap) iconWrap.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg bg-emerald-600/15 text-emerald-600 border border-emerald-600/40";
        if (emojiEl) emojiEl.innerText = "🏆";
        if (badgeEl) {
            badgeEl.className = "text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-emerald-600 text-white border-emerald-600";
            badgeEl.innerText = "Victoire !";
        }
        if (titleEl) titleEl.innerText = "Super Match !";
        if (msgEl) msgEl.innerText = "Le travail paye sur le terrain ! Continue sur cette lancée 🔥";
        if (window.confetti) confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } else if (match.result === 'MATCH NUL') {
        card.className = "card-bg w-full max-w-[320px] rounded-3xl p-5 space-y-3.5 shadow-2xl relative my-auto shrink-0 text-center border border-slate-500/40 animate-pop-in";
        if (iconWrap) iconWrap.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg bg-slate-500/15 text-slate-500 border border-slate-500/40";
        if (emojiEl) emojiEl.innerText = "🤝";
        if (badgeEl) {
            badgeEl.className = "text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-slate-500 text-white border-slate-500";
            badgeEl.innerText = "Match nul";
        }
        if (titleEl) titleEl.innerText = "Match équilibré !";
        if (msgEl) msgEl.innerText = "Rien n'a pu vous départager. Place à la revanche ! 🎾";
    } else {
        card.className = "card-bg w-full max-w-[320px] rounded-3xl p-5 space-y-3.5 shadow-2xl relative my-auto shrink-0 text-center border border-rose-500/30 animate-shake";
        if (iconWrap) iconWrap.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg bg-rose-500/20 text-rose-500 border border-rose-500/30";
        if (emojiEl) emojiEl.innerText = "🧠";
        if (badgeEl) {
            badgeEl.className = "text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-rose-600 text-white border-rose-600";
            badgeEl.innerText = "Défaite";
        }
        if (titleEl) titleEl.innerText = "Bien battu !";
        if (msgEl) msgEl.innerText = "Analyse tes tags tactiques et reviens plus fort 💪";
    }
    modal.style.display = 'flex';
}
