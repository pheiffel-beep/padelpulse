/* PadelPulse v5.0 : bouton « Annuler » après une suppression + fusion des doublons de joueurs
 *
 * 1. Annuler : avant chaque suppression, on garde une copie des données.
 *    Un bandeau « … supprimé · Annuler » s'affiche quelques secondes.
 * 2. Doublons : jamais de fusion automatique.
 *    - à la saisie d'un match, un nom qui ressemble à un joueur existant affiche un avertissement
 *      avec « Utiliser celui-ci » ;
 *    - dans « Bilan joueurs », une carte « Doublons possibles » propose [Fusionner] ou [Ce sont 2 personnes] ;
 *    - depuis la fiche d'un joueur, « Fusionner avec un autre joueur » (pour les surnoms sans rapport).
 */

const ppL = function(fr, nl) { return window.PP_LANG === 'nl' ? nl : fr; };

// ===================== 1. ANNULER =====================
const PP_UNDO_MS = 8000;
let ppUndo = null;      // { data: {clé: valeur}, restore: fonction facultative }
let ppUndoTimer = null;

function ppSnapshot() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('padelpulse_') === 0) data[k] = localStorage.getItem(k);
    }
    return data;
}

function ppCurrentTab() {
    const views = ['view-dashboard', 'view-matches', 'view-lessons', 'view-gear'];
    const tabs = ['tab-dashboard', 'tab-matches', 'tab-lessons', 'tab-gear'];
    for (let i = 0; i < views.length; i++) {
        const v = document.getElementById(views[i]);
        if (v && v.style.display !== 'none') return tabs[i];
    }
    return 'tab-dashboard';
}

function ppBuildToast() {
    let t = document.getElementById('pp-toast');
    if (t) return t;
    t = document.createElement('div');
    t.id = 'pp-toast';
    t.className = 'pp-toast';
    t.setAttribute('role', 'status');
    t.innerHTML = '<span id="pp-toast-text" class="min-w-0"></span>' +
        '<button type="button" id="pp-toast-undo" class="pp-toast-btn" onclick="ppDoUndo()"></button>';
    document.body.appendChild(t);
    return t;
}

function ppShowToast(text, withUndo) {
    const t = ppBuildToast();
    document.getElementById('pp-toast-text').textContent = text;
    const b = document.getElementById('pp-toast-undo');
    b.textContent = ppL('Annuler', 'Ongedaan maken');
    b.style.display = withUndo ? 'inline-flex' : 'none';
    t.classList.add('is-on');
    clearTimeout(ppUndoTimer);
    ppUndoTimer = setTimeout(ppHideToast, withUndo ? PP_UNDO_MS : 2600);
}

function ppHideToast() {
    const t = document.getElementById('pp-toast');
    if (t) t.classList.remove('is-on');
    ppUndo = null;
}

// Les données d'avant sont remises, puis l'appli redémarre au même endroit
function ppDoUndo() {
    if (!ppUndo) return;
    const u = ppUndo;
    ppUndo = null;
    clearTimeout(ppUndoTimer);
    if (u.restore) {
        u.restore();
        ppShowToast(ppL('C’est annulé', 'Ongedaan gemaakt'), false);
        return;
    }
    try {
        const now = ppSnapshot();
        Object.keys(now).forEach(function(k) { if (!(k in u.data)) localStorage.removeItem(k); });
        Object.keys(u.data).forEach(function(k) { localStorage.setItem(k, u.data[k]); });
        sessionStorage.setItem('pp_undo_return', JSON.stringify({
            tab: ppCurrentTab(),
            y: window.scrollY || 0,
            m: (document.getElementById('main-content') || {}).scrollTop || 0
        }));
    } catch (e) { return; }
    location.reload();
}

// Après le redémarrage : même onglet, même position, petit message
window.addEventListener('load', function() {
    let r = null;
    try { r = JSON.parse(sessionStorage.getItem('pp_undo_return')); sessionStorage.removeItem('pp_undo_return'); } catch (e) {}
    if (!r) return;
    setTimeout(function() {
        if (r.tab && r.tab !== 'tab-dashboard' && typeof switchTab === 'function') switchTab(r.tab);
        setTimeout(function() {
            window.scrollTo(0, r.y || 0);
            const mc = document.getElementById('main-content');
            if (mc) mc.scrollTop = r.m || 0;
        }, 30);
        ppShowToast(ppL('C’est annulé', 'Ongedaan gemaakt'), false);
    }, 60);
});

