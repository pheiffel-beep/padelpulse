/* PadelPulse v4.9 : saisie rapide des joueurs, formulaire pré-rempli, « Niveau à vérifier »,
   nouveaux tags, cartes « le plus fréquent / le meilleur » */

// ===================== Outils =====================
function ppFindPlayer(name) {
    const n = (name || '').trim();
    if (!n) return null;
    if (playersDatabase[n]) return n;
    return Object.keys(playersDatabase).find(function(k) { return sameName(k, n); }) || null;
}
function ppInfo(name) { const k = ppFindPlayer(name); return k ? playersDatabase[k] : null; }
function ppVerify(name) { const i = ppInfo(name); return i && i.verify && i.verify.on ? i.verify : null; }
const PP_WARN_SVG = '<svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="inline-block shrink-0 pointer-events-none"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/></svg>';
function ppFlag(name) { return ppVerify(name) ? '<span class="pp-flag" title="Niveau à vérifier">' + PP_WARN_SVG + '</span>' : ''; }
function ppEsc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function ppOppNames(m) { return (m.opponents || '').split(/&|,|\set\s/).map(function(s) { return s.trim(); }).filter(Boolean); }
const PP_GENERIC = ['coéquipier', 'adversaires', 'coequipier'];

// Tous les joueurs connus, du plus fréquent au moins fréquent
function ppAllPlayers() {
    const map = {};
    const add = function(n, ts) {
        n = (n || '').trim();
        if (!n || PP_GENERIC.indexOf(n.toLowerCase()) !== -1 || isPlayerHidden(n)) return;
        const key = n.toLowerCase();
        if (!map[key]) map[key] = { name: ppFindPlayer(n) || n, count: 0, last: 0 };
        map[key].count++;
        if (ts > map[key].last) map[key].last = ts;
    };
    matches.forEach(function(m) {
        const ts = m.timestamp || m.id || 0;
        add(m.partner, ts);
        ppOppNames(m).forEach(function(o) { add(o, ts); });
    });
    Object.keys(playersDatabase).forEach(function(n) {
        const key = n.trim().toLowerCase();
        if (!n.trim() || PP_GENERIC.indexOf(key) !== -1 || isPlayerHidden(n) || map[key]) return;
        map[key] = { name: n, count: 0, last: 0 };
    });
    return Object.values(map).sort(function(a, b) {
        return (b.count - a.count) || (b.last - a.last) || a.name.localeCompare(b.name, 'fr');
    });
}

// ===================== 1. Saisie rapide des joueurs =====================
const PP_SLOTS = {
    partner: { input: 'pp-partner-name', rank: 'pp-partner-rank' },
    opp1: { input: 'match-opp1-name', rank: 'match-opp1-rank' },
    opp2: { input: 'match-opp2-name', rank: 'match-opp2-rank' }
};
const PP_X_SVG = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><path d="M18 6 6 18M6 6l12 12"/></svg>';

function ppSlotValue(slot) { const el = document.getElementById(PP_SLOTS[slot].input); return el ? el.value.trim() : ''; }

function ppBuildPicker(slot, input) {
    // Enveloppe : champ + bouton ✕ + liste de suggestions
    const wrap = document.createElement('div');
    wrap.className = 'pp-picker relative min-w-0 col-span-2';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.remove('col-span-2');
    input.style.paddingRight = '34px';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'words');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('name', 'pp_' + slot + '_' + Date.now());
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'pp-clear';
    clear.setAttribute('aria-label', 'Effacer');
    clear.innerHTML = PP_X_SVG;
    wrap.appendChild(clear);
    const list = document.createElement('div');
    list.className = 'pp-suggest';
    list.id = 'pp-suggest-' + slot;
    list.style.display = 'none';
    wrap.appendChild(list);

    input.addEventListener('focus', function() { ppShowSuggestions(slot); });
    input.addEventListener('input', function() { ppAutoRank(slot); ppShowSuggestions(slot); ppUpdateWarn(slot); ppUpdateClear(slot); });
    input.addEventListener('blur', function() { setTimeout(function() { list.style.display = 'none'; }, 180); });
    clear.addEventListener('mousedown', function(e) { e.preventDefault(); });
    clear.addEventListener('click', function() {
        input.value = '';
        ppUpdateWarn(slot); ppUpdateClear(slot);
        input.focus();
        ppShowSuggestions(slot);
    });
}

