/* PadelPulse v5.1 : harmoniser et fusionner les clubs
 *
 * Même principe que la fusion des joueurs (v5.0) : rien ne change sans l'accord de l'utilisateur.
 * - « À harmoniser » : un club saisi ressemble à un club de la liste de Belgique
 *   (ex. « Tero Charleroi » → « Tero Padel Club Charleroi ») ou à un autre club saisi.
 * - « Fusionner avec… » : pour les cas non détectés (surnoms).
 * - La fusion change le club des matchs ET des cours ; « Annuler » juste après ; rappel de sauvegarde.
 * - Accès : Réglages → Mes clubs, et un bandeau sur l'accueil quand il y a des suggestions.
 */
(function () {
    const REFUSED_KEY = 'padelpulse_clubs_not_same';
    const BANNER_KEY = 'padelpulse_clubs_banner_seen';
    const STOP = {
        padel: 1, club: 1, clubs: 1, tennis: 1, tennisclub: 1, padelclub: 1, tc: 1, t: 1, c: 1, pc: 1, ptc: 1, tpc: 1, rtc: 1,
        royal: 1, r: 1, k: 1, de: 1, du: 1, des: 1, la: 1, le: 1, les: 1, l: 1, d: 1, et: 1, en: 1, the: 1, van: 1, het: 1,
        sport: 1, sports: 1, vzw: 1, asbl: 1, centre: 1, center: 1, sportif: 1, indoor: 1, and: 1
    };

    function plain(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    }
    function core(s) {
        return plain(s).split(' ').filter(function (w) { return w && !STOP[w]; });
    }
    function lev(a, b) {
        if (a === b) return 0;
        if (Math.abs(a.length - b.length) > 2) return 3;
        let prev = [];
        for (let j = 0; j <= b.length; j++) prev[j] = j;
        for (let i = 1; i <= a.length; i++) {
            const cur = [i];
            for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            prev = cur;
        }
        return prev[b.length];
    }
    function subset(a, b) { return a.length > 0 && a.every(function (w) { return b.indexOf(w) !== -1; }); }

    // Deux noms de clubs désignent-ils sans doute le même endroit ?
    function looksSame(a, b) {
        const A = core(a), B = core(b);
        if (!A.length || !B.length) return false;
        const ja = A.join(' '), jb = B.join(' ');
        if (ja === jb) return true;
        const L = Math.min(ja.length, jb.length);
        if (L >= 5 && lev(ja, jb) <= 1) return true;
        const small = A.length <= B.length ? A : B, big = A.length <= B.length ? B : A;
        return subset(small, big) && small.some(function (w) { return w.length >= 4; }) && small.length >= Math.min(2, big.length);
    }
    // Un club saisi correspond-il à un club officiel (nom + ville) ?
    function looksLikeOfficial(mine, off) {
        const M = core(mine), N = core(off[0]);
        if (!M.length || !N.length) return false;
        if (looksSame(mine, off[0])) return true;
        const withCity = N.concat(core(off[1]));
        return subset(M, withCity) && M.some(function (w) { return N.indexOf(w) !== -1 && w.length >= 4; });
    }

    function officialList() { return Array.isArray(window.PP_CLUBS_OFFICIELS) ? window.PP_CLUBS_OFFICIELS : []; }
    function isOfficial(name) { return officialList().some(function (c) { return sameName(c[0], name); }); }
    function officialOf(name) { return officialList().find(function (c) { return sameName(c[0], name); }) || null; }

    function refused() { try { const a = JSON.parse(localStorage.getItem(REFUSED_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
    function saveRefused(a) { try { localStorage.setItem(REFUSED_KEY, JSON.stringify(a)); } catch (e) {} }
    function pairKey(a, b) { return [plain(a), plain(b)].sort().join('|'); }

    function matchCount(name) { return matches.filter(function (m) { return sameName(m.location, name); }).length; }
    function lessonCount(name) { return lessons.filter(function (l) { return sameName(l.location, name); }).length; }
    function usage(name) {
        const m = matchCount(name), l = lessonCount(name);
        const parts = [];
        if (m || !l) parts.push(ppMatchesWord(m));
        if (l) parts.push(l + ' ' + ppL('cours', l === 1 ? 'les' : 'lessen'));
        return parts.join(' · ');
    }
    function myClubs() {
        return getClubList().slice().sort(function (a, b) {
            return (matchCount(b) + lessonCount(b)) - (matchCount(a) + lessonCount(a)) || a.localeCompare(b, 'fr');
        });
    }

    // Suggestions : vers la liste officielle, puis entre clubs saisis
    function suggestions() {
        const mine = myClubs();
        const no = refused();
        const out = [];
        const used = {};
        mine.forEach(function (c) {
            if (isOfficial(c)) return;
            const hits = officialList().filter(function (o) { return looksLikeOfficial(c, o); });
            if (hits.length !== 1) return;
            const target = hits[0][0];
            if (no.indexOf(pairKey(c, target)) !== -1) return;
            if (mine.some(function (x) { return sameName(x, target); })) return; // traité comme paire entre mes clubs
            out.push({ a: c, b: target, official: true });
            used[plain(c)] = 1;
        });
        for (let i = 0; i < mine.length; i++) {
            for (let j = i + 1; j < mine.length; j++) {
                const a = mine[i], b = mine[j];
                if (no.indexOf(pairKey(a, b)) !== -1) continue;
                if (looksSame(a, b)) out.push({ a: a, b: b, official: false });
            }
        }
        return out;
    }

    // ----- Fusion -----
    function mergeClubs(from, into) {
        const isFrom = function (n) { return sameName(n, from); };
        matches.forEach(function (m) { if (isFrom(m.location)) m.location = into; });
        lessons.forEach(function (l) { if (isFrom(l.location)) l.location = into; });
        padelLists.clubsAdded = padelLists.clubsAdded.filter(function (c) { return !isFrom(c); });
        padelLists.clubsRemoved = padelLists.clubsRemoved.filter(function (c) { return !isFrom(c) && !sameName(c, into); });
        if (!inList(padelLists.clubsAdded, into)) padelLists.clubsAdded.push(into);
        const fk = plain(from);
        saveRefused(refused().filter(function (k) { return k.split('|').indexOf(fk) === -1; }));
        saveAllData();
        saveLists();
        try { renderMatches(); } catch (e) {}
        try { updateStats(); } catch (e) {}
        try { renderLessons(); } catch (e) {}
        try { renderWeeklySchedule(); } catch (e) {}
        try { renderPlayersStats(); } catch (e) {}
        renderBanner();
        renderSettingsRow();
    }

    // ----- Fenêtre « Mes clubs » -----
    let state = { a: null, b: null, keep: null, from: 'list' };

    function buildModal() {
        if (document.getElementById('pp-club-modal')) return;
        const div = document.createElement('div');
        div.id = 'pp-club-modal';
        div.className = 'fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm';
        div.style.display = 'none';
        div.addEventListener('click', function (e) { if (e.target === div) closeModal(); });
        div.innerHTML = '<div class="card-bg w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-padel-border p-4 pb-6 space-y-3 shadow-2xl max-h-[88vh] flex flex-col">' +
            '<div class="flex justify-between items-center gap-2 shrink-0">' +
                '<button type="button" id="pp-club-back" class="text-[12px] font-bold text-padel-muted shrink-0" style="display:none">‹ ' + ppL('Retour', 'Terug') + '</button>' +
                '<h3 id="pp-club-title" class="font-extrabold text-sm text-padel-navy min-w-0 flex-1"></h3>' +
                '<button type="button" id="pp-club-close" class="w-9 h-9 shrink-0 rounded-full input-bg text-padel-muted flex items-center justify-center" aria-label="' + ppL('Fermer', 'Sluiten') + '">' + PP_X_SVG + '</button>' +
            '</div>' +
            '<div id="pp-club-body" class="space-y-3 overflow-y-auto min-h-0"></div>' +
        '</div>';
        document.body.appendChild(div);
        document.getElementById('pp-club-close').onclick = closeModal;
        document.getElementById('pp-club-back').onclick = function () { openClubs(); };
    }
    function closeModal() { const m = document.getElementById('pp-club-modal'); if (m) m.style.display = 'none'; }
    function show(title, withBack) {
        buildModal();
        document.getElementById('pp-club-title').textContent = title;
        document.getElementById('pp-club-back').style.display = withBack ? 'inline-block' : 'none';
        document.getElementById('pp-club-modal').style.display = 'flex';
        return document.getElementById('pp-club-body');
    }
    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }
    function btn(text, cls, onClick) {
        const b = el('button', cls, text);
        b.type = 'button';
        b.onclick = onClick;
        return b;
    }

    function suggestionCard(list, limit) {
        const card = el('div', 'pp-dup-card');
        const head = el('div', 'flex items-center gap-1.5 text-[12px] font-extrabold text-padel-navy');
        head.innerHTML = '<span class="pp-flag">' + PP_WARN_SVG + '</span>';
        head.appendChild(el('span', '', ppL('Clubs à harmoniser', 'Clubs om gelijk te trekken') + ' (' + list.length + ')'));
        card.appendChild(head);
        card.appendChild(el('p', 'text-[11px] text-padel-muted', ppL(
            'Ces noms désignent sans doute le même club. Rien ne change sans ton accord.',
            'Deze namen zijn waarschijnlijk dezelfde club. Er verandert niets zonder jouw akkoord.')));
        list.slice(0, limit).forEach(function (s) {
            const row = el('div', 'pp-dup-row');
            const t = el('div', 'text-[12px] text-padel-navy font-bold leading-snug break-words');
            t.appendChild(document.createTextNode(s.a + ' '));
            t.appendChild(el('span', 'text-padel-muted font-medium', '(' + usage(s.a) + ')'));
            t.appendChild(el('span', 'text-padel-muted', s.official ? ' → ' : ' ⇄ '));
            t.appendChild(document.createTextNode(s.b));
            if (!s.official) t.appendChild(el('span', 'text-padel-muted font-medium', ' (' + usage(s.b) + ')'));
            row.appendChild(t);
            if (s.official) {
                const o = officialOf(s.b);
                if (o) row.appendChild(el('div', 'text-[10px] text-padel-muted', o[1]));
            }
            const bar = el('div', 'flex gap-1.5 mt-1.5 flex-wrap');
            bar.appendChild(btn(ppL('Harmoniser', 'Gelijktrekken'), 'pp-dup-btn is-main', function () { openConfirm(s.a, s.b, 'list'); }));
            bar.appendChild(btn(s.official ? ppL('Garder mon nom', 'Mijn naam houden') : ppL('Ce sont 2 clubs', 'Het zijn 2 clubs'), 'pp-dup-btn', function () {
                const r = refused(); const k = pairKey(s.a, s.b);
                if (r.indexOf(k) === -1) r.push(k);
                saveRefused(r);
                renderBanner(); renderSettingsRow(); openClubs();
            }));
            row.appendChild(bar);
            card.appendChild(row);
        });
        if (list.length > limit) card.appendChild(el('p', 'text-[11px] text-padel-muted text-center',
            ppL('Encore ' + (list.length - limit) + ' après celles-ci', 'Nog ' + (list.length - limit) + ' na deze')));
        return card;
    }

    function openClubs() {
        const body = show(ppL('Mes clubs', 'Mijn clubs'), false);
        body.innerHTML = '';
        const sug = suggestions();
        if (sug.length) body.appendChild(suggestionCard(sug, 6));
        const mine = myClubs();
        if (!mine.length) {
            body.appendChild(el('p', 'text-xs text-padel-muted text-center py-4', ppL('Aucun club enregistré pour l’instant.', 'Nog geen club opgeslagen.')));
            return;
        }
        body.appendChild(el('p', 'text-[12px] font-bold text-padel-muted', ppL('Tous mes clubs', 'Al mijn clubs') + ' (' + mine.length + ')'));
        const wrap = el('div', 'space-y-1.5');
        mine.forEach(function (c) {
            const row = el('div', 'input-bg rounded-xl border border-padel-border px-3 py-2 flex items-center gap-2');
            const txt = el('div', 'min-w-0 flex-1');
            txt.appendChild(el('span', 'block text-[13px] font-bold text-padel-navy break-words', c));
            const o = officialOf(c);
            txt.appendChild(el('span', 'block text-[11px] text-padel-muted', usage(c) + (o ? ' · ' + o[1] : '')));
            row.appendChild(txt);
            row.appendChild(btn(ppL('Fusionner…', 'Samenvoegen…'), 'pp-dup-btn shrink-0', function () { openPicker(c); }));
            wrap.appendChild(row);
        });
        body.appendChild(wrap);
    }

    function openPicker(name) {
        const body = show(ppL('Fusionner « ' + name + ' » avec…', '« ' + name + ' » samenvoegen met…'), true);
        body.innerHTML = '';
        body.appendChild(el('p', 'text-[12px] text-padel-muted', ppL(
            'Choisis l’autre nom de ce club : un de tes clubs ou un club de la liste de Belgique.',
            'Kies de andere naam van deze club: een van je clubs of een club uit de lijst van België.')));
        const search = el('input', 'w-full box-border input-bg border border-padel-border rounded-xl p-2.5 text-padel-navy focus:outline-none');
        search.type = 'text';
        search.setAttribute('autocomplete', 'off');
        search.setAttribute('spellcheck', 'false');
        search.style.fontSize = '16px';
        search.placeholder = ppL('Rechercher un club ou une ville…', 'Club of stad zoeken…');
        body.appendChild(search);
        const list = el('div', 'space-y-1.5');
        body.appendChild(list);
        const render = function () {
            list.innerHTML = '';
            const words = plain(search.value).split(' ').filter(Boolean);
            const okText = function (t) { const p = plain(t); return words.every(function (w) { return p.indexOf(w) !== -1; }); };
            let mine = myClubs().filter(function (c) { return !sameName(c, name) && okText(c); });
            mine.sort(function (x, y) { return (looksSame(y, name) ? 1 : 0) - (looksSame(x, name) ? 1 : 0); });
            const item = function (title, sub, target) {
                const b = btn('', 'pp-suggest-item input-bg rounded-xl border border-padel-border w-full text-left', function () { openConfirm(name, target, 'picker'); });
                b.appendChild(el('span', 'block truncate font-bold text-padel-navy text-[13px]', title));
                b.appendChild(el('span', 'block text-[11px] text-padel-muted', sub));
                return b;
            };
            if (mine.length) {
                list.appendChild(el('p', 'text-[10px] font-semibold text-padel-muted uppercase tracking-wide pt-1', ppL('Mes clubs', 'Mijn clubs')));
                mine.slice(0, 20).forEach(function (c) { list.appendChild(item(c, usage(c), c)); });
            }
            if (words.length && search.value.trim().length >= 2) {
                const offs = officialList().filter(function (o) {
                    return !sameName(o[0], name) && !myClubs().some(function (m) { return sameName(m, o[0]); }) && okText(o[0] + ' ' + o[1]);
                }).slice(0, 15);
                if (offs.length) {
                    list.appendChild(el('p', 'text-[10px] font-semibold text-padel-muted uppercase tracking-wide pt-1', ppL('Clubs de Belgique', 'Clubs in België')));
                    offs.forEach(function (o) { list.appendChild(item(o[0], o[1], o[0])); });
                }
            } else {
                list.appendChild(el('p', 'text-[11px] text-padel-muted px-1', ppL('Tape quelques lettres pour chercher aussi dans la liste de Belgique.', 'Typ enkele letters om ook in de lijst van België te zoeken.')));
            }
            if (!list.querySelector('button')) list.insertBefore(el('p', 'text-xs text-padel-muted text-center py-3', ppL('Aucun club trouvé', 'Geen club gevonden')), list.firstChild);
        };
        search.addEventListener('input', render);
        render();
    }

    function openConfirm(a, b, from) {
        const ua = matchCount(a) + lessonCount(a), ub = matchCount(b) + lessonCount(b);
        let keep;
        if (isOfficial(b) && !isOfficial(a)) keep = b;
        else if (isOfficial(a) && !isOfficial(b)) keep = a;
        else keep = ub > ua ? b : a;
        state = { a: a, b: b, keep: keep, from: from };
        renderConfirm();
    }

    function renderConfirm() {
        const a = state.a, b = state.b, keep = state.keep;
        const lose = sameName(keep, a) ? b : a;
        const body = show(ppL('Harmoniser un club', 'Club gelijktrekken'), true);
        body.innerHTML = '';
        body.appendChild(el('p', 'text-[12px] font-bold text-padel-muted', ppL('Nom à garder', 'Naam die blijft')));
        const opts = el('div', 'space-y-1.5');
        [a, b].forEach(function (n) {
            const on = sameName(n, keep);
            const o = btn('', 'pp-keep' + (on ? ' is-on' : ''), function () { state.keep = n; renderConfirm(); });
            o.appendChild(el('span', 'pp-radio'));
            const t = el('span', 'min-w-0 flex-1 text-left');
            t.appendChild(el('span', 'block font-extrabold text-[13px] text-padel-navy break-words', n));
            const off = officialOf(n);
            t.appendChild(el('span', 'block text-[11px] text-padel-muted', (matchCount(n) + lessonCount(n) ? usage(n) : ppL('Liste des clubs de Belgique', 'Lijst van clubs in België')) + (off ? ' · ' + off[1] : '')));
            o.appendChild(t);
            opts.appendChild(o);
        });
        body.appendChild(opts);

        const nm = matchCount(lose), nl = lessonCount(lose);
        const box = el('div', 'input-bg rounded-2xl border border-padel-border p-3');
        box.appendChild(el('p', 'text-[12px] font-extrabold text-padel-navy mb-1.5', ppL('Ce qui va changer', 'Wat er verandert')));
        const ul = el('ul', 'space-y-1 text-[12px] text-padel-navy');
        const li = function (txt) { const x = el('li', 'flex gap-2'); x.appendChild(el('span', 'text-padel-court font-bold', '•')); x.appendChild(el('span', '', txt)); ul.appendChild(x); };
        if (nm) li(ppL(ppMatchesWord(nm) + ' passeront de « ' + lose + ' » à « ' + keep + ' ».', ppMatchesWord(nm) + ' gaan van « ' + lose + ' » naar « ' + keep + ' ».'));
        if (nl) li(ppL(nl + (nl === 1 ? ' cours passera' : ' cours passeront') + ' aussi à « ' + keep + ' ».', nl + ' ' + (nl === 1 ? 'les gaat' : 'lessen gaan') + ' ook naar « ' + keep + ' ».'));
        if (!nm && !nl) li(ppL('« ' + lose + ' » n’est utilisé dans aucun match ni cours.', '« ' + lose + ' » wordt in geen enkele match of les gebruikt.'));
        li(ppL('Les statistiques de ces deux noms seront réunies.', 'De statistieken van beide namen worden samengevoegd.'));
        li(ppL('« ' + lose + ' » disparaît de ta liste de clubs.', '« ' + lose + ' » verdwijnt uit je clublijst.'));
        box.appendChild(ul);
        body.appendChild(box);

        const tip = el('div', 'pp-backup-tip');
        tip.appendChild(el('p', 'text-[12px] font-bold', ppL('Conseil : fais une sauvegarde avant de fusionner.', 'Tip: maak een back-up voor je samenvoegt.')));
        tip.appendChild(el('p', 'text-[11px]', ppLastBackupText() + ' ' + ppL('Tu pourras aussi annuler juste après.', 'Je kunt het ook meteen daarna ongedaan maken.')));
        tip.appendChild(btn(ppL('Faire une sauvegarde', 'Back-up maken'), 'pp-dup-btn mt-1.5', function () { closeModal(); openBackupModal(); }));
        body.appendChild(tip);

        const bar = el('div', 'flex gap-2 pt-1');
        bar.appendChild(btn(ppL('Annuler', 'Annuleren'), 'flex-1 input-bg border border-padel-border text-padel-muted font-bold py-3 rounded-xl text-[13px]', function () { openClubs(); }));
        bar.appendChild(btn(ppL('Fusionner', 'Samenvoegen'), 'flex-[2] bg-padel-terracotta text-white font-extrabold py-3 rounded-xl text-[13px]', confirmMerge));
        body.appendChild(bar);
    }

    function confirmMerge() {
        const keep = state.keep;
        const lose = sameName(keep, state.a) ? state.b : state.a;
        if (!keep || !lose) return;
        const data = ppSnapshot();
        closeModal();
        mergeClubs(lose, keep);
        ppUndo = { data: data, restore: null };
        ppShowToast(ppL('Club harmonisé : « ' + keep + ' »', 'Club gelijkgetrokken: « ' + keep + ' »'), true);
    }

    // ----- Ligne « Mes clubs » dans les Réglages -----
    function renderSettingsRow() {
        const group = document.querySelector('#modal-settings .settings-group');
        if (!group) return;
        let row = document.getElementById('pp-settings-clubs');
        if (!row) {
            row = document.createElement('button');
            row.type = 'button';
            row.id = 'pp-settings-clubs';
            row.className = 'settings-row w-full text-left active:opacity-70';
            row.onclick = function () { closeSettingsModal(); openClubs(); };
            row.innerHTML = '<span class="icon-chip chip-court"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span>' +
                '<span class="flex-1 min-w-0"><span class="block text-[14px] font-bold text-padel-navy">' + ppL('Mes clubs', 'Mijn clubs') + '</span>' +
                '<span id="pp-settings-clubs-info" class="block text-[12px] text-padel-muted truncate"></span></span>' +
                '<span class="text-padel-muted shrink-0"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><path d="m9 18 6-6-6-6"/></svg></span>';
            const first = group.firstElementChild;
            group.insertBefore(row, first ? first.nextSibling : null);
        }
        const n = myClubs().length, s = suggestions().length;
        let info = ppL(n + ' club' + (n > 1 ? 's' : ''), n + ' club' + (n > 1 ? 's' : ''));
        if (s) info += ' · ' + ppL(s + ' à harmoniser', s + ' om gelijk te trekken');
        document.getElementById('pp-settings-clubs-info').textContent = info;
    }

    // ----- Bandeau sur l'accueil (seulement quand il y a de nouvelles suggestions) -----
    function seen() { try { const a = JSON.parse(localStorage.getItem(BANNER_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
    function renderBanner() {
        const anchor = document.getElementById('backup-reminder');
        if (!anchor) return;
        let box = document.getElementById('pp-clubs-banner');
        if (!box) {
            box = document.createElement('div');
            box.id = 'pp-clubs-banner';
            box.className = 'items-center gap-2 p-2.5 rounded-2xl border border-padel-border input-bg shadow-sm';
            box.style.marginTop = '8px';
            anchor.parentNode.insertBefore(box, anchor.nextSibling);
        }
        const sug = suggestions();
        const s = seen();
        const fresh = sug.filter(function (x) { return s.indexOf(pairKey(x.a, x.b)) === -1; });
        if (!fresh.length) { box.style.display = 'none'; return; }
        box.innerHTML = '';
        box.style.display = 'flex';
        const t = el('div', 'flex-1 min-w-0');
        t.appendChild(el('p', 'text-[12px] font-bold text-padel-navy', ppL(
            sug.length + (sug.length > 1 ? ' clubs peuvent être harmonisés' : ' club peut être harmonisé'),
            sug.length + (sug.length > 1 ? ' clubs kunnen gelijkgetrokken worden' : ' club kan gelijkgetrokken worden'))));
        t.appendChild(el('p', 'text-[11px] text-padel-muted', ppL('Pour des statistiques par club justes.', 'Voor juiste statistieken per club.')));
        box.appendChild(t);
        box.appendChild(btn(ppL('Voir', 'Bekijken'), 'pp-dup-btn is-main shrink-0', function () { openClubs(); }));
        box.appendChild(btn(ppL('Plus tard', 'Later'), 'pp-dup-btn shrink-0', function () {
            try { localStorage.setItem(BANNER_KEY, JSON.stringify(sug.map(function (x) { return pairKey(x.a, x.b); }))); } catch (e) {}
            renderBanner();
        }));
    }

    const _prevOpenSettings = openSettingsModal;
    openSettingsModal = function () { _prevOpenSettings.apply(this, arguments); renderSettingsRow(); };
    window.openSettingsModal = openSettingsModal;

    const _prevSubmit = submitExpressMatch;
    submitExpressMatch = function () { const r = _prevSubmit.apply(this, arguments); renderBanner(); return r; };
    window.submitExpressMatch = submitExpressMatch;

    window.ppOpenClubs = openClubs;
    window.ppClubsLooksSame = looksSame;
    window.ppClubSuggestions = suggestions;

    renderSettingsRow();
    renderBanner();
})();