// Branche « Annuler » sur une fonction de suppression existante
function ppWithUndo(fnName, message, makeRestore) {
    const orig = window[fnName];
    if (typeof orig !== 'function') return orig;
    const wrapped = function() {
        const data = ppSnapshot();
        const restore = makeRestore ? makeRestore.apply(null, arguments) : null;
        const res = orig.apply(this, arguments);
        // Rien n'a changé (ex. aucun élément choisi) : pas de bandeau
        const after = ppSnapshot();
        const changed = Object.keys(data).length !== Object.keys(after).length ||
            Object.keys(after).some(function(k) { return data[k] !== after[k]; });
        if (changed) {
            ppUndo = { data: data, restore: restore };
            ppShowToast(typeof message === 'function' ? message() : message, true);
        }
        return res;
    };
    window[fnName] = wrapped;
    return wrapped;
}

// Pour les retraits faits dans un formulaire ouvert : on remet la liste sans redémarrer
function ppListRestore(selectId, render) {
    return function() {
        const sel = document.getElementById(selectId);
        const value = sel ? sel.value : '';
        const copy = JSON.parse(JSON.stringify(padelLists));
        return function() {
            Object.keys(padelLists).forEach(function(k) { delete padelLists[k]; });
            Object.assign(padelLists, copy);
            saveLists();
            render(value);
        };
    };
}

deleteMatch = ppWithUndo('deleteMatch', function() { return ppL('Match supprimé', 'Match verwijderd'); });
deleteLesson = ppWithUndo('deleteLesson', function() { return ppL('Cours supprimé', 'Les verwijderd'); });
deleteRacket = ppWithUndo('deleteRacket', function() { return ppL('Raquette supprimée', 'Racket verwijderd'); });
deleteSurgrip = ppWithUndo('deleteSurgrip', function() { return ppL('Surgrip supprimé', 'Overgrip verwijderd'); });
deleteShoes = ppWithUndo('deleteShoes', function() { return ppL('Chaussures supprimées', 'Schoenen verwijderd'); });
removePlayerFromLists = ppWithUndo('removePlayerFromLists', function() { return ppL('Joueur retiré de la liste', 'Speler uit de lijst gehaald'); });
confirmResetData = ppWithUndo('confirmResetData', function() { return ppL('Toutes les données ont été effacées', 'Alle gegevens zijn gewist'); });
removeSelectedClub = ppWithUndo('removeSelectedClub', function() { return ppL('Club retiré de la liste', 'Club uit de lijst gehaald'); },
    ppListRestore('match-location-select', function(v) { renderLocationSelect(v); }));
removeSelectedLessonClub = ppWithUndo('removeSelectedLessonClub', function() { return ppL('Lieu retiré de la liste', 'Locatie uit de lijst gehaald'); },
    ppListRestore('lesson-location-select', function(v) { renderLessonLocationSelect(v); }));
removeSelectedCoach = ppWithUndo('removeSelectedCoach', function() { return ppL('Coach retiré de la liste', 'Coach uit de lijst gehaald'); },
    ppListRestore('lesson-coach-select', function(v) { if (typeof renderCoachSelect === 'function') renderCoachSelect(v); }));
removeSelectedPartner = ppWithUndo('removeSelectedPartner', function() { return ppL('Coéquipier retiré de la liste', 'Partner uit de lijst gehaald'); },
    ppListRestore('match-partner', function(v) {
        updatePartnerDropdownOptions();
        const sel = document.getElementById('match-partner');
        if (sel && v) { sel.value = v; handlePartnerSelectChange(v); }
    }));

// ===================== 2. DOUBLONS DE JOUEURS =====================
const PP_NOTDUP_KEY = 'padelpulse_not_duplicates';