function ppUpdateClear(slot) {
    const input = document.getElementById(PP_SLOTS[slot].input);
    const btn = input && input.parentNode.querySelector('.pp-clear');
    if (btn) btn.style.display = input.value ? 'flex' : 'none';
}

function ppShowSuggestions(slot) {
    const input = document.getElementById(PP_SLOTS[slot].input);
    const list = document.getElementById('pp-suggest-' + slot);
    if (!input || !list) return;
    const q = normName(input.value);
    const others = Object.keys(PP_SLOTS).filter(function(s) { return s !== slot; }).map(ppSlotValue).filter(Boolean);
    let found = ppAllPlayers().filter(function(p) {
        return !others.some(function(o) { return sameName(o, p.name); }) && partnerMatchesQuery(p.name, q);
    });
    if (q && found.length === 1 && sameName(found[0].name, input.value)) found = [];
    found = found.slice(0, 6);
    if (!found.length) { list.style.display = 'none'; list.innerHTML = ''; return; }
    list.innerHTML = found.map(function(p) {
        const info = playersDatabase[p.name] || {};
        const count = p.count ? '<span class="text-[11px] text-padel-muted shrink-0">' + p.count + ' match' + (p.count > 1 ? 's' : '') + '</span>' : '';
        return '<button type="button" class="pp-suggest-item" data-name="' + ppEsc(p.name) + '">' +
            '<span class="flex items-center gap-1.5 min-w-0"><span class="truncate font-bold text-padel-navy">' + ppEsc(p.name) + '</span>' + ppFlag(p.name) + '</span>' +
            '<span class="flex items-center gap-2 shrink-0"><span class="meta-chip is-comp" style="padding:1px 7px">' + (info.rank || 'P200') + '</span>' + count + '</span>' +
            '</button>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.pp-suggest-item'), function(b) {
        b.addEventListener('mousedown', function(e) { e.preventDefault(); });
        b.addEventListener('click', function() { ppPick(slot, b.getAttribute('data-name')); });
    });
    list.style.display = 'block';
}

function ppPick(slot, name) {
    const input = document.getElementById(PP_SLOTS[slot].input);
    if (!input) return;
    input.value = name;
    ppAutoRank(slot);
    ppUpdateWarn(slot); ppUpdateClear(slot);
    const list = document.getElementById('pp-suggest-' + slot);
    if (list) list.style.display = 'none';
    input.blur();
}

function ppAutoRank(slot) {
    const info = ppInfo(ppSlotValue(slot));
    const rank = document.getElementById(PP_SLOTS[slot].rank);
    if (info && info.rank && rank) rank.value = info.rank;
}

function ppUpdateWarn(slot) {
    const el = document.getElementById('pp-warn-' + slot);
    if (!el) return;
    const v = ppVerify(ppSlotValue(slot));
    if (!v) { el.style.display = 'none'; el.innerHTML = ''; return; }
    el.innerHTML = PP_WARN_SVG + '<span>Niveau à vérifier</span>' +
        (v.level ? '<span>· ' + (PP_NL() ? 'vastgesteld ' : 'constaté ') + v.level + '</span>' : '') +
        (v.note ? '<span class="font-medium">· ' + ppEsc(v.note) + '</span>' : '');
    el.style.display = 'flex';
}

function ppSetSlot(slot, name, rankFallback) {
    const input = document.getElementById(PP_SLOTS[slot].input);
    if (!input) return;
    input.value = name || '';
    const rank = document.getElementById(PP_SLOTS[slot].rank);
    const info = ppInfo(name);
    if (rank) rank.value = (info && info.rank) || rankFallback || 'P200';
    ppUpdateWarn(slot); ppUpdateClear(slot);
}

