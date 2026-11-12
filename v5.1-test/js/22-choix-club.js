/* PadelPulse v5.1 : choix du club avec recherche
 *
 * - Le champ « Lieu / Club » du formulaire de match devient un champ de recherche :
 *   on tape les premières lettres, on touche une suggestion.
 * - Sans rien taper : seulement « Mes clubs » (les clubs déjà utilisés), pour ne pas alourdir l'écran.
 * - En tapant : « Mes clubs » d'abord, puis la liste des clubs de Belgique (PP_CLUBS_OFFICIELS),
 *   puis « Ajouter » pour un club qui n'existe pas encore.
 * - Rien ne change dans les données : le club reste un simple texte enregistré dans le match.
 *   Les clubs déjà saisis ne sont jamais renommés.
 */
(function () {
    const MAX_MINE = 5;
    const MAX_OFFICIAL = 6;
    const MIN_CHARS = 2;

    function plain(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
    const PROVINCES_NL = {
        'Anvers': 'Antwerpen', 'Limbourg': 'Limburg', 'Flandre orientale': 'Oost-Vlaanderen',
        'Flandre occidentale': 'West-Vlaanderen', 'Brabant flamand': 'Vlaams-Brabant', 'Brabant wallon': 'Waals-Brabant',
        'Hainaut': 'Henegouwen', 'Namur': 'Namen', 'Liège': 'Luik', 'Bruxelles-Capitale': 'Brussel', 'Luxembourg': 'Luxemburg'
    };
    function provinceLabel(p) {
        return (window.PP_LANG === 'nl' && PROVINCES_NL[p]) ? PROVINCES_NL[p] : p;
    }
    function officialList() { return Array.isArray(window.PP_CLUBS_OFFICIELS) ? window.PP_CLUBS_OFFICIELS : []; }

    // Les clubs de l'utilisateur, du plus fréquent au moins fréquent
    function myClubsRanked() {
        const names = getClubList();
        const count = {};
        matches.forEach(function (m) {
            const n = (m.location || '').trim();
            if (!n) return;
            const found = names.find(function (c) { return sameName(c, n); });
            if (found) count[found] = (count[found] || 0) + 1;
        });
        return names.slice().sort(function (a, b) {
            return ((count[b] || 0) - (count[a] || 0)) || a.localeCompare(b, 'fr');
        });
    }

    function matchesQuery(text, words) {
        const p = plain(text);
        return words.every(function (w) { return p.indexOf(w) !== -1; });
    }

    function ensureUi() {
        const sel = document.getElementById('match-location-select');
        if (!sel) return null;
        let btn = document.getElementById('club-picker-btn');
        if (btn) return btn;

        sel.style.display = 'none';
        const wrap = sel.parentNode;

        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'club-picker-btn';
        btn.className = 'w-full max-w-full box-border input-bg border border-padel-border rounded-xl pl-8 pr-8 py-1.5 text-xs text-padel-navy text-left focus:outline-none focus:border-padel-terracotta transition cursor-pointer truncate';
        btn.setAttribute('aria-expanded', 'false');
        btn.onclick = togglePanel;
        const label = document.createElement('span');
        label.id = 'club-picker-label';
        btn.appendChild(label);
        const chev = document.createElement('span');
        chev.setAttribute('aria-hidden', 'true');
        chev.textContent = '▾';
        chev.className = 'absolute right-3 top-1/2 -translate-y-1/2 text-padel-muted pointer-events-none';
        wrap.appendChild(btn);
        wrap.appendChild(chev);

        const panel = document.createElement('div');
        panel.id = 'club-picker-panel';
        panel.style.display = 'none';
        panel.className = 'w-full box-border mt-1.5 rounded-xl border border-padel-border input-bg p-2';
        const search = document.createElement('input');
        search.type = 'text';
        search.id = 'club-picker-search';
        search.setAttribute('autocomplete', 'off');
        search.setAttribute('autocapitalize', 'none');
        search.setAttribute('enterkeyhint', 'search');
        search.setAttribute('placeholder', '🔍 Tape le nom ou la ville du club...');
        search.className = 'w-full max-w-full box-border card-bg border border-padel-border rounded-xl px-3 py-1.5 text-xs text-padel-navy placeholder:text-slate-400 focus:outline-none focus:border-padel-terracotta';
        search.oninput = renderResults;
        const results = document.createElement('div');
        results.id = 'club-picker-results';
        results.className = 'mt-1.5';
        panel.appendChild(search);
        panel.appendChild(results);
        wrap.parentNode.insertBefore(panel, wrap.nextSibling);
        return btn;
    }

    function currentClub() {
        const input = document.getElementById('match-location');
        return input ? input.value.trim() : '';
    }

    function refreshLabel() {
        const label = document.getElementById('club-picker-label');
        if (!label) return;
        const cur = currentClub();
        label.textContent = cur || 'Sélectionner un club...';
        label.style.opacity = cur ? '1' : '0.6';
    }

    function isOpen() {
        const panel = document.getElementById('club-picker-panel');
        return !!panel && panel.style.display !== 'none';
    }

    function closePanel() {
        const panel = document.getElementById('club-picker-panel');
        const btn = document.getElementById('club-picker-btn');
        if (panel) panel.style.display = 'none';
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function togglePanel() {
        if (!ensureUi()) return;
        if (isOpen()) { closePanel(); return; }
        const panel = document.getElementById('club-picker-panel');
        const btn = document.getElementById('club-picker-btn');
        const search = document.getElementById('club-picker-search');
        panel.style.display = 'block';
        btn.setAttribute('aria-expanded', 'true');
        search.value = '';
        renderResults();
        setTimeout(function () { try { search.focus(); } catch (e) {} }, 30);
    }

    function row(title, subtitle, onPick, extraClass) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'w-full text-left px-2 py-1.5 rounded-lg hover:opacity-80 transition ' + (extraClass || '');
        const t = document.createElement('span');
        t.className = 'block text-xs text-padel-navy truncate';
        t.textContent = title;
        b.appendChild(t);
        if (subtitle) {
            const s = document.createElement('span');
            s.className = 'block text-[10px] text-padel-muted truncate';
            s.textContent = subtitle;
            b.appendChild(s);
        }
        b.onclick = onPick;
        return b;
    }

    function heading(text) {
        const h = document.createElement('p');
        h.className = 'text-[10px] font-semibold text-padel-muted uppercase tracking-wide px-2 pt-1 pb-0.5';
        h.textContent = text;
        return h;
    }

    function hint(text) {
        const p = document.createElement('p');
        p.className = 'text-[11px] text-padel-muted px-2 py-1';
        p.textContent = text;
        return p;
    }

    function renderResults() {
        const box = document.getElementById('club-picker-results');
        const search = document.getElementById('club-picker-search');
        if (!box || !search) return;
        box.innerHTML = '';
        const raw = search.value.trim();
        const words = plain(raw).split(' ').filter(Boolean);
        const mine = myClubsRanked();

        if (raw.length < MIN_CHARS) {
            if (mine.length) {
                box.appendChild(heading('Mes clubs'));
                mine.slice(0, MAX_MINE).forEach(function (c) { box.appendChild(row(c, '', function () { pick(c); })); });
                if (mine.length > MAX_MINE) box.appendChild(hint('Tape quelques lettres pour retrouver les autres.'));
            }
            const total = officialList().length;
            if (total) box.appendChild(hint('Cherche parmi ' + total + ' clubs de Belgique : tape le nom ou la ville.'));
            else box.appendChild(hint('Tape le nom du club pour le chercher ou l\'ajouter.'));
            return;
        }

        const mineHits = mine.filter(function (c) { return matchesQuery(c, words); }).slice(0, MAX_MINE);
        if (mineHits.length) {
            box.appendChild(heading('Mes clubs'));
            mineHits.forEach(function (c) { box.appendChild(row(c, '', function () { pick(c); })); });
        }

        const officialHits = [];
        officialList().forEach(function (c) {
            if (officialHits.length >= MAX_OFFICIAL) return;
            if (mine.some(function (m) { return sameName(m, c[0]); })) return;
            if (matchesQuery(c[0] + ' ' + c[1], words)) officialHits.push(c);
        });
        if (officialHits.length) {
            box.appendChild(heading('Clubs de Belgique'));
            officialHits.forEach(function (c) {
                box.appendChild(row(c[0], c[1] + (c[2] ? ' · ' + provinceLabel(c[2]) : ''), function () { pick(c[0]); }));
            });
        }

        const exact = mine.concat(officialList().map(function (c) { return c[0]; })).some(function (n) { return sameName(n, raw); });
        if (!exact) {
            box.appendChild(row('+ Ajouter « ' + raw + ' »', 'Club absent de la liste', function () { pick(raw); }, 'border border-padel-border mt-1'));
        }
        if (!mineHits.length && !officialHits.length) {
            box.insertBefore(hint('Aucun club trouvé avec ces lettres.'), box.firstChild);
        }
    }

    function pick(name) {
        const sel = document.getElementById('match-location-select');
        const input = document.getElementById('match-location');
        if (!sel || !input) return;
        const clean = String(name || '').trim();
        if (!clean) return;
        let known = getClubList().find(function (c) { return sameName(c, clean); });
        const value = known || clean;
        const exists = Array.prototype.some.call(sel.options, function (o) { return o.value === value; });
        if (!exists) sel.add(new Option(value, value), sel.options.length - 1);
        sel.value = value;
        handleLocationSelectChange(value);
        input.style.display = 'none';
        refreshLabel();
        closePanel();
    }

    // Branchement sur le rendu existant (remise à zéro, modification d'un match, pré-remplissage)
    const _origRenderLocationSelect = renderLocationSelect;
    renderLocationSelect = function (selected) {
        _origRenderLocationSelect(selected);
        if (!ensureUi()) return;
        const input = document.getElementById('match-location');
        if (input) input.style.display = 'none';
        closePanel();
        refreshLabel();
    };

    const _origRemoveSelectedClub = removeSelectedClub;
    removeSelectedClub = function () {
        _origRemoveSelectedClub();
        refreshLabel();
    };

    document.addEventListener('click', function (e) {
        if (!isOpen()) return;
        const panel = document.getElementById('club-picker-panel');
        const btn = document.getElementById('club-picker-btn');
        if (panel && panel.contains(e.target)) return;
        if (btn && btn.contains(e.target)) return;
        closePanel();
    });

    ensureUi();
    refreshLabel();
})();
