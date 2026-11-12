/* PadelPulse v5.1 : score en un geste
 *
 * - Au-dessus des sets : « Set gagné / Set perdu » + pastilles des scores fréquents.
 * - Toucher une pastille remplit le set actif (surligné), puis passe au set suivant
 *   (le set 2, et le set 3 s'il y a un set partout, s'affichent tout seuls).
 * - Les listes déroulantes restent là : saisie manuelle toujours possible (tie-break, score rare).
 * - Pastilles adaptées au format : sets en 6 jeux, en 9 jeux, super tie-break en compétition.
 *   Rien en « Partie libre ».
 */
(function () {
    const CHIPS = {
        six: [[6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 5], [7, 6]],
        nine: [[9, 0], [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [9, 7], [9, 8]],
        stb: [[10, 4], [10, 5], [10, 6], [10, 7], [10, 8], [11, 9], [12, 10]]
    };
    let active = 1;
    let won = true;

    function chipsFor(setNum) {
        if (currentFormat === '21pts') return null;
        if (currentFormat === '9sets') return CHIPS.nine;
        if (currentFormat === '6sets_comp' && setNum === 3) return CHIPS.stb;
        return CHIPS.six;
    }
    function rowVisible(n) {
        const r = document.getElementById('row-set-' + n);
        return !!r && r.style.display !== 'none';
    }
    function val(n, side) { return parseInt((document.getElementById('s' + n + '-' + side) || {}).value, 10) || 0; }
    function setLabel(n) {
        const l = document.getElementById('label-set-' + n);
        return l ? l.innerText.trim() : 'Set ' + n;
    }

    function ensureBar() {
        const cont = document.getElementById('sets-container');
        if (!cont) return null;
        let bar = document.getElementById('pp-quick-score');
        if (bar) return bar;
        bar = document.createElement('div');
        bar.id = 'pp-quick-score';
        bar.className = 'card-bg rounded-xl border border-padel-border p-2 space-y-1.5';
        cont.insertBefore(bar, cont.firstChild);
        [1, 2, 3].forEach(function (n) {
            const row = document.getElementById('row-set-' + n);
            if (!row) return;
            row.addEventListener('click', function () { if (chipsFor(n)) { active = n; render(); } });
        });
        return bar;
    }

    function highlight() {
        [1, 2, 3].forEach(function (n) {
            const row = document.getElementById('row-set-' + n);
            if (row) row.classList.toggle('pp-set-active', n === active && !!chipsFor(n) && rowVisible(n));
        });
    }

    function render() {
        const bar = ensureBar();
        if (!bar) return;
        const chips = chipsFor(active);
        if (!chips) { bar.style.display = 'none'; highlight(); return; }
        if (!rowVisible(active)) active = 1;
        bar.style.display = 'block';
        bar.innerHTML = '';

        const head = document.createElement('div');
        head.className = 'flex items-center justify-between gap-2';
        const title = document.createElement('span');
        title.className = 'text-[11px] font-bold text-padel-muted';
        title.textContent = ppL('Score rapide · ', 'Snelle score · ') + setLabel(active);
        const seg = document.createElement('div');
        seg.className = 'seg-group';
        [[true, ppL('Gagné', 'Gewonnen')], [false, ppL('Perdu', 'Verloren')]].forEach(function (o) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'seg-btn' + (won === o[0] ? ' is-active' : '');
            b.textContent = o[1];
            b.onclick = function (e) { e.stopPropagation(); won = o[0]; render(); };
            seg.appendChild(b);
        });
        head.appendChild(title);
        head.appendChild(seg);
        bar.appendChild(head);

        const wrap = document.createElement('div');
        wrap.className = 'flex flex-wrap gap-1.5';
        chips.forEach(function (c) {
            const us = won ? c[0] : c[1], them = won ? c[1] : c[0];
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pp-score-chip' + (val(active, 'us') === us && val(active, 'them') === them ? ' is-on' : '');
            b.textContent = us + '-' + them;
            b.onclick = function (e) { e.stopPropagation(); pick(us, them); };
            wrap.appendChild(b);
        });
        bar.appendChild(wrap);
        highlight();
    }

    function setsWon() {
        let a = 0, b = 0;
        [1, 2].forEach(function (n) {
            if (!rowVisible(n)) return;
            const u = val(n, 'us'), t = val(n, 'them');
            if (u > t) a++; else if (t > u) b++;
        });
        return [a, b];
    }

    function showRow(n) {
        if (rowVisible(n)) return;
        const box = document.getElementById('modal-match-content');
        const keep = box ? box.scrollTop : 0;
        while (visibleSetsCount < n) addSetField();
        setTimeout(function () { if (box) box.scrollTop = keep; }, 60);
    }

    function pick(us, them) {
        const n = active;
        const su = document.getElementById('s' + n + '-us'), st = document.getElementById('s' + n + '-them');
        if (!su || !st) return;
        su.value = String(us);
        st.value = String(them);
        const box = document.getElementById('modal-match-content');
        const keep = box ? box.scrollTop : 0;
        checkTieBreakVisibility(n);
        setTimeout(function () { if (box) box.scrollTop = keep; }, 70);

        // Set suivant
        if (n === 1) {
            if (!rowVisible(2)) showRow(2);
            active = 2;
        } else if (n === 2) {
            const w = setsWon();
            if (w[0] === 1 && w[1] === 1) {
                if (!rowVisible(3)) showRow(3);
                active = 3;
                won = true;
            }
        }
        render();
    }

    function resetQuick() { active = 1; won = true; render(); }

    const _prevSetFormat = setFormat;
    setFormat = function () { const r = _prevSetFormat.apply(this, arguments); resetQuick(); return r; };
    window.setFormat = setFormat;

    const _prevOpenEdit = openEditMatchModal;
    // v5.1 : la fenêtre « Modifier » s'ouvre en haut (avant : le tie-break la faisait descendre en bas)
    openEditMatchModal = function () {
        const r = _prevOpenEdit.apply(this, arguments);
        resetQuick();
        const box = document.getElementById('modal-match-content');
        if (box) { box.scrollTop = 0; setTimeout(function () { box.scrollTop = 0; }, 80); }
        return r;
    };
    window.openEditMatchModal = openEditMatchModal;

    const _prevOpen = openMatchModal;
    openMatchModal = function () { const r = _prevOpen.apply(this, arguments); resetQuick(); return r; };
    window.openMatchModal = openMatchModal;

    // Une saisie manuelle met à jour la pastille surlignée
    document.addEventListener('change', function (e) {
        if (e.target && /^s[123]-(us|them)$/.test(e.target.id || '')) render();
    });

    resetQuick();
})();
