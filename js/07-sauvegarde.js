/* PadelPulse : Sauvegarde et restauration (bouton disquette) */
// ===== SAUVEGARDE =====
let restorePending = false;

function backupKeys(source) {
    return source.filter(function(k) { return k && k.indexOf('padelpulse_') === 0 && k !== STORAGE_VERSION_KEY; });
}

function buildBackupText() {
    const all = [];
    for (let i = 0; i < localStorage.length; i++) all.push(localStorage.key(i));
    const data = {};
    backupKeys(all).forEach(function(k) { data[k] = localStorage.getItem(k); });
    return JSON.stringify({ app: 'PadelPulse', format: 1, date: new Date().toISOString(), data: data });
}

function backupStatus(msg, ok) {
    const el = document.getElementById('backup-status');
    if (el) { el.innerText = msg; el.style.color = ok ? '#059669' : '#E11D48'; }
}

function resetRestoreButton() {
    restorePending = false;
    const b = document.getElementById('btn-restore');
    if (b) b.innerText = 'Restaurer cette sauvegarde';
}

function openBackupModal() {
    document.getElementById('backup-text').value = '';
    backupStatus('', true);
    resetRestoreButton();
    document.getElementById('modal-backup').style.display = 'flex';
}

function closeBackupModal() { document.getElementById('modal-backup').style.display = 'none'; }

function copyBackup() {
    saveAllData();
    const text = buildBackupText();
    const box = document.getElementById('backup-text');
    box.value = text;
    const okMsg = 'Sauvegarde copiée. Colle-la dans une note, un mail ou un message à toi-même.';
    const manual = 'Copie manuelle : appuie longuement dans la zone, choisis « Tout sélectionner » puis « Copier ».';
    const fallback = function() {
        box.focus(); box.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) {}
        backupStatus(ok ? okMsg : manual, ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() { backupStatus(okMsg, true); }).catch(fallback);
    } else {
        fallback();
    }
}

function restoreBackup() {
    const raw = (document.getElementById('backup-text').value || '').trim();
    if (!raw) { backupStatus('Colle d\'abord ta sauvegarde dans la zone ci-dessus.', false); return; }

    let obj;
    try { obj = JSON.parse(raw); } catch (e) { backupStatus('Texte invalide : la sauvegarde est incomplète ou abîmée.', false); return; }
    if (!obj || obj.app !== 'PadelPulse' || !obj.data || typeof obj.data !== 'object') {
        backupStatus('Ce texte n\'est pas une sauvegarde PadelPulse.', false); return;
    }

    const keys = backupKeys(Object.keys(obj.data)).filter(function(k) { return typeof obj.data[k] === 'string'; });
    if (keys.length === 0) { backupStatus('Cette sauvegarde est vide.', false); return; }
    try { keys.forEach(function(k) { JSON.parse(obj.data[k]); }); }
    catch (e) { backupStatus('Sauvegarde abîmée : restauration annulée, tes données sont intactes.', false); return; }

    if (!restorePending) {
        restorePending = true;
        document.getElementById('btn-restore').innerText = 'Confirmer : remplacer mes données';
        backupStatus('Attention : tes données actuelles seront remplacées. Appuie à nouveau pour confirmer.', false);
        return;
    }

    try {
        const existing = [];
        for (let i = 0; i < localStorage.length; i++) existing.push(localStorage.key(i));
        backupKeys(existing).forEach(function(k) { localStorage.removeItem(k); });
        keys.forEach(function(k) { localStorage.setItem(k, obj.data[k]); });
        localStorage.setItem(STORAGE_VERSION_KEY, 'true');
    } catch (e) { backupStatus('Erreur pendant la restauration.', false); return; }
    location.reload();
}