function ppDNorm(s) {
    return normName(s).replace(/[.\-_'’]/g, ' ').replace(/\s+/g, ' ').trim();
}
function ppPairKey(a, b) { return [ppDNorm(a), ppDNorm(b)].sort().join('|'); }
function ppNotDupList() {
    try { const a = JSON.parse(localStorage.getItem(PP_NOTDUP_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
function ppSaveNotDup(list) { try { localStorage.setItem(PP_NOTDUP_KEY, JSON.stringify(list)); } catch (e) {} }

function ppLev(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 2) return 3;
    let prev = [];
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
        const cur = [i];
        for (let j = 1; j <= b.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[b.length];
}

// Deux noms se ressemblent-ils ? (faute de frappe, initiale, prénom seul, surnom qui commence pareil)
function ppLooksSame(a, b) {
    const A = ppDNorm(a), B = ppDNorm(b);
    if (!A || !B) return false;
    if (A === B) return true;
    const L = Math.min(A.length, B.length);
    const d = ppLev(A, B);
    if ((L >= 4 && d <= 1) || (L >= 8 && d <= 2)) return true;
    let ta = A.split(' '), tb = B.split(' ');
    if (ta.length === tb.length && ta.length > 1 && ta.slice().sort().join(' ') === tb.slice().sort().join(' ')) return true;
    if (ta.length > tb.length) { const x = ta; ta = tb; tb = x; }
    // « Philippe P » / « Philippe » ↔ « Philippe Parys »
    let full = false;
    const tokensOk = ta.every(function(t, i) {
        const u = tb[i];
        if (t === u) { if (t.length >= 3) full = true; return true; }
        if (t.length === 1 && u.charAt(0) === t) return true;
        if (u.length === 1 && t.charAt(0) === u) return true;
        return false;
    });
    if (tokensOk && full) return true;
    // « Phil » ↔ « Philippe (Parys) »
    if (ta.length === 1 && ta[0].length >= 3 && tb[0] !== ta[0] && tb[0].indexOf(ta[0]) === 0) return true;
    return false;
}

function ppMatchCount(name) {
    return matches.filter(function(m) {
        return sameName(m.partner, name) || ppOppNames(m).some(function(o) { return sameName(o, name); });
    }).length;
}
function ppMatchesWord(n) {
    return n + ' ' + (window.PP_LANG === 'nl' ? (n === 1 ? 'match' : 'matchen') : 'match' + (n > 1 ? 's' : ''));
}

// Paires à proposer dans « Bilan joueurs »
function ppDuplicatePairs() {
    const players = ppAllPlayers();
    const refused = ppNotDupList();
    const pairs = [];
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            const a = players[i], b = players[j];
            if (refused.indexOf(ppPairKey(a.name, b.name)) !== -1) continue;
            if (ppLooksSame(a.name, b.name)) pairs.push({ a: a.name, b: b.name, score: a.count + b.count });
        }
    }
    return pairs.sort(function(x, y) { return y.score - x.score; });
}

function ppNameArg(name) { return "decodeURIComponent('" + encodeURIComponent(name).replace(/'/g, '%27') + "')"; }

function ppRenderDupCard() {
    const list = document.getElementById('partners-list');
    if (!list) return;
    let card = document.getElementById('pp-dup-card');
    if (!card) {
        card = document.createElement('div');
        card.id = 'pp-dup-card';
        list.parentNode.insertBefore(card, list);
    }
    const pairs = ppDuplicatePairs();
    if (!pairs.length) { card.style.display = 'none'; card.innerHTML = ''; return; }
    const shown = pairs.slice(0, 4);
    card.className = 'pp-dup-card';
    card.style.display = 'block';
    card.innerHTML =
        '<div class="flex items-center gap-1.5 text-[12px] font-extrabold text-padel-navy"><span class="pp-flag">' + PP_WARN_SVG + '</span><span>' +
            ppL('Doublons possibles', 'Mogelijke dubbels') + ' (' + pairs.length + ')</span></div>' +
        '<p class="text-[11px] text-padel-muted">' + ppL('Ces noms se ressemblent. Rien ne change sans ton accord.', 'Deze namen lijken op elkaar. Er verandert niets zonder jouw akkoord.') + '</p>' +
        shown.map(function(p) {
            return '<div class="pp-dup-row">' +
                '<div class="text-[12px] text-padel-navy font-bold leading-snug break-words">' + ppEsc(p.a) + ' <span class="text-padel-muted font-medium">(' + ppMatchCount(p.a) + ')</span>' +
                    ' <span class="text-padel-muted">⇄</span> ' + ppEsc(p.b) + ' <span class="text-padel-muted font-medium">(' + ppMatchCount(p.b) + ')</span></div>' +
                '<div class="flex gap-1.5 mt-1.5">' +
                    '<button type="button" class="pp-dup-btn is-main" onclick="ppOpenMergeConfirm(' + ppNameArg(p.a) + ',' + ppNameArg(p.b) + ')">' + ppL('Fusionner', 'Samenvoegen') + '</button>' +
                    '<button type="button" class="pp-dup-btn" onclick="ppNotDuplicate(' + ppNameArg(p.a) + ',' + ppNameArg(p.b) + ')">' + ppL('Ce sont 2 personnes', 'Het zijn 2 personen') + '</button>' +
                '</div></div>';
        }).join('') +
        (pairs.length > shown.length ? '<p class="text-[11px] text-padel-muted text-center">' +
            ppL('Encore ' + (pairs.length - shown.length) + ' après celles-ci', 'Nog ' + (pairs.length - shown.length) + ' na deze') + '</p>' : '');
}

function ppNotDuplicate(a, b) {
    const list = ppNotDupList();
    const k = ppPairKey(a, b);
    if (list.indexOf(k) === -1) list.push(k);
    ppSaveNotDup(list);
    ppRenderDupCard();
}

const _prevRenderPlayersStatsDup = renderPlayersStats;
renderPlayersStats = function() {
    _prevRenderPlayersStatsDup.apply(this, arguments);
    ppRenderDupCard();
};
window.renderPlayersStats = renderPlayersStats;

// ----- Avertissement pendant la saisie d'un match -----
function ppSimilarTo(value) {
    const v = (value || '').trim();
    if (v.length < 2 || PP_GENERIC.indexOf(v.toLowerCase()) !== -1) return [];
    const all = ppAllPlayers();
    if (all.some(function(p) { return sameName(p.name, v); })) return [];
    return all.filter(function(p) { return ppLooksSame(p.name, v); }).slice(0, 2);
}

function ppUpdateDupWarn(slot) {
    const el = document.getElementById('pp-dup-' + slot);
    const input = document.getElementById(PP_SLOTS[slot].input);
    if (!el || !input) return;
    const found = ppSimilarTo(input.value);
    if (!found.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
    el.innerHTML = found.map(function(p) {
        return '<span class="flex items-center gap-1.5 flex-wrap">' + PP_WARN_SVG +
            '<span>' + ppL('Ressemble à', 'Lijkt op') + ' « ' + ppEsc(p.name) + ' »' + (p.count ? ' · ' + ppMatchesWord(p.count) : '') + '</span>' +
            '<button type="button" class="pp-dup-use" data-name="' + ppEsc(p.name) + '">' + ppL('Utiliser celui-ci', 'Deze gebruiken') + '</button></span>';
    }).join('');
    Array.prototype.forEach.call(el.querySelectorAll('.pp-dup-use'), function(b) {
        b.addEventListener('mousedown', function(e) { e.preventDefault(); });
        b.addEventListener('click', function() {
            ppPick(slot, b.getAttribute('data-name'));
            ppUpdateDupWarn(slot);
        });
    });
    el.style.display = 'flex';
}

function ppSetupDupWarnings() {
    Object.keys(PP_SLOTS).forEach(function(slot) {
        const input = document.getElementById(PP_SLOTS[slot].input);
        if (!input || document.getElementById('pp-dup-' + slot)) return;
        const after = document.getElementById('pp-warn-' + slot);
        const p = document.createElement('div');
        p.id = 'pp-dup-' + slot;
        p.className = 'pp-dupwarn' + (slot === 'partner' ? '' : ' col-span-3');
        p.style.display = 'none';
        if (after) after.parentNode.insertBefore(p, after.nextSibling);
        else input.parentNode.parentNode.appendChild(p);
        input.addEventListener('input', function() { p.style.display = 'none'; });
        input.addEventListener('blur', function() { setTimeout(function() { ppUpdateDupWarn(slot); }, 200); });
    });
}

function ppHideDupWarnings() {
    Object.keys(PP_SLOTS).forEach(function(slot) {
        const el = document.getElementById('pp-dup-' + slot);
        if (el) { el.style.display = 'none'; el.innerHTML = ''; }
    });
}

const _prevResetForDup = resetMatchModalForm;
resetMatchModalForm = function() {
    _prevResetForDup.apply(this, arguments);
    ppSetupDupWarnings();
    ppHideDupWarnings();
};
window.resetMatchModalForm = resetMatchModalForm;

const _prevOpenEditForDup = openEditMatchModal;
openEditMatchModal = function(id) {
    _prevOpenEditForDup.apply(this, arguments);
    ppSetupDupWarnings();
    ppHideDupWarnings();
};
window.openEditMatchModal = openEditMatchModal;

// ----- Fusion -----
function ppMergePlayers(from, into) {
    const isFrom = function(n) { return sameName(n, from); };
    matches.forEach(function(m) {
        if (isFrom(m.partner)) m.partner = into;
        if (m.opponents) {
            const parts = ppOppNames(m);
            if (parts.some(isFrom)) m.opponents = parts.map(function(p) { return isFrom(p) ? into : p; }).join(' & ');
        }
    });
    const intoKey = ppFindPlayer(into) || into;
    const target = Object.assign({}, playersDatabase[intoKey] || {});
    Object.keys(playersDatabase).filter(function(k) { return isFrom(k) && k !== intoKey; }).forEach(function(k) {
        const f = playersDatabase[k] || {};
        if (!target.rank && f.rank) { target.rank = f.rank; target.gender = f.gender; }
        if (f.isPartner) target.isPartner = true;
        const fv = f.verify && f.verify.on ? f.verify : null;
        const tv = target.verify && target.verify.on ? target.verify : null;
        if (fv && !tv) target.verify = Object.assign({}, fv);
        else if (fv && tv) {
            const notes = [tv.note, fv.note].map(function(s) { return (s || '').trim(); }).filter(Boolean)
                .filter(function(s, i, arr) { return arr.findIndex(function(x) { return x.toLowerCase() === s.toLowerCase(); }) === i; });
            target.verify = { on: true, level: tv.level || fv.level || '', note: notes.join(' · ') };
        }
        delete playersDatabase[k];
    });
    if (!target.rank) { target.rank = 'P200'; target.gender = 'M'; }
    playersDatabase[intoKey] = target;
    padelLists.hiddenPlayers = padelLists.hiddenPlayers.filter(function(h) { return !isFrom(h); });
    const fk = ppDNorm(from);
    ppSaveNotDup(ppNotDupList().filter(function(k) { return k.split('|').indexOf(fk) === -1; }));
    saveAllData();
    saveLists();
    if (typeof openPlayerName !== 'undefined' && openPlayerName && isFrom(openPlayerName)) openPlayerName = intoKey;
    renderMatches(); updateStats(); updatePartnerDropdownOptions(); renderPlayersStats(); renderWeeklySchedule();
}

// ----- Fenêtre de fusion (choix du joueur, puis confirmation) -----
let ppMerge = { a: null, b: null, keep: null };

function ppBuildMergeModal() {
    if (document.getElementById('pp-merge-modal')) return;
    const div = document.createElement('div');
    div.id = 'pp-merge-modal';
    div.className = 'fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm';
    div.style.display = 'none';
    div.setAttribute('onclick', 'if(event.target===this)ppCloseMerge()');
    div.innerHTML = '<div class="card-bg w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-padel-border p-4 pb-6 space-y-3 shadow-2xl max-h-[88vh] flex flex-col">' +
        '<div class="flex justify-between items-center gap-2 shrink-0">' +
            '<h3 id="pp-merge-title" class="font-extrabold text-sm text-padel-navy min-w-0"></h3>' +
            '<button type="button" onclick="ppCloseMerge()" class="w-9 h-9 shrink-0 rounded-full input-bg text-padel-muted flex items-center justify-center" aria-label="' + ppL('Fermer', 'Sluiten') + '">' + PP_X_SVG + '</button>' +
        '</div>' +
        '<div id="pp-merge-body" class="space-y-3 overflow-y-auto min-h-0"></div>' +
    '</div>';
    document.body.appendChild(div);
}

function ppCloseMerge() {
    const m = document.getElementById('pp-merge-modal');
    if (m) m.style.display = 'none';
}

// Depuis la fiche d'un joueur : choisir l'autre nom
function ppOpenMergePicker(name) {
    if (!name) return;
    ppBuildMergeModal();
    ppMerge = { a: name, b: null, keep: null };
    document.getElementById('pp-merge-title').textContent = ppL('Fusionner « ' + name + ' » avec…', '« ' + name + ' » samenvoegen met…');
    document.getElementById('pp-merge-body').innerHTML =
        '<p class="text-[12px] text-padel-muted">' + ppL('Choisis l’autre nom sous lequel cette personne a été enregistrée.', 'Kies de andere naam waaronder deze persoon werd opgeslagen.') + '</p>' +
        '<input type="text" id="pp-merge-search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="' + ppL('Rechercher un joueur…', 'Speler zoeken…') + '" class="w-full box-border input-bg border border-padel-border rounded-xl p-2.5 text-padel-navy focus:outline-none" style="font-size:16px">' +
        '<div id="pp-merge-list" class="space-y-1.5"></div>';
    const s = document.getElementById('pp-merge-search');
    s.addEventListener('input', ppRenderMergeList);
    ppRenderMergeList();
    document.getElementById('pp-merge-modal').style.display = 'flex';
}

function ppRenderMergeList() {
    const box = document.getElementById('pp-merge-list');
    if (!box) return;
    const q = normName((document.getElementById('pp-merge-search') || {}).value || '');
    const me = ppMerge.a;
    let list = ppAllPlayers().filter(function(p) { return !sameName(p.name, me) && partnerMatchesQuery(p.name, q); });
    list.sort(function(x, y) { return (ppLooksSame(y.name, me) ? 1 : 0) - (ppLooksSame(x.name, me) ? 1 : 0); });
    if (!list.length) { box.innerHTML = '<p class="text-xs text-padel-muted text-center py-4">' + ppL('Aucun joueur trouvé', 'Geen speler gevonden') + '</p>'; return; }
    box.innerHTML = list.slice(0, 40).map(function(p) {
        const info = playersDatabase[p.name] || {};
        return '<button type="button" class="pp-suggest-item input-bg rounded-xl border border-padel-border" onclick="ppOpenMergeConfirm(' + ppNameArg(me) + ',' + ppNameArg(p.name) + ')">' +
            '<span class="truncate font-bold text-padel-navy">' + ppEsc(p.name) + '</span>' +
            '<span class="flex items-center gap-2 shrink-0"><span class="meta-chip is-comp" style="padding:1px 7px">' + (info.rank || 'P200') + '</span>' +
            '<span class="text-[11px] text-padel-muted">' + ppMatchesWord(ppMatchCount(p.name)) + '</span></span></button>';
    }).join('');
}

function ppLastBackupText() {
    const d = parseInt(localStorage.getItem('padelpulse_last_backup_date'), 10);
    if (!d) return ppL('Aucune sauvegarde faite pour l’instant.', 'Nog geen back-up gemaakt.');
    const days = Math.floor((Date.now() - d) / 86400000);
    if (days <= 0) return ppL('Dernière sauvegarde : aujourd’hui.', 'Laatste back-up: vandaag.');
    if (days === 1) return ppL('Dernière sauvegarde : hier.', 'Laatste back-up: gisteren.');
    return ppL('Dernière sauvegarde : il y a ' + days + ' jours.', 'Laatste back-up: ' + days + ' dagen geleden.');
}

function ppOpenMergeConfirm(a, b) {
    ppBuildMergeModal();
    const ca = ppMatchCount(a), cb = ppMatchCount(b);
    ppMerge = { a: a, b: b, keep: cb > ca ? b : a };
    document.getElementById('pp-merge-title').textContent = ppL('Fusionner 2 joueurs', '2 spelers samenvoegen');
    ppRenderMergeConfirm();
    document.getElementById('pp-merge-modal').style.display = 'flex';
}

function ppSetMergeKeep(which) {
    ppMerge.keep = which === 'a' ? ppMerge.a : ppMerge.b;
    ppRenderMergeConfirm();
}

function ppRenderMergeConfirm() {
    const a = ppMerge.a, b = ppMerge.b, keep = ppMerge.keep;
    const lose = sameName(keep, a) ? b : a;
    const nLose = ppMatchCount(lose);
    const both = matches.filter(function(m) {
        const names = [m.partner].concat(ppOppNames(m));
        return names.some(function(n) { return sameName(n, a); }) && names.some(function(n) { return sameName(n, b); });
    }).length;
    const ik = ppInfo(keep) || {}, il = ppInfo(lose) || {};
    const rank = ik.rank || il.rank || 'P200';
    const vk = ppVerify(keep), vl = ppVerify(lose);

    const opt = function(which, name) {
        const on = sameName(name, keep);
        return '<button type="button" onclick="ppSetMergeKeep(\'' + which + '\')" class="pp-keep' + (on ? ' is-on' : '') + '">' +
            '<span class="pp-radio"></span><span class="min-w-0 flex-1 text-left"><span class="block font-extrabold text-[13px] text-padel-navy break-words">' + ppEsc(name) + '</span>' +
            '<span class="block text-[11px] text-padel-muted">' + ((ppInfo(name) || {}).rank || 'P200') + ' · ' + ppMatchesWord(ppMatchCount(name)) + '</span></span></button>';
    };
    const li = function(txt) { return '<li class="flex gap-2"><span class="text-padel-court font-bold">•</span><span>' + txt + '</span></li>'; };

    let changes = '';
    changes += li(nLose
        ? ppL(ppMatchesWord(nLose) + ' de « ' + ppEsc(lose) + ' » passeront sous « ' + ppEsc(keep) + ' ».', ppMatchesWord(nLose) + ' van « ' + ppEsc(lose) + ' » komen onder « ' + ppEsc(keep) + ' ».')
        : ppL('« ' + ppEsc(lose) + ' » n’a aucun match enregistré.', '« ' + ppEsc(lose) + ' » heeft geen opgeslagen matchen.'));
    changes += li(ppL('Niveau gardé : ', 'Behouden niveau: ') + '<b>' + rank + '</b>' +
        (il.rank && il.rank !== rank ? ppL(' (« ' + ppEsc(lose) + ' » était ' + il.rank + ')', ' (« ' + ppEsc(lose) + ' » was ' + il.rank + ')') : ''));
    if (vk && vl) changes += li(ppL('Les deux notes « Niveau à vérifier » sont réunies.', 'Beide notities « Niveau te controleren » worden samengevoegd.'));
    else if (vl) changes += li(ppL('La note « Niveau à vérifier » de « ' + ppEsc(lose) + ' » est gardée.', 'De notitie « Niveau te controleren » van « ' + ppEsc(lose) + ' » blijft behouden.'));
    changes += li(ppL('« ' + ppEsc(lose) + ' » disparaît de la liste des joueurs.', '« ' + ppEsc(lose) + ' » verdwijnt uit de spelerslijst.'));

    document.getElementById('pp-merge-body').innerHTML =
        '<p class="text-[12px] font-bold text-padel-muted">' + ppL('Nom à garder', 'Naam die blijft') + '</p>' +
        '<div class="space-y-1.5">' + opt('a', a) + opt('b', b) + '</div>' +
        '<div class="input-bg rounded-2xl border border-padel-border p-3"><p class="text-[12px] font-extrabold text-padel-navy mb-1.5">' + ppL('Ce qui va changer', 'Wat er verandert') + '</p>' +
            '<ul class="space-y-1 text-[12px] text-padel-navy">' + changes + '</ul></div>' +
        (both ? '<p class="pp-warn" style="display:flex">' + PP_WARN_SVG + '<span>' +
            ppL(ppMatchesWord(both) + ' contien' + (both > 1 ? 'nent' : 't') + ' les deux noms : ce sont peut-être 2 personnes différentes.', ppMatchesWord(both) + ' bevat' + (both > 1 ? 'ten' : '') + ' beide namen: misschien zijn het 2 verschillende personen.') + '</span></p>' : '') +
        '<div class="pp-backup-tip">' +
            '<p class="text-[12px] font-bold">' + ppL('Conseil : fais une sauvegarde avant de fusionner.', 'Tip: maak een back-up voor je samenvoegt.') + '</p>' +
            '<p class="text-[11px]">' + ppLastBackupText() + ' ' + ppL('Tu pourras aussi annuler juste après.', 'Je kunt het ook meteen daarna ongedaan maken.') + '</p>' +
            '<button type="button" onclick="ppCloseMerge();openBackupModal()" class="pp-dup-btn mt-1.5">' + ppL('Faire une sauvegarde', 'Back-up maken') + '</button>' +
        '</div>' +
        '<div class="flex gap-2 pt-1">' +
            '<button type="button" onclick="ppCloseMerge()" class="flex-1 input-bg border border-padel-border text-padel-muted font-bold py-3 rounded-xl text-[13px]">' + ppL('Annuler', 'Annuleren') + '</button>' +
            '<button type="button" onclick="ppConfirmMerge()" class="flex-[2] bg-padel-terracotta text-white font-extrabold py-3 rounded-xl text-[13px]">' + ppL('Fusionner', 'Samenvoegen') + '</button>' +
        '</div>';
}

function ppConfirmMerge() {
    const keep = ppMerge.keep;
    const lose = sameName(keep, ppMerge.a) ? ppMerge.b : ppMerge.a;
    if (!keep || !lose) return;
    const data = ppSnapshot();
    ppCloseMerge();
    const ep = document.getElementById('modal-edit-player');
    if (ep && ep.style.display !== 'none') closeEditPlayerModal();
    ppMergePlayers(lose, keep);
    ppUndo = { data: data, restore: null };
    ppShowToast(ppL('Joueurs fusionnés sous « ' + keep + ' »', 'Spelers samengevoegd onder « ' + keep + ' »'), true);
}

// ----- Boutons « Fusionner avec un autre joueur » (fenêtre Modifier + historique du joueur) -----
const PP_MERGE_SVG = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><path d="m8 6 4-4 4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22"/><path d="m20 22-5-5"/></svg>';

function ppMergeButtonHtml(onclick) {
    return '<button type="button" onclick="' + onclick + '" class="w-full input-bg border border-padel-border text-padel-navy font-bold py-2.5 rounded-xl text-xs mt-2 flex items-center justify-center gap-1.5">' +
        PP_MERGE_SVG + '<span>' + ppL('Fusionner avec un autre joueur', 'Samenvoegen met een andere speler') + '</span></button>';
}

const _prevOpenEditPlayerMerge = openEditPlayerModal;
openEditPlayerModal = function(name) {
    _prevOpenEditPlayerMerge.apply(this, arguments);
    const modal = document.getElementById('modal-edit-player');
    if (!modal || document.getElementById('pp-merge-from-edit')) return;
    const removeBtn = modal.querySelector('button[onclick="removePlayerFromLists()"]');
    if (!removeBtn) return;
    const wrap = document.createElement('div');
    wrap.id = 'pp-merge-from-edit';
    wrap.innerHTML = ppMergeButtonHtml('ppOpenMergePicker(editingPlayerName)');
    removeBtn.parentNode.insertBefore(wrap, removeBtn);
};
window.openEditPlayerModal = openEditPlayerModal;

const _prevRenderPlayerHistoryMerge = renderPlayerHistory;
renderPlayerHistory = function() {
    _prevRenderPlayerHistoryMerge.apply(this, arguments);
    const box = document.getElementById('player-sheet-content');
    if (box && openPlayerName) box.insertAdjacentHTML('beforeend', '<div class="pt-1">' + ppMergeButtonHtml('ppOpenMergePicker(openPlayerName)') + '</div>');
};

window.ppDoUndo = ppDoUndo;
window.ppNotDuplicate = ppNotDuplicate;
window.ppOpenMergePicker = ppOpenMergePicker;
window.ppOpenMergeConfirm = ppOpenMergeConfirm;
window.ppSetMergeKeep = ppSetMergeKeep;
window.ppConfirmMerge = ppConfirmMerge;
window.ppCloseMerge = ppCloseMerge;
