/* PadelPulse v4.9 : sauvegarde dans un fichier, écrans d'accueil, tags en pastilles */

// ===================== 1. Sauvegarde dans un fichier =====================
function ppBackupFileName() {
    const d = new Date();
    const pad = function(n) { return String(n).padStart(2, '0'); };
    return 'PadelPulse-sauvegarde-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '.json';
}

function ppMarkBackupDone() {
    localStorage.setItem('padelpulse_last_backup_date', String(Date.now()));
    localStorage.setItem('padelpulse_last_backup_count', String(matches.length));
    localStorage.removeItem('padelpulse_backup_snooze_count');
    if (typeof renderBackupReminder === 'function') renderBackupReminder();
}

function ppIsNative() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
function ppHasPlugin(name) { return !!(window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable(name) && window.Capacitor.Plugins && window.Capacitor.Plugins[name]); }

async function shareBackupFile() {
    saveAllData();
    const text = buildBackupText();
    const name = ppBackupFileName();
    const okMsg = 'Sauvegarde prête : choisis où l\'envoyer (WhatsApp, mail, Drive…).';
    try {
        // Application installée (Play Store) avec les modules de partage
        if (ppIsNative() && ppHasPlugin('Filesystem') && ppHasPlugin('Share')) {
            const res = await window.Capacitor.Plugins.Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
            await window.Capacitor.Plugins.Share.share({ title: 'Sauvegarde PadelPulse', files: [res.uri] });
            ppMarkBackupDone(); backupStatus(okMsg, true); return;
        }
        // Navigateur (iPhone, Chrome…) : partage d'un vrai fichier
        if (!ppIsNative() && window.File && navigator.canShare) {
            const file = new File([text], name, { type: 'application/json' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'Sauvegarde PadelPulse' });
                ppMarkBackupDone(); backupStatus(okMsg, true); return;
            }
        }
    } catch (e) {
        if (e && (e.name === 'AbortError' || /cancel/i.test(String(e.message || e)))) { backupStatus('', true); return; }
    }
    if (!ppIsNative()) {
        // Ordinateur : téléchargement du fichier
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click();
        setTimeout(function() { URL.revokeObjectURL(url); a.remove(); }, 1000);
        ppMarkBackupDone(); backupStatus('Fichier enregistré dans tes téléchargements : ' + name, true); return;
    }
    // Application sans module de partage : on ouvre un mail prêt à envoyer
    ppMarkBackupDone();
    backupStatus('Un mail avec ta sauvegarde va s\'ouvrir : envoie-le à toi-même.', true);
    window.location.href = 'mailto:?subject=' + encodeURIComponent('Sauvegarde PadelPulse ' + name.slice(22, 32)) + '&body=' + encodeURIComponent(text);
}

function loadBackupFile(input) {
    const file = input && input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
        document.getElementById('backup-text').value = String(reader.result || '').trim();
        input.value = '';
        resetRestoreButton();
        restoreBackup(); // vérifie le fichier puis demande la confirmation
    };
    reader.onerror = function() { backupStatus('Impossible de lire ce fichier.', false); };
    reader.readAsText(file);
}

window.shareBackupFile = shareBackupFile;
window.loadBackupFile = loadBackupFile;

// ===================== 2. Écrans d'accueil (premier lancement) =====================
const PP_ONB_KEY = 'padelpulse_onboarded';
let ppOnbStep = 0;

const PP_ONB_ICONS = [
    '<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="10" cy="9" rx="6" ry="7"/><path d="M14 14l6 6"/><circle cx="19" cy="5" r="2"/></svg>',
    '<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    '<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
];
const PP_ONB_TEXT = [
    { t: 'Bienvenue sur PadelPulse', p: 'Ton carnet de padel : tes matchs, tes partenaires, tes cours et ton matériel, au même endroit.' },
    { t: 'Un match en 30 secondes', p: 'Touche « + Match », choisis tes joueurs en tapant 2 lettres et entre le score. Tes statistiques se calculent toutes seules.' },
    { t: 'Tes données restent chez toi', p: 'Tout est enregistré sur ton téléphone. Pense à faire une sauvegarde de temps en temps : ⚙️ Réglages → Sauvegarde.' }
];

