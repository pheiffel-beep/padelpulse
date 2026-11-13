/* PadelPulse v5.1 : second rappel de sauvegarde, lié au temps
 *
 * Le rappel existant s'affiche tous les 10 matchs depuis la dernière sauvegarde.
 * On ajoute : aucune sauvegarde depuis 30 jours ET au moins 3 matchs encodés depuis.
 * (Sans aucune sauvegarde : on compte 30 jours depuis la première ouverture de cette version.)
 * Le même bandeau sert pour les deux ; « Plus tard » repousse le rappel du temps de 7 jours.
 */
(function () {
    const DAYS = 30, MIN_MATCHES = 3, SNOOZE_DAYS = 7;
    const DAY = 86400000;
    const FIRST_KEY = 'padelpulse_first_seen';
    const SNOOZE_KEY = 'padelpulse_backup_time_snooze';

    if (!localStorage.getItem(FIRST_KEY)) {
        try { localStorage.setItem(FIRST_KEY, String(Date.now())); } catch (e) {}
    }
    function num(k) { return parseInt(localStorage.getItem(k) || '0', 10) || 0; }

    function daysSinceBackup() {
        const ref = num('padelpulse_last_backup_date') || num(FIRST_KEY) || Date.now();
        return Math.floor((Date.now() - ref) / DAY);
    }
    function timeDue() {
        const since = matches.length - num('padelpulse_last_backup_count');
        if (since < MIN_MATCHES) return false;
        if (daysSinceBackup() < DAYS) return false;
        return Date.now() >= num(SNOOZE_KEY);
    }

    const _prevDue = backupReminderDue;
    backupReminderDue = function () { return _prevDue() || timeDue(); };

    const _prevRender = renderBackupReminder;
    renderBackupReminder = function () {
        _prevRender();
        const box = document.getElementById('backup-reminder');
        if (!box) return;
        const txt = box.querySelector('span.flex-1');
        if (!txt) return;
        const hasBackup = !!num('padelpulse_last_backup_date');
        if (!_prevDue() && timeDue()) {
            const d = daysSinceBackup();
            txt.textContent = hasBackup
                ? ppL('Ta dernière sauvegarde date de ' + d + ' jours. Pense à en refaire une.', 'Je laatste back-up is ' + d + ' dagen oud. Maak er een nieuwe.')
                : ppL('Tu n’as encore jamais fait de sauvegarde. Pense à en faire une.', 'Je hebt nog nooit een back-up gemaakt. Maak er een.');
        } else {
            txt.textContent = ppL('Pense à faire une sauvegarde de tes matchs.', 'Vergeet niet een back-up van je matchen te maken.');
        }
    };

    const _prevSnooze = snoozeBackupReminder;
    snoozeBackupReminder = function () {
        try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_DAYS * DAY)); } catch (e) {}
        _prevSnooze();
    };

    window.backupReminderDue = backupReminderDue;
    window.renderBackupReminder = renderBackupReminder;
    window.snoozeBackupReminder = snoozeBackupReminder;
    renderBackupReminder();
})();
