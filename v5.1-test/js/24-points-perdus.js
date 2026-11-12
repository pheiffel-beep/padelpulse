/* PadelPulse v5.1 : « Où as-tu perdu des points ? »
 *
 * - Pas d'étape en plus : la question apparaît dans la fenêtre de résultat qui s'ouvre déjà après un match.
 * - Facultatif : on touche 0, 1 ou plusieurs pastilles, puis « Continuer » comme avant.
 *   Chaque touche est enregistrée tout de suite dans le match (champ lostPoints).
 * - Par défaut : seulement après une défaite (ou un match nul). Réglable : après chaque match / jamais.
 * - Modifiable ensuite dans la fenêtre « Modifier le match » ; visible sur la carte du match.
 * - Ces données serviront à l'encadré « Pourquoi je perds » et au bilan automatique.
 */
(function () {
    const MODE_KEY = 'padelpulse_lostpoints_mode'; // 'defaite' (défaut) | 'tous' | 'jamais'
    const REASONS = [
        { k: 'fautes', fr: 'Fautes directes', nl: 'Directe fouten' },
        { k: 'facile', fr: 'Balles trop faciles', nl: 'Te makkelijke ballen' },
        { k: 'filet', fr: 'Perte du filet', nl: 'Net verloren' },
        { k: 'petitbras', fr: 'Coups « petit bras »', nl: 'Te voorzichtig gespeeld' }
    ];
    function label(k) {
        const r = REASONS.find(function (x) { return x.k === k; });
        return r ? ppL(r.fr, r.nl) : k;
    }
    function getMode() {
        let m = null;
        try { m = localStorage.getItem(MODE_KEY); } catch (e) {}
        return (m === 'tous' || m === 'jamais') ? m : 'defaite';
    }
    function setMode(m) {
        try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
        renderSettingsRow();
    }

    function chipsRow(selected, onToggle) {
        const wrap = document.createElement('div');
        wrap.className = 'flex flex-wrap gap-1.5 justify-center';
        REASONS.forEach(function (r) {
            const on = selected.indexOf(r.k) !== -1;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pp-lp-chip' + (on ? ' is-on' : '');
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.textContent = ppL(r.fr, r.nl);
            b.onclick = function () {
                const now = b.classList.toggle('is-on');
                b.setAttribute('aria-pressed', now ? 'true' : 'false');
                onToggle(r.k, now);
            };
            wrap.appendChild(b);
        });
        return wrap;
    }

    // ----- 1. Dans la fenêtre de résultat -----
    function feedbackBlock(match) {
        const card = document.getElementById('feedback-card');
        if (!card) return;
        let box = document.getElementById('pp-lp-feedback');
        if (box) box.remove();
        const mode = getMode();
        const isWin = match.result === 'VICTOIRE';
        if (mode === 'jamais' || (mode === 'defaite' && isWin)) return;

        box = document.createElement('div');
        box.id = 'pp-lp-feedback';
        box.className = 'space-y-2 pt-1';
        const q = document.createElement('p');
        q.className = 'text-[12px] font-bold text-padel-navy';
        q.textContent = ppL('Où as-tu perdu des points ?', 'Waar verloor je punten?');
        const hint = document.createElement('p');
        hint.className = 'text-[11px] text-padel-muted';
        hint.textContent = ppL('Facultatif · plusieurs choix possibles', 'Optioneel · meerdere keuzes mogelijk');
        box.appendChild(q);
        box.appendChild(hint);
        const sel = Array.isArray(match.lostPoints) ? match.lostPoints.slice() : [];
        box.appendChild(chipsRow(sel, function (k, on) {
            const m = matches.find(function (x) { return x.id === match.id; });
            if (!m) return;
            const cur = Array.isArray(m.lostPoints) ? m.lostPoints : [];
            m.lostPoints = on ? cur.concat(cur.indexOf(k) === -1 ? [k] : []) : cur.filter(function (x) { return x !== k; });
            if (!m.lostPoints.length) delete m.lostPoints;
            saveAllData();
            try { renderMatches(); } catch (e) {}
        }));
        const btn = card.querySelector('button[onclick*="closeResultFeedbackModal"]');
        card.insertBefore(box, btn);
    }

    const _prevFeedback = showResultFeedback;
    showResultFeedback = function (match) {
        _prevFeedback.apply(this, arguments);
        if (match) feedbackBlock(match);
    };
    window.showResultFeedback = showResultFeedback;

    // ----- 2. Sur la carte du match -----
    const _prevCard = renderMatchCard;
    renderMatchCard = function (m) {
        const html = _prevCard.apply(this, arguments);
        if (!m || !Array.isArray(m.lostPoints) || !m.lostPoints.length) return html;
        const line = '<div class="flex items-center gap-1 flex-wrap text-[11px]"><span class="text-padel-muted">' +
            ppL('Points perdus :', 'Punten verloren:') + '</span>' +
            m.lostPoints.map(function (k) { return '<span class="pp-lp-tag">' + ppEsc(label(k)) + '</span>'; }).join('') + '</div>';
        const end = html.lastIndexOf('</div>');
        return end === -1 ? html : html.slice(0, end) + line + html.slice(end);
    };
    window.renderMatchCard = renderMatchCard;

    // ----- 3. Dans « Modifier le match » (seulement en modification) -----
    let editSel = [];
    function editBlock(show) {
        const comments = document.getElementById('match-comments');
        if (!comments) return;
        let box = document.getElementById('pp-lp-edit');
        if (!show) { if (box) box.style.display = 'none'; return; }
        if (!box) {
            box = document.createElement('div');
            box.id = 'pp-lp-edit';
            box.className = 'w-full max-w-full box-border space-y-1.5';
            const holder = comments.closest('div') || comments.parentNode;
            holder.parentNode.insertBefore(box, holder.nextSibling);
        }
        box.style.display = 'block';
        box.innerHTML = '';
        const l = document.createElement('label');
        l.className = 'block text-[11px] font-semibold text-padel-muted';
        l.textContent = ppL('Où as-tu perdu des points ? (Optionnel)', 'Waar verloor je punten? (Optioneel)');
        box.appendChild(l);
        const row = chipsRow(editSel, function (k, on) {
            editSel = on ? editSel.concat(editSel.indexOf(k) === -1 ? [k] : []) : editSel.filter(function (x) { return x !== k; });
        });
        row.classList.remove('justify-center');
        box.appendChild(row);
    }

    const _prevOpenEdit = openEditMatchModal;
    openEditMatchModal = function (id) {
        _prevOpenEdit.apply(this, arguments);
        const m = matches.find(function (x) { return x.id === id; });
        editSel = m && Array.isArray(m.lostPoints) ? m.lostPoints.slice() : [];
        editBlock(true);
    };
    window.openEditMatchModal = openEditMatchModal;

    const _prevReset = resetMatchModalForm;
    resetMatchModalForm = function () {
        _prevReset.apply(this, arguments);
        editSel = [];
        editBlock(false);
    };
    window.resetMatchModalForm = resetMatchModalForm;

    const _prevSubmit = submitExpressMatch;
    submitExpressMatch = function () {
        const editId = editingMatchId;
        const sel = editSel.slice();
        const r = _prevSubmit.apply(this, arguments);
        if (editId) {
            const m = matches.find(function (x) { return x.id === editId; });
            if (m) {
                if (sel.length) m.lostPoints = sel; else delete m.lostPoints;
                saveAllData();
                try { renderMatches(); } catch (e) {}
            }
        }
        return r;
    };
    window.submitExpressMatch = submitExpressMatch;

    // ----- 4. Réglage -----
    function renderSettingsRow() {
        const group = document.querySelector('#modal-settings .settings-group');
        if (!group) return;
        let row = document.getElementById('pp-settings-lp');
        if (!row) {
            row = document.createElement('div');
            row.id = 'pp-settings-lp';
            row.className = 'settings-row';
            row.style.flexWrap = 'wrap';
            const t = document.createElement('span');
            t.className = 'flex-1 min-w-0';
            t.innerHTML = '<span class="block text-[14px] font-bold text-padel-navy"></span><span class="block text-[12px] text-padel-muted"></span>';
            t.firstChild.textContent = ppL('Points perdus', 'Verloren punten');
            t.lastChild.textContent = ppL('Question après un match', 'Vraag na een match');
            row.appendChild(t);
            const seg = document.createElement('div');
            seg.className = 'seg-group';
            [['defaite', ppL('Défaites', 'Verlies')], ['tous', ppL('Tous', 'Altijd')], ['jamais', ppL('Jamais', 'Nooit')]].forEach(function (o) {
                const b = document.createElement('button');
                b.type = 'button';
                b.id = 'pp-lp-mode-' + o[0];
                b.className = 'seg-btn';
                b.textContent = o[1];
                b.onclick = function () { setMode(o[0]); };
                seg.appendChild(b);
            });
            row.appendChild(seg);
            group.appendChild(row);
        }
        const mode = getMode();
        ['defaite', 'tous', 'jamais'].forEach(function (k) {
            const b = document.getElementById('pp-lp-mode-' + k);
            if (b) b.classList.toggle('is-active', k === mode);
        });
    }
    const _prevOpenSettings = openSettingsModal;
    openSettingsModal = function () { _prevOpenSettings.apply(this, arguments); renderSettingsRow(); };
    window.openSettingsModal = openSettingsModal;

    window.PP_LOST_REASONS = REASONS;
    window.ppLostLabel = label;
    renderSettingsRow();
})();