function ppBuildOnboarding() {
    if (document.getElementById('pp-onboarding')) return;
    const div = document.createElement('div');
    div.id = 'pp-onboarding';
    div.className = 'fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm';
    div.style.display = 'none';
    div.innerHTML =
        '<div class="card-bg w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-padel-border p-5 pb-7 space-y-4 shadow-2xl text-center">' +
            '<div id="pp-onb-lang" class="flex justify-center"><div class="seg-group">' +
                '<button type="button" id="pp-onb-fr" onclick="setAppLanguage(\'fr\')" class="seg-btn">Français</button>' +
                '<button type="button" id="pp-onb-nl" onclick="setAppLanguage(\'nl\')" class="seg-btn">Nederlands</button>' +
            '</div></div>' +
            '<div id="pp-onb-icon" class="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center hero-court"></div>' +
            '<h2 id="pp-onb-title" class="text-[20px] font-extrabold text-padel-navy"></h2>' +
            '<p id="pp-onb-text" class="text-[14px] text-padel-muted leading-relaxed px-2"></p>' +
            '<div id="pp-onb-dots" class="flex justify-center gap-1.5"></div>' +
            '<div class="flex items-center gap-2 pt-1">' +
                '<button type="button" onclick="ppCloseOnboarding(false)" id="pp-onb-skip" class="flex-1 input-bg border border-padel-border text-padel-muted font-bold py-3 rounded-xl text-[13px]">Passer</button>' +
                '<button type="button" onclick="ppNextOnboarding()" id="pp-onb-next" class="flex-[2] bg-padel-terracotta text-white font-extrabold py-3 rounded-xl text-[13px]">Suivant</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(div);
}

function ppRenderOnboarding() {
    const s = PP_ONB_TEXT[ppOnbStep];
    document.getElementById('pp-onb-icon').innerHTML = PP_ONB_ICONS[ppOnbStep];
    document.getElementById('pp-onb-title').textContent = s.t;
    document.getElementById('pp-onb-text').textContent = s.p;
    document.getElementById('pp-onb-lang').style.display = ppOnbStep === 0 ? 'flex' : 'none';
    document.getElementById('pp-onb-fr').className = 'seg-btn' + (PP_NL() ? '' : ' is-active');
    document.getElementById('pp-onb-nl').className = 'seg-btn' + (PP_NL() ? ' is-active' : '');
    document.getElementById('pp-onb-dots').innerHTML = PP_ONB_TEXT.map(function(x, i) {
        return '<span style="width:' + (i === ppOnbStep ? 18 : 7) + 'px;height:7px;border-radius:4px;background:' + (i === ppOnbStep ? '#C4552F' : '#C5D3E3') + ';transition:width .2s"></span>';
    }).join('');
    const last = ppOnbStep === PP_ONB_TEXT.length - 1;
    document.getElementById('pp-onb-next').textContent = last ? 'Ajouter mon premier match' : 'Suivant';
    document.getElementById('pp-onb-skip').textContent = last ? 'Plus tard' : 'Passer';
}

function ppNextOnboarding() {
    if (ppOnbStep < PP_ONB_TEXT.length - 1) { ppOnbStep++; ppRenderOnboarding(); }
    else ppCloseOnboarding(true);
}

function ppCloseOnboarding(openMatch) {
    localStorage.setItem(PP_ONB_KEY, '1');
    const el = document.getElementById('pp-onboarding');
    if (el) el.style.display = 'none';
    if (openMatch) openMatchModal();
}

function ppShowOnboarding() {
    ppBuildOnboarding();
    ppOnbStep = 0;
    ppRenderOnboarding();
    document.getElementById('pp-onboarding').style.display = 'flex';
}

window.ppNextOnboarding = ppNextOnboarding;
window.ppCloseOnboarding = ppCloseOnboarding;
window.ppShowOnboarding = ppShowOnboarding;

