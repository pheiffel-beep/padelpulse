/* PadelPulse : Matériel : chaussures, raquettes, surgrips */
    function renderShoes() {
        if (document.getElementById('current-shoes-name')) document.getElementById('current-shoes-name').innerText = currentShoes.name;
        if (document.getElementById('current-shoes-date')) document.getElementById('current-shoes-date').innerText = currentShoes.date;
        renderShoesHistory();
    }

    function openShoesModal() {
        editingShoesTarget = null;
        if (document.getElementById('shoes-input-name')) document.getElementById('shoes-input-name').value = '';
        if (document.getElementById('shoes-input-date')) document.getElementById('shoes-input-date').value = '';
        document.getElementById('modal-shoes').style.display = 'flex';
    }

    function closeShoesModal() { document.getElementById('modal-shoes').style.display = 'none'; }

    function openEditShoesModal(target) {
        editingShoesTarget = target;
        let currentData = { name: '', date: '' };
        if (target === 'current') currentData = currentShoes;
        else if (typeof target === 'number' && shoesHistory[target]) currentData = { name: shoesHistory[target].name, date: shoesHistory[target].date };

        if (document.getElementById('shoes-input-name')) document.getElementById('shoes-input-name').value = currentData.name || '';
        if (document.getElementById('shoes-input-date')) document.getElementById('shoes-input-date').value = currentData.date || '';
        document.getElementById('modal-shoes').style.display = 'flex';
    }

    function deleteShoes(target) {
        if (target === 'current') { currentShoes = { name: 'Aucune paire enregistrée', date: '-' }; currentShoesMatchCount = 0; }
        else if (typeof target === 'number') shoesHistory.splice(target, 1);
        saveAllData(); renderShoes(); renderMatches();
    }

    function submitShoes() {
        const name = document.getElementById('shoes-input-name')?.value.trim();
        const date = document.getElementById('shoes-input-date')?.value.trim() || 'Aujourd\'hui';
        if (!name) return;

        if (editingShoesTarget !== null) {
            if (editingShoesTarget === 'current') currentShoes = { name: name, date: date };
            else if (typeof editingShoesTarget === 'number' && shoesHistory[editingShoesTarget]) {
                shoesHistory[editingShoesTarget].name = name;
                shoesHistory[editingShoesTarget].date = date;
            }
        } else {
            if (currentShoes.name && currentShoes.name !== 'Aucune paire enregistrée') {
                shoesHistory.unshift({ name: currentShoes.name, date: 'Acquises le ' + currentShoes.date, matches: currentShoesMatchCount + ' matchs' });
            }
            currentShoes = { name: name, date: date };
            currentShoesMatchCount = 0;
        }
        editingShoesTarget = null;
        saveAllData(); renderMatches(); renderShoes(); closeShoesModal();
    }

    function archiveCurrentShoes() {
        if (currentShoes.name && currentShoes.name !== 'Aucune paire enregistrée') {
            shoesHistory.unshift({ name: currentShoes.name, date: 'Acquises le ' + currentShoes.date, matches: currentShoesMatchCount + ' matchs' });
            currentShoes = { name: 'Aucune paire enregistrée', date: '-' };
            currentShoesMatchCount = 0;
            saveAllData(); renderShoes(); renderMatches();
        }
    }

    function toggleShoesHistory() {
        showAllShoesHistory = !showAllShoesHistory;
        renderShoesHistory();
    }

    function renderShoesHistory() {
        const container = document.getElementById('shoes-history-container');
        const toggleBtn = document.getElementById('btn-toggle-shoes');
        if (!container) return;

        if (shoesHistory.length === 0) {
            container.innerHTML = `<p class="text-[12px] text-padel-muted text-center py-2">Aucun historique de chaussures</p>`;
            if (toggleBtn) toggleBtn.style.display = 'none';
            return;
        }

        if (toggleBtn) {
            if (shoesHistory.length > 3) {
                toggleBtn.style.display = 'block';
                toggleBtn.innerText = showAllShoesHistory ? 'Réduire' : `Voir plus (${shoesHistory.length})`;
            } else toggleBtn.style.display = 'none';
        }

        const displayList = showAllShoesHistory ? shoesHistory : shoesHistory.slice(0, 3);
        container.innerHTML = displayList.map((s, index) => `
            <div class="flex justify-between items-center gap-2 text-xs p-2 input-bg rounded-lg border border-padel-border shadow-2xs">
                <div class="min-w-0">
                    <p class="font-bold text-padel-navy text-[11px]">${s.name}</p>
                    <p class="text-[11px] text-padel-muted">${s.date}</p>
                </div>
                <div class="flex items-center gap-1.5">
                    <button onclick="openEditShoesModal(${index})" title="Modifier" class="text-padel-muted hover:text-padel-terracotta text-[12px]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                    <button onclick="deleteShoes(${index})" title="Supprimer" class="text-padel-muted hover:text-rose-500 text-[12px]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                    <span class="text-[11px] text-padel-muted font-semibold card-bg px-2 py-0.5 rounded-full border border-padel-border">${s.matches}</span>
                </div>
            </div>
        `).join('');
    }

    function openRacketModal() {
        editingRacketTarget = null;
        if (document.getElementById('racket-input-name')) document.getElementById('racket-input-name').value = '';
        if (document.getElementById('racket-input-date')) document.getElementById('racket-input-date').value = '';
        document.getElementById('modal-racket').style.display = 'flex';
    }

    function closeRacketModal() { document.getElementById('modal-racket').style.display = 'none'; }

    function openEditRacketModal(target) {
        editingRacketTarget = target;
        let currentData = { name: '', date: '' };
        if (target === 'main') currentData = mainRacket;
        else if (target === 'backup') currentData = backupRacket;
        else if (target === 'test') currentData = testRacket;
        else if (typeof target === 'number' && racketsHistory[target]) currentData = { name: racketsHistory[target].name, date: racketsHistory[target].dates };

        if (document.getElementById('racket-input-name')) document.getElementById('racket-input-name').value = currentData.name || '';
        if (document.getElementById('racket-input-date')) document.getElementById('racket-input-date').value = currentData.date || '';
        document.getElementById('modal-racket').style.display = 'flex';
    }

    function deleteRacket(target) {
        if (target === 'main') mainRacket = { name: 'Aucune raquette enregistrée', date: '-', matchesCount: 0 };
        else if (target === 'backup') backupRacket = { name: 'Aucune raquette de réserve', date: '-', matchesCount: 0 };
        else if (target === 'test') testRacket = { name: 'Aucune raquette test', date: '-', matchesCount: 0 };
        else if (typeof target === 'number') racketsHistory.splice(target, 1);
        saveAllData(); renderRackets();
    }

    function submitRacket() {
        const name = document.getElementById('racket-input-name')?.value.trim();
        const status = document.getElementById('racket-input-status')?.value;
        const date = document.getElementById('racket-input-date')?.value.trim() || 'Récemment';
        if (!name) return;

        if (editingRacketTarget !== null) {
            if (editingRacketTarget === 'main') mainRacket = { ...mainRacket, name: name, date: date };
            else if (editingRacketTarget === 'backup') backupRacket = { ...backupRacket, name: name, date: date };
            else if (editingRacketTarget === 'test') testRacket = { ...testRacket, name: name, date: date };
            else if (typeof editingRacketTarget === 'number' && racketsHistory[editingRacketTarget]) {
                racketsHistory[editingRacketTarget].name = name;
                racketsHistory[editingRacketTarget].dates = date;
            }
        } else {
            if (status === 'main') {
                if (mainRacket.name && mainRacket.name !== 'Aucune raquette enregistrée') {
                    racketsHistory.unshift({ name: mainRacket.name, dates: mainRacket.date, matches: (mainRacket.matchesCount || 0) + ' matchs' });
                }
                mainRacket = { name: name, date: date, matchesCount: 0 };
            } else if (status === 'backup') {
                if (backupRacket.name && backupRacket.name !== 'Aucune raquette de réserve') {
                    racketsHistory.unshift({ name: backupRacket.name, dates: backupRacket.date, matches: (backupRacket.matchesCount || 0) + ' matchs' });
                }
                backupRacket = { name: name, date: date, matchesCount: 0 };
            } else if (status === 'test') {
                if (testRacket.name && testRacket.name !== 'Aucune raquette test') {
                    racketsHistory.unshift({ name: testRacket.name, dates: testRacket.date, matches: (testRacket.matchesCount || 0) + ' matchs' });
                }
                testRacket = { name: name, date: date, matchesCount: 0 };
            } else {
                racketsHistory.unshift({ name: name, dates: date, matches: '0 match' });
            }
        }
        editingRacketTarget = null;
        saveAllData(); renderRackets(); closeRacketModal();
    }

    function archiveMainRacket() {
        if (mainRacket.name && mainRacket.name !== 'Aucune raquette enregistrée') {
            racketsHistory.unshift({ name: mainRacket.name, dates: mainRacket.date, matches: (mainRacket.matchesCount || 0) + ' matchs' });
            mainRacket = { name: 'Aucune raquette enregistrée', date: '-', matchesCount: 0 };
            saveAllData(); renderRackets();
        }
    }

    function archiveBackupRacket() {
        if (backupRacket.name && backupRacket.name !== 'Aucune raquette de réserve') {
            racketsHistory.unshift({ name: backupRacket.name, dates: backupRacket.date, matches: (backupRacket.matchesCount || 0) + ' matchs' });
            backupRacket = { name: 'Aucune raquette de réserve', date: '-', matchesCount: 0 };
            saveAllData(); renderRackets();
        }
    }

    function archiveTestRacket() {
        if (testRacket.name && testRacket.name !== 'Aucune raquette test') {
            racketsHistory.unshift({ name: testRacket.name, dates: testRacket.date, matches: (testRacket.matchesCount || 0) + ' matchs' });
            testRacket = { name: 'Aucune raquette test', date: '-', matchesCount: 0 };
            saveAllData(); renderRackets();
        }
    }

    // Remet une raquette archivée comme raquette principale.
    // Si une raquette principale existe déjà, elle part à son tour dans l'historique.
    function restoreRacketFromHistory(index) {
        const r = racketsHistory[index];
        if (!r) return;
        racketsHistory.splice(index, 1);
        if (mainRacket.name && mainRacket.name !== 'Aucune raquette enregistrée') {
            racketsHistory.unshift({ name: mainRacket.name, dates: mainRacket.date, matches: (mainRacket.matchesCount || 0) + ' matchs' });
        }
        mainRacket = { name: r.name, date: r.dates || '-', matchesCount: parseInt(r.matches, 10) || 0 };
        saveAllData(); renderRackets();
    }

    function toggleRacketsHistory() {
        showAllRacketsHistory = !showAllRacketsHistory;
        renderRacketsHistory();
    }

    function renderRackets() {
        if (document.getElementById('main-racket-name')) document.getElementById('main-racket-name').innerText = mainRacket.name;
        if (document.getElementById('main-racket-date')) document.getElementById('main-racket-date').innerText = mainRacket.date;
        if (document.getElementById('main-racket-matches')) document.getElementById('main-racket-matches').innerText = `${mainRacket.matchesCount || 0} match${(mainRacket.matchesCount || 0) > 1 ? 's' : ''} joué${(mainRacket.matchesCount || 0) > 1 ? 's' : ''}`;

        if (document.getElementById('backup-racket-name')) document.getElementById('backup-racket-name').innerText = backupRacket.name;
        if (document.getElementById('backup-racket-date')) document.getElementById('backup-racket-date').innerText = backupRacket.date;
        if (document.getElementById('backup-racket-matches')) document.getElementById('backup-racket-matches').innerText = `${backupRacket.matchesCount || 0} match${(backupRacket.matchesCount || 0) > 1 ? 's' : ''} joué${(backupRacket.matchesCount || 0) > 1 ? 's' : ''}`;

        if (document.getElementById('test-racket-name')) document.getElementById('test-racket-name').innerText = testRacket.name;
        if (document.getElementById('test-racket-date')) document.getElementById('test-racket-date').innerText = testRacket.date;
        if (document.getElementById('test-racket-matches')) document.getElementById('test-racket-matches').innerText = `${testRacket.matchesCount || 0} match${(testRacket.matchesCount || 0) > 1 ? 's' : ''} joué${(testRacket.matchesCount || 0) > 1 ? 's' : ''}`;

        renderRacketsHistory();
    }

    function renderRacketsHistory() {
        const container = document.getElementById('rackets-history-container');
        const toggleBtn = document.getElementById('btn-toggle-rackets');
        if (!container) return;

        if (racketsHistory.length === 0) {
            container.innerHTML = `<p class="text-[12px] text-padel-muted text-center py-2">Aucune raquette archivée</p>`;
            if (toggleBtn) toggleBtn.style.display = 'none';
            return;
        }

        if (toggleBtn) {
            if (racketsHistory.length > 3) {
                toggleBtn.style.display = 'block';
                toggleBtn.innerText = showAllRacketsHistory ? 'Réduire' : `Voir plus (${racketsHistory.length})`;
            } else toggleBtn.style.display = 'none';
        }

        const displayList = showAllRacketsHistory ? racketsHistory : racketsHistory.slice(0, 3);
        container.innerHTML = displayList.map((r, index) => `
            <div class="flex justify-between items-center gap-2 text-xs p-2 input-bg rounded-lg border border-padel-border shadow-2xs">
                <div class="min-w-0">
                    <p class="font-bold text-padel-navy text-[11px]">${r.name}</p>
                    <p class="text-[11px] text-padel-muted">${r.dates}</p>
                </div>
                <div class="flex items-center gap-1.5 shrink-0">
                    <button onclick="restoreRacketFromHistory(${index})" title="Remettre en raquette principale" class="whitespace-nowrap text-[11px] font-semibold text-padel-terracotta bg-padel-terracotta/10 border border-padel-terracotta/30 rounded-full px-2 py-0.5">↩ Réactiver</button>
                    <button onclick="openEditRacketModal(${index})" title="Modifier" class="text-padel-muted hover:text-padel-terracotta text-[12px]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                    <button onclick="deleteRacket(${index})" title="Supprimer" class="text-padel-muted hover:text-rose-500 text-[12px]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                    <span class="whitespace-nowrap text-[11px] font-semibold text-padel-muted card-bg px-2 py-0.5 rounded-full border border-padel-border">${r.matches || '0 match'}</span>
                </div>
            </div>
        `).join('');
    }

    function renderSurgrips() {
        if (document.getElementById('current-surgrip-name')) document.getElementById('current-surgrip-name').innerText = currentSurgrip.name;
        if (document.getElementById('current-surgrip-date')) document.getElementById('current-surgrip-date').innerText = currentSurgrip.date;
        renderSurgripsHistory();
    }

    function openSurgripModal() {
        editingSurgripTarget = null;
        if (document.getElementById('surgrip-input-name')) document.getElementById('surgrip-input-name').value = '';
        if (document.getElementById('surgrip-input-date')) document.getElementById('surgrip-input-date').value = '';
        document.getElementById('modal-surgrip').style.display = 'flex';
    }

    function closeSurgripModal() { document.getElementById('modal-surgrip').style.display = 'none'; }

    function openEditSurgripModal(target) {
        editingSurgripTarget = target;
        let currentData = { name: '', date: '' };
        if (target === 'current') currentData = currentSurgrip;
        else if (typeof target === 'number' && surgripsHistory[target]) currentData = { name: surgripsHistory[target].name, date: surgripsHistory[target].date };

        if (document.getElementById('surgrip-input-name')) document.getElementById('surgrip-input-name').value = currentData.name || '';
        if (document.getElementById('surgrip-input-date')) document.getElementById('surgrip-input-date').value = currentData.date || '';
        document.getElementById('modal-surgrip').style.display = 'flex';
    }

    function deleteSurgrip(target) {
        if (target === 'current') { currentSurgrip = { name: 'Aucun surgrip enregistré', date: '-' }; currentSurgripMatchCount = 0; }
        else if (typeof target === 'number') surgripsHistory.splice(target, 1);
        saveAllData(); renderSurgrips();
    }

    function submitSurgrip() {
        const name = document.getElementById('surgrip-input-name')?.value.trim();
        const date = document.getElementById('surgrip-input-date')?.value.trim() || 'Aujourd\'hui';
        if (!name) return;

        if (editingSurgripTarget !== null) {
            if (editingSurgripTarget === 'current') currentSurgrip = { name: name, date: date };
            else if (typeof editingSurgripTarget === 'number' && surgripsHistory[editingSurgripTarget]) {
                surgripsHistory[editingSurgripTarget].name = name;
                surgripsHistory[editingSurgripTarget].date = date;
            }
        } else {
            if (currentSurgrip.name && currentSurgrip.name !== 'Aucun surgrip enregistré') {
                surgripsHistory.unshift({ name: currentSurgrip.name, date: 'Posé le ' + currentSurgrip.date, matches: currentSurgripMatchCount + ' matchs' });
            }
            currentSurgrip = { name: name, date: date };
            currentSurgripMatchCount = 0;
        }
        editingSurgripTarget = null;
        saveAllData(); renderMatches(); renderSurgrips(); closeSurgripModal();
    }

    function toggleSurgripsHistory() {
        showAllSurgripsHistory = !showAllSurgripsHistory;
        renderSurgripsHistory();
    }

    function renderSurgripsHistory() {
        const container = document.getElementById('surgrip-history-container');
        const toggleBtn = document.getElementById('btn-toggle-surgrips');
        if (!container) return;

        if (surgripsHistory.length === 0) {
            container.innerHTML = `<p class="text-[12px] text-padel-muted text-center py-2">Aucun historique de surgrip</p>`;
            if (toggleBtn) toggleBtn.style.display = 'none';
            return;
        }

        if (toggleBtn) {
            if (surgripsHistory.length > 3) {
                toggleBtn.style.display = 'block';
                toggleBtn.innerText = showAllSurgripsHistory ? 'Réduire' : `Voir plus (${surgripsHistory.length})`;
            } else toggleBtn.style.display = 'none';
        }

        const displayList = showAllSurgripsHistory ? surgripsHistory : surgripsHistory.slice(0, 3);
        container.innerHTML = displayList.map((s, index) => `
            <div class="flex justify-between items-center gap-2 text-xs p-2 input-bg rounded-lg border border-padel-border shadow-2xs">
                <div class="min-w-0">
                    <p class="font-bold text-padel-navy text-[11px]">${s.name}</p>
                    <p class="text-[11px] text-padel-muted">${s.date}</p>
                </div>
                <div class="flex items-center gap-1.5">
                    <button onclick="openEditSurgripModal(${index})" title="Modifier" class="text-padel-muted hover:text-padel-terracotta text-[12px]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                    <button onclick="deleteSurgrip(${index})" title="Supprimer" class="text-padel-muted hover:text-rose-500 text-[12px]"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                    <span class="text-[11px] text-padel-muted font-semibold card-bg px-2 py-0.5 rounded-full border border-padel-border">${s.matches}</span>
                </div>
            </div>
        `).join('');
    }
