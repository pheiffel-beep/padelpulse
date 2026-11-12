/* PadelPulse v5.1 : Conseils
 *
 * Noter les conseils reçus en dehors d'un cours (ex. un joueur plus fort qui corrige ton service).
 * - Page Cours : deux onglets « Cours » et « Conseils ».
 * - Un conseil : texte, thème (pastille), auteur (libre ou joueur connu), date,
 *   statut À travailler / En cours / Acquis (on le change d'une touche).
 * - Saisie : bouton « + Conseil », ou « Un conseil retenu ? » dans la fenêtre après un match.
 * - Relecture : carte d'accueil « X conseils à travailler », filtre par thème.
 * - Données : localStorage « padelpulse_tips » (comprises dans la sauvegarde).
 */
(function () {
    const KEY = 'padelpulse_tips';
    const THEMES = [
        ['Service', 'Opslag'], ['Retour', 'Return'], ['Bandeja', 'Bandeja'], ['Volée', 'Volley'],
        ['Smash', 'Smash'], ['Sortie de vitre', 'Bal uit de wand'], ['Lob', 'Lob'],
        ['Placement', 'Positie'], ['Tactique', 'Tactiek'], ['Mental', 'Mentaal'], ['Physique', 'Fysiek']
    ];
    const STATUS = {
        todo: ['À travailler', 'Te oefenen'],
        doing: ['En cours', 'Bezig'],
        done: ['Acquis', 'Onder de knie']
    };
    const NEXT = { todo: 'doing', doing: 'done', done: 'todo' };

    let tips = [];
    try { const a = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(a)) tips = a; } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(tips)); } catch (e) {} }

    let view = 'lessons';      // onglet affiché dans la page Cours
    let themeFilter = '';
    let showDone = false;
    let editing = null;        // id du conseil modifié
    let form = null;           // état de la fenêtre

    function themeLabel(t) { const x = THEMES.find(function (r) { return r[0] === t; }); return x ? ppL(x[0], x[1]) : t; }
    function statusLabel(s) { return ppL(STATUS[s][0], STATUS[s][1]); }
    function todayFr() {
        const d = new Date();
        return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
    }
    function frToIso(fr) { const p = (fr || '').split('/'); return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : ''; }
    function isoToFr(iso) { const p = (iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : todayFr(); }
    function tsOf(fr) { const p = (fr || '').split('/'); return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]).getTime() : Date.now(); }
    function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
    function btn(text, cls, fn) { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b; }
    function todoCount() { return tips.filter(function (t) { return t.status !== 'done'; }).length; }

    // ===================== Page Cours : onglets =====================
    function ensureTabs() {
        const page = document.getElementById('view-lessons');
        if (!page) return;
        if (!document.getElementById('pp-cours-tabs')) {
            const lessonsCard = page.firstElementChild;
            lessonsCard.id = lessonsCard.id || 'pp-lessons-card';
            const tabs = el('div', 'seg-group w-full');
            tabs.id = 'pp-cours-tabs';
            tabs.style.display = 'flex';
            tabs.appendChild(btn('', 'seg-btn flex-1', function () { view = 'lessons'; renderAll(); }));
            tabs.appendChild(btn('', 'seg-btn flex-1', function () { view = 'tips'; renderAll(); }));
            page.insertBefore(tabs, lessonsCard);
            const tipsCard = el('div', 'card-bg p-3.5 rounded-2xl border border-padel-border space-y-3 box-border shadow-sm');
            tipsCard.id = 'pp-tips-card';
            page.insertBefore(tipsCard, lessonsCard.nextSibling);
        }
        const b = document.querySelectorAll('#pp-cours-tabs .seg-btn');
        b[0].textContent = ppL('Cours', 'Lessen') + ' (' + lessons.length + ')';
        b[1].textContent = ppL('Conseils', 'Tips') + (todoCount() ? ' (' + todoCount() + ')' : '');
        b[0].classList.toggle('is-active', view === 'lessons');
        b[1].classList.toggle('is-active', view === 'tips');
        const lessonsCard = document.getElementById('pp-cours-tabs').nextElementSibling;
        lessonsCard.style.display = view === 'lessons' ? '' : 'none';
        document.getElementById('pp-tips-card').style.display = view === 'tips' ? '' : 'none';
    }

    function tipCard(t) {
        const c = el('div', 'input-bg p-3 rounded-xl border border-padel-border space-y-1.5');
        const top = el('div', 'flex items-center justify-between gap-2');
        const left = el('div', 'flex items-center gap-1.5 flex-wrap min-w-0');
        if (t.theme) left.appendChild(el('span', 'meta-chip', themeLabel(t.theme)));
        const st = btn(statusLabel(t.status), 'pp-tip-status is-' + t.status, function () {
            t.status = NEXT[t.status] || 'todo';
            save(); renderAll();
        });
        st.title = ppL('Toucher pour changer le statut', 'Tik om de status te wijzigen');
        left.appendChild(st);
        top.appendChild(left);
        const actions = el('div', 'flex items-center gap-0.5 shrink-0');
        const ed = btn('', 'icon-btn', function () { openTipModal({ id: t.id }); });
        ed.setAttribute('aria-label', ppL('Modifier', 'Bewerken'));
        ed.innerHTML = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>';
        const del = btn('', 'icon-btn', function () { window.ppDeleteTip(t.id); });
        del.setAttribute('aria-label', ppL('Supprimer', 'Verwijderen'));
        del.innerHTML = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>';
        actions.appendChild(ed); actions.appendChild(del);
        top.appendChild(actions);
        c.appendChild(top);
        c.appendChild(el('p', 'text-[13px] text-padel-navy font-semibold leading-snug whitespace-pre-line break-words', t.text));
        c.appendChild(el('p', 'text-[11px] text-padel-muted', (t.author ? ppL('De ', 'Van ') + t.author + ' · ' : '') + t.date));
        return c;
    }

    function renderTips() {
        const card = document.getElementById('pp-tips-card');
        if (!card) return;
        card.innerHTML = '';
        const head = el('div', 'flex justify-between items-center gap-2');
        head.appendChild(el('h2', 'text-xs font-bold text-padel-navy uppercase tracking-wider', ppL('Conseils reçus', 'Ontvangen tips')));
        head.appendChild(btn('+ ' + ppL('Conseil', 'Tip'), 'bg-padel-terracotta text-white font-bold px-2.5 py-1 rounded-full text-[12px] shadow-md', function () { openTipModal({}); }));
        card.appendChild(head);

        if (!tips.length) {
            card.appendChild(el('p', 'text-[12px] text-padel-muted text-center py-3 leading-relaxed', ppL(
                'Note ici les conseils reçus hors cours : la remarque d’un joueur plus fort, une correction entendue au club…',
                'Noteer hier tips die je buiten de les krijgt: de opmerking van een sterkere speler, een correctie op de club…')));
            return;
        }

        const used = THEMES.filter(function (r) { return tips.some(function (t) { return t.theme === r[0]; }); });
        if (used.length > 1) {
            const f = el('div', 'flex gap-1.5 flex-wrap');
            const chip = function (val, txt) {
                f.appendChild(btn(txt, 'pp-lp-chip' + (themeFilter === val ? ' is-on' : ''), function () { themeFilter = val; renderTips(); }));
            };
            chip('', ppL('Tous', 'Alle'));
            used.forEach(function (r) { chip(r[0], ppL(r[0], r[1])); });
            card.appendChild(f);
        }

        const list = tips.filter(function (t) { return !themeFilter || t.theme === themeFilter; })
            .sort(function (a, b) { return (b.ts || 0) - (a.ts || 0) || b.id - a.id; });
        const open = list.filter(function (t) { return t.status !== 'done'; })
            .sort(function (a, b) { return (a.status === 'doing' ? 0 : 1) - (b.status === 'doing' ? 0 : 1); });
        const done = list.filter(function (t) { return t.status === 'done'; });

        const box = el('div', 'space-y-2');
        if (!open.length) box.appendChild(el('p', 'text-[12px] text-padel-muted text-center py-2', ppL('Rien à travailler ici. Bravo !', 'Hier valt niets te oefenen. Goed zo!')));
        open.forEach(function (t) { box.appendChild(tipCard(t)); });
        card.appendChild(box);
        if (done.length) {
            card.appendChild(btn((showDone ? '▾ ' : '▸ ') + ppL('Acquis', 'Onder de knie') + ' (' + done.length + ')', 'text-[12px] font-bold text-padel-muted', function () { showDone = !showDone; renderTips(); }));
            if (showDone) {
                const d = el('div', 'space-y-2');
                done.forEach(function (t) { d.appendChild(tipCard(t)); });
                card.appendChild(d);
            }
        }
    }

    // ===================== Carte d'accueil =====================
    function renderHomeCard() {
        const anchor = document.getElementById('backup-reminder');
        if (!anchor) return;
        let box = document.getElementById('pp-tips-home');
        if (!box) {
            box = el('button', 'w-full text-left items-center gap-2.5 p-2.5 rounded-2xl border border-padel-border card-bg shadow-sm');
            box.type = 'button';
            box.id = 'pp-tips-home';
            box.style.marginTop = '8px';
            box.onclick = function () { view = 'tips'; if (typeof switchTab === 'function') switchTab('tab-lessons'); renderAll(); };
            const after = document.getElementById('pp-clubs-banner') || anchor;
            after.parentNode.insertBefore(box, after.nextSibling);
        }
        const open = tips.filter(function (t) { return t.status !== 'done'; })
            .sort(function (a, b) { return (a.status === 'doing' ? 0 : 1) - (b.status === 'doing' ? 0 : 1) || (b.ts || 0) - (a.ts || 0); });
        if (!open.length) { box.style.display = 'none'; return; }
        box.style.display = 'flex';
        box.innerHTML = '';
        const ic = el('span', 'icon-chip chip-terra');
        ic.innerHTML = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>';
        box.appendChild(ic);
        const t = el('span', 'flex-1 min-w-0');
        const n = open.length;
        t.appendChild(el('span', 'block text-[13px] font-bold text-padel-navy', ppL(n + (n > 1 ? ' conseils à travailler' : ' conseil à travailler'), n + (n > 1 ? ' tips om te oefenen' : ' tip om te oefenen'))));
        t.appendChild(el('span', 'block text-[11px] text-padel-muted truncate', (open[0].theme ? themeLabel(open[0].theme) + ' · ' : '') + open[0].text));
        box.appendChild(t);
        box.appendChild(el('span', 'text-padel-muted shrink-0', '›'));
    }

    function renderAll() { ensureTabs(); renderTips(); renderHomeCard(); }

    // ===================== Fenêtre ajouter / modifier =====================
    function buildModal() {
        if (document.getElementById('pp-tip-modal')) return;
        const m = el('div', 'fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm');
        m.id = 'pp-tip-modal';
        m.style.display = 'none';
        m.addEventListener('click', function (e) { if (e.target === m) closeTipModal(); });
        m.innerHTML = '<div class="card-bg w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-padel-border p-4 pb-6 space-y-3 shadow-2xl max-h-[90vh] flex flex-col">' +
            '<div class="flex justify-between items-center gap-2 shrink-0"><h3 id="pp-tip-title" class="font-extrabold text-sm text-padel-navy"></h3>' +
            '<button type="button" id="pp-tip-x" class="w-9 h-9 shrink-0 rounded-full input-bg text-padel-muted flex items-center justify-center" aria-label="' + ppL('Fermer', 'Sluiten') + '">' + PP_X_SVG + '</button></div>' +
            '<div id="pp-tip-body" class="space-y-3 overflow-y-auto min-h-0"></div></div>';
        document.body.appendChild(m);
        document.getElementById('pp-tip-x').onclick = closeTipModal;
    }
    function closeTipModal() { const m = document.getElementById('pp-tip-modal'); if (m) m.style.display = 'none'; }

    function authorSuggestions() {
        const names = [];
        const add = function (n) { n = (n || '').trim(); if (n && !names.some(function (x) { return sameName(x, n); })) names.push(n); };
        tips.forEach(function (t) { add(t.author); });
        try { getCoachList().forEach(add); } catch (e) {}
        try { ppAllPlayers().forEach(function (p) { add(p.name); }); } catch (e) {}
        return names;
    }

    function openTipModal(opts) {
        buildModal();
        const t = opts.id ? tips.find(function (x) { return x.id === opts.id; }) : null;
        editing = t ? t.id : null;
        form = {
            text: t ? t.text : '',
            theme: t ? (t.theme || '') : '',
            author: t ? (t.author || '') : (opts.author || ''),
            date: t ? t.date : (opts.date || todayFr()),
            status: t ? t.status : 'todo',
            matchId: t ? t.matchId : (opts.matchId || null)
        };
        document.getElementById('pp-tip-title').textContent = t ? ppL('Modifier le conseil', 'Tip bewerken') : ppL('Nouveau conseil', 'Nieuwe tip');
        const body = document.getElementById('pp-tip-body');
        body.innerHTML = '';
        const lab = function (txt) { return el('label', 'block text-[11px] font-semibold text-padel-muted mb-1', txt); };

        const w1 = el('div');
        w1.appendChild(lab(ppL('Le conseil', 'De tip')));
        const ta = el('textarea', 'w-full box-border input-bg border border-padel-border rounded-xl p-2.5 text-padel-navy focus:outline-none');
        ta.rows = 3; ta.style.fontSize = '16px';
        ta.placeholder = ppL('Ex. : lever la raquette plus tôt au service', 'Bv.: de racket vroeger opheffen bij de opslag');
        ta.value = form.text;
        ta.oninput = function () { form.text = ta.value; err.style.display = 'none'; };
        w1.appendChild(ta);
        const err = el('p', 'text-[12px] text-rose-600 mt-1', ppL('Écris d’abord le conseil.', 'Schrijf eerst de tip.'));
        err.style.display = 'none';
        w1.appendChild(err);
        body.appendChild(w1);

        const w2 = el('div');
        w2.appendChild(lab(ppL('Thème', 'Thema')));
        const chips = el('div', 'flex gap-1.5 flex-wrap');
        const drawChips = function () {
            chips.innerHTML = '';
            THEMES.forEach(function (r) {
                chips.appendChild(btn(ppL(r[0], r[1]), 'pp-lp-chip' + (form.theme === r[0] ? ' is-on' : ''), function () {
                    form.theme = form.theme === r[0] ? '' : r[0]; drawChips();
                }));
            });
        };
        drawChips();
        w2.appendChild(chips);
        body.appendChild(w2);

        const w3 = el('div', 'grid grid-cols-2 gap-2');
        const a = el('div');
        a.appendChild(lab(ppL('De la part de', 'Van')));
        const ai = el('input', 'w-full box-border input-bg border border-padel-border rounded-xl p-2 text-padel-navy focus:outline-none');
        ai.type = 'text'; ai.style.fontSize = '16px';
        ai.placeholder = ppL('Nom (facultatif)', 'Naam (optioneel)');
        ai.value = form.author;
        ai.setAttribute('list', 'pp-tip-authors');
        ai.oninput = function () { form.author = ai.value; };
        const dl = el('datalist'); dl.id = 'pp-tip-authors';
        authorSuggestions().forEach(function (n) { const o = el('option'); o.value = n; dl.appendChild(o); });
        a.appendChild(ai); a.appendChild(dl);
        const d = el('div');
        d.appendChild(lab(ppL('Date', 'Datum')));
        const di = el('input', 'w-full box-border input-bg border border-padel-border rounded-xl p-2 text-padel-navy focus:outline-none');
        di.type = 'date'; di.style.fontSize = '16px';
        di.value = frToIso(form.date);
        di.onchange = function () { form.date = isoToFr(di.value); };
        d.appendChild(di);
        w3.appendChild(a); w3.appendChild(d);
        body.appendChild(w3);

        const w4 = el('div');
        w4.appendChild(lab(ppL('Statut', 'Status')));
        const seg = el('div', 'seg-group');
        seg.style.display = 'flex';
        const drawSeg = function () {
            seg.innerHTML = '';
            ['todo', 'doing', 'done'].forEach(function (s) {
                seg.appendChild(btn(statusLabel(s), 'seg-btn flex-1' + (form.status === s ? ' is-active' : ''), function () { form.status = s; drawSeg(); }));
            });
        };
        drawSeg();
        w4.appendChild(seg);
        body.appendChild(w4);

        const bar = el('div', 'flex gap-2 pt-1');
        bar.appendChild(btn(ppL('Annuler', 'Annuleren'), 'flex-1 input-bg border border-padel-border text-padel-muted font-bold py-3 rounded-xl text-[13px]', closeTipModal));
        bar.appendChild(btn(ppL('Enregistrer', 'Opslaan'), 'flex-[2] bg-padel-terracotta text-white font-extrabold py-3 rounded-xl text-[13px]', function () {
            const text = (form.text || '').trim();
            if (!text) { err.style.display = 'block'; ta.focus(); return; }
            const data = { text: text, theme: form.theme, author: (form.author || '').trim(), date: form.date, ts: tsOf(form.date), status: form.status };
            if (form.matchId) data.matchId = form.matchId;
            if (editing) {
                const x = tips.find(function (y) { return y.id === editing; });
                if (x) Object.assign(x, data);
            } else {
                tips.push(Object.assign({ id: Date.now() }, data));
            }
            save();
            closeTipModal();
            renderAll();
            ppShowToast(editing ? ppL('Conseil modifié', 'Tip aangepast') : ppL('Conseil enregistré', 'Tip opgeslagen'), false);
        }));
        body.appendChild(bar);

        document.getElementById('pp-tip-modal').style.display = 'flex';
        if (!t) setTimeout(function () { try { ta.focus(); } catch (e) {} }, 60);
    }

    // ===================== Suppression avec « Annuler » =====================
    window.ppDeleteTip = function (id) {
        tips = tips.filter(function (t) { return t.id !== id; });
        save();
        renderAll();
    };
    ppWithUndo('ppDeleteTip', function () { return ppL('Conseil supprimé', 'Tip verwijderd'); });

    // ===================== Depuis la fenêtre après un match =====================
    const _prevFeedback = showResultFeedback;
    showResultFeedback = function (match) {
        _prevFeedback.apply(this, arguments);
        const card = document.getElementById('feedback-card');
        if (!card || !match) return;
        let row = document.getElementById('pp-tip-feedback');
        if (row) row.remove();
        row = el('div', 'flex items-center justify-center gap-2 pt-1');
        row.id = 'pp-tip-feedback';
        row.appendChild(el('span', 'text-[12px] font-bold text-padel-navy', ppL('Un conseil retenu ?', 'Een tip onthouden?')));
        row.appendChild(btn('+ ' + ppL('Noter', 'Noteren'), 'pp-dup-btn', function () {
            openTipModal({ date: match.date, matchId: match.id });
        }));
        const b = card.querySelector('button[onclick*="closeResultFeedbackModal"]');
        card.insertBefore(row, b);
    };
    window.showResultFeedback = showResultFeedback;

    // ===================== Branchements =====================
    const _prevRenderLessons = renderLessons;
    renderLessons = function () { const r = _prevRenderLessons.apply(this, arguments); ensureTabs(); return r; };
    window.renderLessons = renderLessons;

    const _prevReset = confirmResetData;
    confirmResetData = function () { const r = _prevReset.apply(this, arguments); tips = []; renderAll(); return r; };
    window.confirmResetData = confirmResetData;

    window.ppOpenTipModal = openTipModal;
    window.ppGetTips = function () { return tips.slice(); };
    renderAll();
})();