window.addEventListener('load', function() {
    if (localStorage.getItem(PP_ONB_KEY)) return;
    // Les utilisateurs qui ont déjà des matchs ne voient pas la présentation
    if (matches.length || lessons.length) { localStorage.setItem(PP_ONB_KEY, '1'); return; }
    setTimeout(ppShowOnboarding, 300);
});

// La présentation reste accessible depuis les réglages
(function() {
    const ver = Array.prototype.find.call(document.querySelectorAll('#modal-settings p'), function(p) { return /PadelPulse v/.test(p.textContent); });
    if (!ver) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'w-full text-center text-[12px] font-bold text-padel-court py-1';
    b.textContent = 'Revoir la présentation';
    b.onclick = function() { closeSettingsModal(); ppShowOnboarding(); };
    ver.parentNode.insertBefore(b, ver);
})();

// La réinitialisation remontre la présentation
const _prevResetOnboarding = confirmResetData;
confirmResetData = function() { _prevResetOnboarding(); localStorage.removeItem(PP_ONB_KEY); };
window.confirmResetData = confirmResetData;

// ===================== 3. Tags tactiques en pastilles =====================
renderTagDropdownOptions = function(selectedTags) {
    selectedTags = selectedTags || [];
    const menu = document.getElementById('tag-dropdown-menu');
    if (!menu) return;
    menu.className = 'pp-chips';
    menu.removeAttribute('style');
    const toggle = document.getElementById('tag-dropdown-toggle');
    if (toggle) toggle.classList.add('pp-hidden');
    menu.innerHTML = TACTICAL_TAGS_LIST.map(function(tag) {
        const on = selectedTags.indexOf(tag) !== -1;
        return '<label class="pp-chip' + (on ? ' is-on' : '') + '"><input type="checkbox" value="' + ppEsc(tag) + '"' + (on ? ' checked' : '') +
            ' onchange="this.parentNode.classList.toggle(\'is-on\', this.checked); updateTagSelection()"><span>' + ppEsc(tag) + '</span></label>';
    }).join('');
    updateTagDropdownLabel();
};
toggleTagDropdown = function() {};
window.renderTagDropdownOptions = renderTagDropdownOptions;
window.toggleTagDropdown = toggleTagDropdown;

// ===================== 4. Bilan joueurs : « Tous » montre les deux rôles =====================
function ppPlayerBilan() {
    const map = {};
    const get = function(n) {
        const k = n.toLowerCase();
        if (!map[k]) map[k] = { name: ppFindPlayer(n) || n, p: { t: 0, w: 0, d: 0 }, o: { t: 0, w: 0, d: 0 } };
        return map[k];
    };
    const count = function(rec, m) {
        rec.t++;
        if (m.result === 'VICTOIRE') rec.w++;
        else if (m.result === 'MATCH NUL') rec.d++;
    };
    matches.forEach(function(m) {
        const p = (m.partner || '').trim();
        if (p && PP_GENERIC.indexOf(p.toLowerCase()) === -1) count(get(p).p, m);
        ppOppNames(m).forEach(function(o) { if (PP_GENERIC.indexOf(o.toLowerCase()) === -1) count(get(o).o, m); });
    });
    return Object.values(map);
}

function ppBilanLine(icon, label, rec, isOpp) {
    if (!rec.t) return '';
    const rate = Math.round(rec.w / rec.t * 100);
    let badge = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30';
    if (rate < 50) badge = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    else if (rate === 50) badge = 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    const l = rec.t - rec.w - rec.d;
    const detail = rec.t + (isOpp ? ' affrontement' : ' match') + (rec.t > 1 ? 's' : '') + ' (' + rec.w + 'V - ' + (rec.d ? rec.d + 'N - ' : '') + l + 'D)';
    return '<div class="flex items-center justify-between gap-2 mt-1">' +
        '<span class="flex items-start gap-1 text-[12px] text-padel-muted min-w-0 leading-snug"><span class="shrink-0 pt-px">' + icon + '</span><span><span class="font-bold">' + label + '</span> <span>' + detail + '</span></span></span>' +
        '<span class="text-[11px] font-bold ' + badge + ' px-2 py-0.5 rounded-full border shrink-0">' + rate + '% V</span></div>';
}