function ppSetupPlayerInputs() {
    // Coéquipier : nouveau champ comme pour les adversaires, l'ancien menu reste caché (il sert à l'enregistrement)
    const sel = document.getElementById('match-partner');
    if (!sel || document.getElementById('pp-partner-name')) return;
    const block = sel.parentNode;
    ['partner-search', 'btn-remove-partner', 'new-partner-fields'].forEach(function(id) {
        const el = document.getElementById(id); if (el) el.classList.add('pp-hidden');
    });
    sel.classList.add('pp-hidden');
    const newBtn = block.querySelector('button[onclick="toggleNewPartnerInput(true)"]');
    if (newBtn) newBtn.classList.add('pp-hidden');
    const opp1Rank = document.getElementById('match-opp1-rank');
    const row = document.createElement('div');
    row.className = 'grid grid-cols-3 gap-1.5 items-center w-full max-w-full';
    row.innerHTML = '<input type="text" id="pp-partner-name" placeholder="Tape les premières lettres..." class="col-span-2 w-full max-w-full box-border card-bg border border-padel-border rounded-xl p-1.5 text-xs text-padel-navy focus:outline-none focus:border-padel-court">' +
        '<select id="pp-partner-rank" class="w-full max-w-full box-border card-bg border border-padel-border rounded-xl p-1.5 text-[11px] font-semibold text-padel-terracotta focus:outline-none truncate">' + (opp1Rank ? opp1Rank.innerHTML : '') + '</select>';
    sel.parentNode.insertBefore(row, sel);
    const warnP = document.createElement('p');
    warnP.id = 'pp-warn-partner'; warnP.className = 'pp-warn'; warnP.style.display = 'none';
    row.parentNode.insertBefore(warnP, row.nextSibling);
    ppBuildPicker('partner', document.getElementById('pp-partner-name'));

    ['opp1', 'opp2'].forEach(function(slot) {
        const input = document.getElementById(PP_SLOTS[slot].input);
        if (!input) return;
        input.setAttribute('placeholder', slot === 'opp1' ? 'Adversaire 1' : 'Adversaire 2');
        const grid = input.parentNode;
        ppBuildPicker(slot, input);
        const w = document.createElement('p');
        w.id = 'pp-warn-' + slot; w.className = 'pp-warn col-span-3'; w.style.display = 'none';
        grid.appendChild(w);
    });
}

// Formulaire : remise à zéro + pré-remplissage avec le dernier match
function ppLastMatch() {
    if (!matches.length) return null;
    return matches.slice().sort(function(a, b) { return (b.timestamp || b.id || 0) - (a.timestamp || a.id || 0); })[0];
}

const _prevResetForPlayers = resetMatchModalForm;
resetMatchModalForm = function() {
    _prevResetForPlayers();
    ppSetupPlayerInputs();
    ['partner', 'opp1', 'opp2'].forEach(function(s) {
        ppSetSlot(s, '', 'P200');
        const l = document.getElementById('pp-suggest-' + s); if (l) l.style.display = 'none';
    });
    const last = ppLastMatch();
    if (!last) return;
    const racket = document.getElementById('match-racket-select');
    if (racket && last.racketUsed && Array.prototype.some.call(racket.options, function(o) { return o.value === last.racketUsed; })) racket.value = last.racketUsed;
    if (last.location && !inList(padelLists.clubsRemoved, last.location)) renderLocationSelect(last.location);
    const pos = document.getElementById('match-court-position');
    if (pos && last.courtPosition) pos.value = last.courtPosition;
    if (last.partner && PP_GENERIC.indexOf(last.partner.toLowerCase()) === -1 && !isPlayerHidden(last.partner)) ppSetSlot('partner', last.partner);
};
window.resetMatchModalForm = resetMatchModalForm;

const _prevOpenEditForPlayers = openEditMatchModal;
openEditMatchModal = function(id) {
    _prevOpenEditForPlayers(id);
    const m = matches.find(function(x) { return x.id === id; });
    if (!m) return;
    ppSetSlot('partner', m.partner && PP_GENERIC.indexOf(m.partner.toLowerCase()) === -1 ? m.partner : '');
    const opps = ppOppNames(m).filter(function(o) { return PP_GENERIC.indexOf(o.toLowerCase()) === -1; });
    ppSetSlot('opp1', opps[0] || '');
    ppSetSlot('opp2', opps[1] || '');
};
window.openEditMatchModal = openEditMatchModal;

