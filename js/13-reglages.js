/* PadelPulse : Réglages (roue ⚙️), thème clair / sombre / automatique, rappel de sauvegarde */

// ----- Thème : 'light' (clair), 'dark' (sombre) ou 'auto' (suit le téléphone) -----
const THEME_KEY = 'padelpulse_theme_mode';
const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function getThemeMode() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
    // Ancien réglage (bouton soleil / lune) : on le respecte
    const old = localStorage.getItem('padelpulse_dark_theme');
    if (old === 'true') return 'dark';
    if (old === 'false') return 'light';
    return 'auto';
}

function applyThemeMode() {
    const mode = getThemeMode();
    isDarkTheme = mode === 'auto' ? !!(darkQuery && darkQuery.matches) : mode === 'dark';
    initThemeMode();
}

function setThemeMode(mode) {
    localStorage.setItem(THEME_KEY, mode);
    applyThemeMode();
    renderSettings();
}

if (darkQuery) {
    const onSystemChange = function() { if (getThemeMode() === 'auto') applyThemeMode(); };
    if (darkQuery.addEventListener) darkQuery.addEventListener('change', onSystemChange);
    else if (darkQuery.addListener) darkQuery.addListener(onSystemChange);
}
// Le thème est calculé dès maintenant, avant le premier affichage
isDarkTheme = getThemeMode() === 'auto' ? !!(darkQuery && darkQuery.matches) : getThemeMode() === 'dark';

// ----- Fenêtre des réglages -----
function markChoice(id, active) {
    const el = document.getElementById(id);
    if (!el) return;
    const on = ['bg-padel-terracotta', 'text-white', 'border-padel-terracotta'];
    const off = ['input-bg', 'text-padel-muted', 'border-padel-border'];
    el.classList.remove(...(active ? off : on));
    el.classList.add(...(active ? on : off));
}

function renderSettings() {
    markChoice('set-lang-fr', window.PP_LANG !== 'nl');
    markChoice('set-lang-nl', window.PP_LANG === 'nl');
    const mode = getThemeMode();
    markChoice('set-theme-light', mode === 'light');
    markChoice('set-theme-dark', mode === 'dark');
    markChoice('set-theme-auto', mode === 'auto');
    const info = document.getElementById('settings-backup-info');
    if (info) {
        const last = localStorage.getItem('padelpulse_last_backup_date');
        if (!last) info.innerText = 'Aucune sauvegarde pour le moment';
        else {
            const days = Math.floor((Date.now() - parseInt(last, 10)) / 86400000);
            info.innerText = days <= 0 ? "Dernière sauvegarde : aujourd'hui"
                : days === 1 ? 'Dernière sauvegarde : hier'
                : 'Dernière sauvegarde : il y a ' + days + ' jours';
        }
    }
}

function openSettingsModal() {
    renderSettings();
    document.getElementById('modal-settings').style.display = 'flex';
}
function closeSettingsModal() { document.getElementById('modal-settings').style.display = 'none'; }
function settingsOpenBackup() { closeSettingsModal(); openBackupModal(); }
function settingsOpenReset() { closeSettingsModal(); openResetModal(); }

// ----- Rappel de sauvegarde : tous les 10 matchs -----
const BACKUP_REMINDER_EVERY = 10;

function backupReminderDue() {
    const lastCount = parseInt(localStorage.getItem('padelpulse_last_backup_count') || '0', 10);
    const snooze = parseInt(localStorage.getItem('padelpulse_backup_snooze_count') || '0', 10);
    const ref = Math.max(lastCount, snooze);
    return matches.length - ref >= BACKUP_REMINDER_EVERY;
}

function renderBackupReminder() {
    const box = document.getElementById('backup-reminder');
    if (!box) return;
    box.style.display = backupReminderDue() ? 'flex' : 'none';
}

function snoozeBackupReminder() {
    localStorage.setItem('padelpulse_backup_snooze_count', String(matches.length));
    renderBackupReminder();
}

function backupReminderOpen() { openBackupModal(); }

// Quand la sauvegarde est copiée, on note la date et le nombre de matchs
const _prevCopyBackup = copyBackup;
copyBackup = function() {
    _prevCopyBackup();
    localStorage.setItem('padelpulse_last_backup_date', String(Date.now()));
    localStorage.setItem('padelpulse_last_backup_count', String(matches.length));
    localStorage.removeItem('padelpulse_backup_snooze_count');
    renderBackupReminder();
};

// Après l'enregistrement d'un match, on vérifie s'il faut afficher le rappel
const _prevSubmitForReminder = submitExpressMatch;
submitExpressMatch = function() {
    _prevSubmitForReminder();
    renderBackupReminder();
};

// La réinitialisation efface les données, mais garde la langue et le thème choisis
const _prevResetKeepPrefs = confirmResetData;
confirmResetData = function() {
    const lang = localStorage.getItem('padelpulse_lang');
    const theme = localStorage.getItem(THEME_KEY);
    _prevResetKeepPrefs();
    if (lang) localStorage.setItem('padelpulse_lang', lang);
    if (theme) localStorage.setItem(THEME_KEY, theme);
    renderBackupReminder();
};

window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.settingsOpenBackup = settingsOpenBackup;
window.settingsOpenReset = settingsOpenReset;
window.setThemeMode = setThemeMode;
window.snoozeBackupReminder = snoozeBackupReminder;
window.backupReminderOpen = backupReminderOpen;
window.addEventListener('load', function() { applyThemeMode(); renderBackupReminder(); });