function ppRenderAllPlayers() {
    const container = document.getElementById('partners-list');
    if (!container) return;
    const searchVal = (document.getElementById('player-search-input') ? document.getElementById('player-search-input').value : '').toLowerCase().trim();
    let list = ppPlayerBilan().filter(function(it) { return !isPlayerHidden(it.name); });
    if (playerFilterType === 'verify') list = list.filter(function(it) { return !!ppVerify(it.name); });
    if (searchVal) list = list.filter(function(it) {
        const info = ppInfo(it.name) || {};
        return it.name.toLowerCase().indexOf(searchVal) !== -1 || (info.rank || '').toLowerCase().indexOf(searchVal) !== -1;
    });
    list.sort(function(a, b) { return (b.p.t + b.o.t) - (a.p.t + a.o.t) || a.name.localeCompare(b.name, 'fr'); });
    if (!list.length) { container.innerHTML = '<p class="text-[11px] text-padel-muted text-center py-3">Aucun joueur enregistré</p>'; return; }
    const shown = showAllPlayers ? list : list.slice(0, 3);
    const hand = ppSvg(PP_ICON.handshake, 12), target = ppSvg(PP_ICON.target, 12);
    let html = shown.map(function(it) {
        const info = ppInfo(it.name) || { rank: 'P200', gender: 'M' };
        const rank = info.rank || 'P200';
        const dames = rank.endsWith('D') || info.gender === 'F';
        const rankCls = dames ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-500/30' : 'input-bg text-padel-terracotta border-padel-terracotta/30';
        const enc = encodeURIComponent(it.name).replace(/'/g, '%27');
        const initials = it.name.split(' ').map(function(n) { return n[0] || ''; }).join('').substring(0, 2).toUpperCase();
        return '<div onclick="openPlayerHistory(decodeURIComponent(\'' + enc + '\'))" class="input-bg p-2.5 rounded-xl border border-padel-border cursor-pointer active:scale-[0.99] transition">' +
            '<div class="flex items-start gap-2.5 min-w-0">' +
                '<div class="w-8 h-8 rounded-full card-bg border border-padel-border flex items-center justify-center font-bold text-xs text-padel-terracotta shrink-0">' + ppEsc(initials) + '</div>' +
                '<div class="min-w-0 flex-1">' +
                    '<div class="flex items-center gap-1.5 flex-wrap"><span class="font-extrabold text-xs text-padel-navy truncate">' + ppEsc(it.name) + '</span>' + ppFlag(it.name) +
                    '<button onclick="event.stopPropagation();openEditPlayerModal(decodeURIComponent(\'' + enc + '\'))" title="Modifier" class="text-[11px] ' + rankCls + ' px-1.5 py-0.2 rounded font-bold border transition">' + rank + ' ' + ppSvg(PP_ICON.pencil, 11) + '</button></div>' +
                    ppBilanLine(hand, 'Ensemble', it.p, false) +
                    ppBilanLine(target, 'Contre', it.o, true) +
                '</div>' +
            '</div></div>';
    }).join('');
    if (list.length > 3) {
        html += '<button onclick="toggleAllPlayers()" class="w-full py-1.5 card-bg hover:opacity-80 border border-padel-border rounded-xl text-[12px] text-padel-terracotta font-semibold transition flex items-center justify-center gap-1 mt-1">' +
            '<span>' + (showAllPlayers ? 'Réduire' : 'Voir plus (' + (list.length - 3) + ' de plus)') + '</span></button>';
    }
    container.innerHTML = html;
}

const _prevRenderPlayersAll = renderPlayersStats;
renderPlayersStats = function() {
    if (playerFilterType === 'all' || playerFilterType === 'verify') {
        ppSetupVerifyFilter();
        const vb = document.getElementById('filter-btn-verify');
        if (vb) {
            const show = ppHasFlagged() || playerFilterType === 'verify';
            vb.style.display = show ? '' : 'none';
            if (!vb.className) vb.className = PP_FILTER_OFF;
        }
        ppRenderAllPlayers();
    } else {
        _prevRenderPlayersAll();
    }
};
window.renderPlayersStats = renderPlayersStats;