const _prevSubmitForPlayers = submitExpressMatch;
submitExpressMatch = function() {
    // Noms écrits comme ceux déjà connus (majuscules, accents)
    const vals = {};
    Object.keys(PP_SLOTS).forEach(function(slot) {
        const input = document.getElementById(PP_SLOTS[slot].input);
        if (!input) return;
        let v = input.value.trim();
        const known = ppFindPlayer(v) || (v && ppAllPlayers().map(function(p) { return p.name; }).find(function(n) { return sameName(n, v); }));
        if (known) v = known;
        input.value = v;
        const rankEl = document.getElementById(PP_SLOTS[slot].rank);
        vals[slot] = { name: v, rank: rankEl ? rankEl.value : 'P200', keep: v && playersDatabase[v] ? Object.assign({}, playersDatabase[v]) : null };
    });
    // Le coéquipier passe par l'ancien menu caché
    const sel = document.getElementById('match-partner');
    const nf = document.getElementById('new-partner-fields');
    if (nf) nf.style.display = 'none';
    if (sel) {
        const p = vals.partner ? vals.partner.name : '';
        if (p && !Array.prototype.some.call(sel.options, function(o) { return o.value === p; })) sel.add(new Option(p, p));
        sel.value = p;
    }

    _prevSubmitForPlayers();

    // Fiches joueurs : niveau à jour, sans perdre la note « Niveau à vérifier »
    Object.keys(vals).forEach(function(slot) {
        const v = vals[slot];
        if (!v || !v.name) return;
        const cur = playersDatabase[v.name] || {};
        playersDatabase[v.name] = Object.assign({}, v.keep || {}, cur, { rank: v.rank, gender: v.rank.endsWith('D') ? 'F' : 'M' });
        if (v.keep && v.keep.verify) playersDatabase[v.name].verify = v.keep.verify;
        if (slot === 'partner') playersDatabase[v.name].isPartner = true;
    });
    saveAllData();
    renderPlayersStats();
};
window.submitExpressMatch = submitExpressMatch;

// ===================== 2. « Niveau à vérifier » =====================
function ppSetupVerifyUI() {
    const modal = document.getElementById('modal-edit-player');
    if (!modal || document.getElementById('pp-verify-box')) return;
    const saveBtn = modal.querySelector('button[onclick="savePlayerRankEdit()"]');
    const rankSel = document.getElementById('edit-player-rank-select');
    if (!saveBtn) return;
    const box = document.createElement('div');
    box.id = 'pp-verify-box';
    box.className = 'rounded-2xl border border-padel-border input-bg p-3 space-y-2.5';
    box.innerHTML =
        '<label class="flex items-center justify-between gap-3 cursor-pointer">' +
            '<span class="flex items-center gap-1.5 text-[13px] font-bold text-padel-navy"><span class="pp-flag">' + PP_WARN_SVG + '</span><span>Niveau à vérifier</span></span>' +
            '<input type="checkbox" id="pp-verify-on" class="pp-switch">' +
        '</label>' +
        '<div id="pp-verify-fields" class="space-y-2" style="display:none">' +
            '<div><label class="block text-[11px] font-semibold text-padel-muted mb-1">Niveau constaté</label>' +
            '<select id="pp-verify-level" class="w-full card-bg border border-padel-border rounded-xl p-2 text-xs text-padel-navy focus:outline-none"><option value="">—</option>' + (rankSel ? rankSel.innerHTML : '') + '</select></div>' +
            '<div><label class="block text-[11px] font-semibold text-padel-muted mb-1">Note perso (facultatif)</label>' +
            '<input type="text" id="pp-verify-note" maxlength="80" autocomplete="off" placeholder="Ex : joue en dessous de son classement" class="w-full box-border card-bg border border-padel-border rounded-xl p-2 text-xs text-padel-navy focus:outline-none"></div>' +
        '</div>' +
        '<p class="text-[11px] text-padel-muted">Visible uniquement sur ton téléphone.</p>';
    saveBtn.parentNode.insertBefore(box, saveBtn);
    document.getElementById('pp-verify-on').addEventListener('change', function() {
        document.getElementById('pp-verify-fields').style.display = this.checked ? 'block' : 'none';
    });
}

const _prevOpenEditPlayerVerify = openEditPlayerModal;
openEditPlayerModal = function(name) {
    _prevOpenEditPlayerVerify(name);
    ppSetupVerifyUI();
    const v = (playersDatabase[name] && playersDatabase[name].verify) || null;
    const on = !!(v && v.on);
    document.getElementById('pp-verify-on').checked = on;
    document.getElementById('pp-verify-fields').style.display = on ? 'block' : 'none';
    document.getElementById('pp-verify-level').value = (v && v.level) || '';
    document.getElementById('pp-verify-note').value = (v && v.note) || '';
};
window.openEditPlayerModal = openEditPlayerModal;

const _prevSavePlayerVerify = savePlayerRankEdit;
savePlayerRankEdit = function() {
    if (!editingPlayerName) return;
    const nameInput = document.getElementById('edit-player-name-input');
    const newName = ((nameInput && nameInput.value) || '').trim() || editingPlayerName;
    const on = document.getElementById('pp-verify-on') ? document.getElementById('pp-verify-on').checked : false;
    const level = document.getElementById('pp-verify-level') ? document.getElementById('pp-verify-level').value : '';
    const note = document.getElementById('pp-verify-note') ? document.getElementById('pp-verify-note').value.trim() : '';
    _prevSavePlayerVerify();
    if (playersDatabase[newName]) {
        if (on) playersDatabase[newName].verify = { on: true, level: level, note: note };
        else delete playersDatabase[newName].verify;
        saveAllData();
        renderPlayersStats(); renderMatches();
    }
};
window.savePlayerRankEdit = savePlayerRankEdit;

