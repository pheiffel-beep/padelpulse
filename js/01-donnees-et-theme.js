/* PadelPulse : Données enregistrées, thème clair/sombre, sauvegarde interne, onglets */
    const TACTICAL_TAGS_LIST = [
        "Construction",
        "Pression imposée",
        "Subi / Mis en difficulté",
        "Super cohésion",
        "Manque de repères binôme",
        "Point gagnant",
        "Faute directe",
        "Match serré / âpre"
    ];

    const STORAGE_VERSION_KEY = 'padelpulse_version_v23_clean_honor';
    // Ancienne règle supprimée : on n'efface plus jamais les données d'une version antérieure
    if (!localStorage.getItem(STORAGE_VERSION_KEY)) {
        localStorage.setItem(STORAGE_VERSION_KEY, 'true');
    }

    let playersDatabase = JSON.parse(localStorage.getItem('padelpulse_players')) || {};
    let currentMatchType = 'amical';
    let matchTypeFilter = 'all';
    let currentFormat = '6sets';
    let visibleSetsCount = 1;
    let currentTimePeriod = 'all';
    let rhythmViewMode = 'week';
    let currentCalendarDate = new Date();
    let currentSurgripMatchCount = parseInt(localStorage.getItem('padelpulse_surgrip_count')) || 0;
    let currentShoesMatchCount = parseInt(localStorage.getItem('padelpulse_shoes_count')) || 0;

    let showAllRecentMatches = false;
    let showAllLessons = false;
    let showAllPlayers = false;
    let showAllRacketsHistory = false;
    let showAllSurgripsHistory = false;
    let showAllShoesHistory = false;

    let currentMatchesPage = 1;
    const matchesPerPage = 5;

    let playerFilterType = 'all';
    let editingPlayerName = null;

    let editingMatchId = null;
    let editingLessonId = null;
    let editingRacketTarget = null;
    let editingSurgripTarget = null;
    let editingShoesTarget = null;

    let matches = JSON.parse(localStorage.getItem('padelpulse_matches')) || [];
    let lessons = JSON.parse(localStorage.getItem('padelpulse_lessons')) || [];
    let racketsHistory = JSON.parse(localStorage.getItem('padelpulse_rackets')) || [];
    let surgripsHistory = JSON.parse(localStorage.getItem('padelpulse_surgrips')) || [];
    let shoesHistory = JSON.parse(localStorage.getItem('padelpulse_shoes')) || [];

    let mainRacket = JSON.parse(localStorage.getItem('padelpulse_main_racket')) || { name: 'Aucune raquette enregistrée', date: '-', matchesCount: 0 };
    let backupRacket = JSON.parse(localStorage.getItem('padelpulse_backup_racket')) || { name: 'Aucune raquette de réserve', date: '-', matchesCount: 0 };
    let testRacket = JSON.parse(localStorage.getItem('padelpulse_test_racket')) || { name: 'Aucune raquette test', date: '-', matchesCount: 0 };

    let currentSurgrip = JSON.parse(localStorage.getItem('padelpulse_current_surgrip')) || { name: 'Aucun surgrip enregistré', date: '-' };
    let currentShoes = JSON.parse(localStorage.getItem('padelpulse_current_shoes')) || { name: 'Aucune paire enregistrée', date: '-' };

    let weeklyOverrides = JSON.parse(localStorage.getItem('padelpulse_weekly_overrides')) || {};

    let isDarkTheme = localStorage.getItem('padelpulse_dark_theme') === 'true';

    function initThemeMode() {
        const btn = document.getElementById('theme-toggle-btn');
        if (isDarkTheme) {
            document.body.classList.add('dark');
            if (btn) btn.innerText = '🌙';
        } else {
            document.body.classList.remove('dark');
            if (btn) btn.innerText = '🌞';
        }
    }

    function toggleThemeMode() {
        isDarkTheme = !isDarkTheme;
        localStorage.setItem('padelpulse_dark_theme', isDarkTheme);
        initThemeMode();
    }

    function saveAllData() {
        localStorage.setItem('padelpulse_matches', JSON.stringify(matches));
        localStorage.setItem('padelpulse_lessons', JSON.stringify(lessons));
        localStorage.setItem('padelpulse_rackets', JSON.stringify(racketsHistory));
        localStorage.setItem('padelpulse_surgrips', JSON.stringify(surgripsHistory));
        localStorage.setItem('padelpulse_shoes', JSON.stringify(shoesHistory));
        localStorage.setItem('padelpulse_players', JSON.stringify(playersDatabase));
        localStorage.setItem('padelpulse_weekly_overrides', JSON.stringify(weeklyOverrides));
        localStorage.setItem('padelpulse_surgrip_count', currentSurgripMatchCount.toString());
        localStorage.setItem('padelpulse_shoes_count', currentShoesMatchCount.toString());
        localStorage.setItem('padelpulse_main_racket', JSON.stringify(mainRacket));
        localStorage.setItem('padelpulse_backup_racket', JSON.stringify(backupRacket));
        localStorage.setItem('padelpulse_test_racket', JSON.stringify(testRacket));
        localStorage.setItem('padelpulse_current_surgrip', JSON.stringify(currentSurgrip));
        localStorage.setItem('padelpulse_current_shoes', JSON.stringify(currentShoes));
    }

    function openResetModal() { document.getElementById('modal-reset').style.display = 'flex'; }
    function closeResetModal() { document.getElementById('modal-reset').style.display = 'none'; }

    function confirmResetData() {
        localStorage.clear();
        localStorage.setItem(STORAGE_VERSION_KEY, 'true');
        matches = []; lessons = []; racketsHistory = []; surgripsHistory = []; shoesHistory = [];
        playersDatabase = {}; weeklyOverrides = {};
        currentSurgripMatchCount = 0; currentShoesMatchCount = 0;
        mainRacket = { name: 'Aucune raquette enregistrée', date: '-', matchesCount: 0 };
        backupRacket = { name: 'Aucune raquette de réserve', date: '-', matchesCount: 0 };
        testRacket = { name: 'Aucune raquette test', date: '-', matchesCount: 0 };
        currentSurgrip = { name: 'Aucun surgrip enregistré', date: '-' };
        currentShoes = { name: 'Aucune paire enregistrée', date: '-' };

        saveAllData();
        renderWeeklySchedule(); renderMonthlySchedule(); renderMatches();
        renderLessons(); renderRackets(); renderSurgrips(); renderShoes();
        updateStats(); updatePartnerDropdownOptions(); closeResetModal();
    }

    function switchTab(tabId) {
        const tabs = ['tab-dashboard', 'tab-matches', 'tab-lessons', 'tab-gear'];
        const views = ['view-dashboard', 'view-matches', 'view-lessons', 'view-gear'];

        tabs.forEach((t, index) => {
            const btn = document.getElementById(t);
            const view = document.getElementById(views[index]);
            if (!btn || !view) return;
            if (t === tabId) {
                btn.classList.add('text-padel-terracotta');
                btn.classList.remove('text-padel-muted');
                view.style.display = 'block';
            } else {
                btn.classList.remove('text-padel-terracotta');
                btn.classList.add('text-padel-muted');
                view.style.display = 'none';
            }
        });
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.scrollTop = 0;
    }