// Bilan joueurs : triangle à côté du nom + filtre « À vérifier »
function ppHasFlagged() { return Object.keys(playersDatabase).some(function(n) { return !!ppVerify(n) && !isPlayerHidden(n); }); }

function ppSetupVerifyFilter() {
    const opp = document.getElementById('filter-btn-opponent');
    if (!opp || document.getElementById('filter-btn-verify')) return;
    const b = document.createElement('button');
    b.id = 'filter-btn-verify';
    b.setAttribute('onclick', "setPlayerFilter('verify')");
    b.innerHTML = '<span class="pp-flag">' + PP_WARN_SVG + '</span><span>À vérifier</span>';
    opp.parentNode.appendChild(b);
    opp.parentNode.classList.add('flex-wrap');
}
const PP_FILTER_ON = 'px-2.5 py-1 rounded-lg text-[12px] font-bold bg-padel-terracotta/15 text-padel-terracotta border border-padel-terracotta/30 transition flex items-center gap-1';
const PP_FILTER_OFF = 'px-2.5 py-1 rounded-lg text-[12px] font-medium input-bg text-padel-muted border border-padel-border transition flex items-center gap-1';

const _prevSetPlayerFilterVerify = setPlayerFilter;
setPlayerFilter = function(type) {
    ppSetupVerifyFilter();
    if (type === 'verify') {
        ['all', 'partner', 'opponent'].forEach(function(t) {
            const btn = document.getElementById('filter-btn-' + t);
            if (btn) btn.className = 'px-2.5 py-1 rounded-lg text-[12px] font-medium input-bg text-padel-muted border border-padel-border transition';
        });
        playerFilterType = 'verify';
        showAllPlayers = false;
        renderPlayersStats();
    } else {
        _prevSetPlayerFilterVerify(type);
    }
    const vb = document.getElementById('filter-btn-verify');
    if (vb) vb.className = type === 'verify' ? PP_FILTER_ON : PP_FILTER_OFF;
};
window.setPlayerFilter = setPlayerFilter;

const _prevRenderPlayersVerify = renderPlayersStats;
renderPlayersStats = function() {
    ppSetupVerifyFilter();
    const vb = document.getElementById('filter-btn-verify');
    if (vb) {
        const show = ppHasFlagged() || playerFilterType === 'verify';
        vb.style.display = show ? '' : 'none';
        if (!vb.className) vb.className = PP_FILTER_OFF;
        if (!show && playerFilterType === 'verify') playerFilterType = 'all';
    }
    if (playerFilterType === 'verify') {
        const realHidden = isPlayerHidden;
        playerFilterType = 'all';
        isPlayerHidden = function(n) { return realHidden(n) || !ppVerify(n); };
        try { _prevRenderPlayersVerify(); } finally { isPlayerHidden = realHidden; playerFilterType = 'verify'; }
    } else {
        _prevRenderPlayersVerify();
    }
    const box = document.getElementById('partners-list');
    if (box) Array.prototype.forEach.call(box.querySelectorAll('span.font-extrabold'), function(s) {
        if (ppVerify(s.textContent) && !s.parentNode.querySelector('.pp-flag')) s.insertAdjacentHTML('afterend', ppFlag(s.textContent));
    });
};
window.renderPlayersStats = renderPlayersStats;

// Cartes de match : triangle à côté des adversaires concernés
const _prevRenderMatchCardVerify = renderMatchCard;
renderMatchCard = function(m) {
    let html = _prevRenderMatchCardVerify(m);
    const opps = ppOppNames(m);
    if (opps.some(ppVerify)) {
        const from = 'vs ' + (m.opponents || '-') + '</p>';
        const to = 'vs ' + opps.map(function(o) { return o + ppFlag(o); }).join(' & ') + '</p>';
        html = html.replace(from, to);
    }
    if (ppVerify(m.partner)) html = html.replace('avec ' + m.partner + '</p>', 'avec ' + m.partner + ppFlag(m.partner) + '</p>');
    return html;
};
window.renderMatchCard = renderMatchCard;

// Historique d'un joueur : rappel du niveau constaté
const _prevRenderPlayerHistVerify = renderPlayerHistory;
renderPlayerHistory = function() {
    _prevRenderPlayerHistVerify();
    const v = ppVerify(openPlayerName);
    const box = document.getElementById('player-sheet-content');
    if (!v || !box) return;
    box.insertAdjacentHTML('afterbegin', '<p class="pp-warn" style="display:flex">' + PP_WARN_SVG + '<span>Niveau à vérifier</span>' +
        (v.level ? '<span>· ' + (PP_NL() ? 'vastgesteld ' : 'constaté ') + v.level + '</span>' : '') +
        (v.note ? '<span class="font-medium">· ' + ppEsc(v.note) + '</span>' : '') + '</p>');
};
window.renderPlayerHistory = renderPlayerHistory;

// ===================== 3. Nouveaux tags =====================
['Adversaires supérieurs', 'Adversaires inférieurs'].forEach(function(t) {
    if (TACTICAL_TAGS_LIST.indexOf(t) === -1) TACTICAL_TAGS_LIST.push(t);
});

// ===================== 4. Cartes « le plus fréquent / le meilleur » =====================
const PP_MIN_BEST = 3;
function ppRank(list, keyFn) {
    const map = {};
    list.forEach(function(m) {
        const k = keyFn(m);
        if (!k) return;
        const id = k.toLowerCase();
        if (!map[id]) map[id] = { name: k, total: 0, wins: 0, last: 0 };
        map[id].total++;
        if (m.result === 'VICTOIRE') map[id].wins++;
        const ts = m.timestamp || m.id || 0;
        if (ts > map[id].last) map[id].last = ts;
    });
    const all = Object.values(map);
    const freq = all.slice().sort(function(a, b) { return (b.total - a.total) || (b.wins - a.wins) || (b.last - a.last); })[0] || null;
    const best = all.filter(function(x) { return x.total >= PP_MIN_BEST; })
        .sort(function(a, b) { return (b.wins / b.total - a.wins / a.total) || (b.total - a.total) || (b.last - a.last); })[0] || null;
    return { freq: freq, best: best };
}

function ppStatCard(label, chip, icon, item, emptyText) {
    const body = item
        ? '<p class="font-extrabold text-[14px] text-padel-navy truncate">' + ppEsc(item.name) + '</p>' +
          '<div class="flex items-center justify-between gap-1 text-[11px] text-padel-muted"><span>' + item.total + ' match' + (item.total > 1 ? 's' : '') + '</span>' +
          '<span class="text-padel-terracotta font-bold">' + Math.round(item.wins / item.total * 100) + '% V</span></div>'
        : '<p class="font-extrabold text-[14px] text-padel-muted">—</p><p class="text-[11px] text-padel-muted">' + emptyText + '</p>';
    return '<div class="input-bg p-2.5 rounded-2xl border border-padel-border space-y-0.5 min-w-0">' +
        '<div class="flex items-center gap-1.5 mb-1"><span class="icon-chip ' + chip + '" style="width:24px;height:24px;border-radius:8px">' + icon + '</span>' +
        '<span class="text-[11px] font-bold text-padel-muted leading-tight">' + label + '</span></div>' + body + '</div>';
}

function ppRenderSummary() {
    const grid = document.getElementById('stats-summary-grid');
    if (!grid) return;
    const list = getFilteredMatches();
    const clubs = ppRank(list, function(m) { return (m.location || '').trim(); });
    const partners = ppRank(list, function(m) {
        const p = (m.partner || '').trim();
        return p && PP_GENERIC.indexOf(p.toLowerCase()) === -1 ? p : '';
    });
    const pin = ppSvg(PP_ICON.pin, 14), trophy = ppSvg(PP_ICON.trophy, 14), hand = ppSvg(PP_ICON.handshake, 14);
    const user = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/></svg>';
    const minTxt = PP_MIN_BEST + ' matchs minimum';
    grid.innerHTML =
        ppStatCard('Club le plus fréquenté', 'chip-court', pin, clubs.freq, 'Aucun club') +
        ppStatCard('Meilleur club', 'chip-court', trophy, clubs.best, minTxt) +
        ppStatCard('Coéquipier le plus fréquent', 'chip-terra', user, partners.freq, 'Aucun') +
        ppStatCard('Meilleur duo', 'chip-terra', hand, partners.best, minTxt);
}

const _prevUpdateStatsSummary = updateStats;
updateStats = function() { _prevUpdateStatsSummary(); ppRenderSummary(); };
window.updateStats = updateStats;
