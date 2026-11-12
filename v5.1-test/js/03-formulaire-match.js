/* PadelPulse : Formulaire de saisie d'un match */
    // FIX HONOR: Remplacement des select via texte pur pour empêcher le DOM de crasher
    function populateScoreDropdowns(maxScore) {
        [1, 2, 3].forEach(setNum => {
            const usSelect = document.getElementById(`s${setNum}-us`);
            const themSelect = document.getElementById(`s${setNum}-them`);
            if (!usSelect || !themSelect) return;

            let limit = maxScore;
            if (currentFormat === '6sets_comp' && setNum === 3) {
                limit = 20;
            }

            let optionsHtml = '';
            for (let i = 0; i <= limit; i++) {
                optionsHtml += `<option value="${i}">${i}</option>`;
            }

            usSelect.innerHTML = optionsHtml;
            themSelect.innerHTML = optionsHtml;

            usSelect.value = "0";
            themSelect.value = "0";
            checkTieBreakVisibility(setNum);
        });
    }

    // FIX HONOR: Affichage forcé du tie break + scrolling automatique vers le bas
    function checkTieBreakVisibility(setNum) {
        const us = parseInt(document.getElementById(`s${setNum}-us`)?.value) || 0;
        const them = parseInt(document.getElementById(`s${setNum}-them`)?.value) || 0;
        const tbInput = document.getElementById(`s${setNum}-tb`);
        const wrap = document.getElementById(`s${setNum}-tb-wrap`);

        if (!wrap) return;

        if (currentFormat === '6sets_comp' && setNum === 3) {
            wrap.style.display = 'none';
            return;
        }

        const isTieBreakScore = (us === 7 && them === 6) || (us === 6 && them === 7) ||
                                (us === 9 && them === 8) || (us === 8 && them === 9) ||
                                (us === 10 && them === 9) || (us === 9 && them === 10) ||
                                (us === 6 && them === 6) || (us === 9 && them === 9);

        const wasHidden = wrap.style.display === 'none';

        if (isTieBreakScore || (tbInput && tbInput.value.trim() !== '')) {
            wrap.style.display = 'flex';
            // Forcer le reflow sur les vieux Androids
            void wrap.offsetWidth;

            // Si ça vient d'apparaître, on scroll vers le bas
            if (wasHidden) {
                setTimeout(() => {
                    const modalBox = document.getElementById('modal-match-content');
                    if (modalBox) modalBox.scrollTop = modalBox.scrollHeight;
                }, 50);
            }
        } else {
            wrap.style.display = 'none';
        }
    }

    function setMatchType(type) {
        currentMatchType = type;
        const btnAmical = document.getElementById('btn-type-amical');
        const btnComp = document.getElementById('btn-type-competition');

        if (type === 'competition') {
            if (btnComp) btnComp.className = "type-btn active py-1.5 px-2 input-bg border border-padel-terracotta/50 text-padel-terracotta font-bold rounded-xl text-[12px] text-center transition truncate";
            if (btnAmical) btnAmical.className = "type-btn py-1.5 px-2 input-bg border border-padel-border text-padel-muted font-medium rounded-xl text-[12px] hover:opacity-80 text-center transition truncate";
        } else {
            if (btnAmical) btnAmical.className = "type-btn active py-1.5 px-2 input-bg border border-padel-terracotta/50 text-padel-terracotta font-bold rounded-xl text-[12px] text-center transition truncate";
            if (btnComp) btnComp.className = "type-btn py-1.5 px-2 input-bg border border-padel-border text-padel-muted font-medium rounded-xl text-[12px] hover:opacity-80 text-center transition truncate";
        }
    }

    function setMatchTypeFilter(type) {
        matchTypeFilter = type;
        currentMatchesPage = 1;
        ['all', 'amical', 'competition'].forEach(t => {
            const btn1 = document.getElementById('filter-type-' + t);
            const btn2 = document.getElementById('filter-type-' + t + '-matches');
            const activeClass = "py-1.5 px-2 rounded-xl text-[11px] font-bold bg-padel-terracotta/15 text-padel-terracotta border border-padel-terracotta/30 transition text-center truncate";
            const inactiveClass = "py-1.5 px-2 rounded-xl text-[11px] font-medium text-padel-muted hover:text-padel-navy transition text-center truncate";

            if (btn1) btn1.className = (t === type) ? activeClass : inactiveClass;
            if (btn2) btn2.className = (t === type) ? activeClass : inactiveClass;
        });
        updateStats();
        renderMatches();
    }

    // FIX HONOR: Utilisation stricte des style.display au lieu des classes Tailwind "hidden"
    function setFormat(formatKey) {
        currentFormat = formatKey;
        visibleSetsCount = 1;

        ['6sets', '6sets_comp', '9sets', '21pts'].forEach(k => {
            const btn = document.getElementById('btn-fmt-' + k);
            if (btn) {
                if (k === formatKey) btn.className = "fmt-btn active px-1.5 py-1.5 input-bg border border-padel-border text-padel-navy rounded-xl text-[12px] transition text-center leading-tight truncate";
                else btn.className = "fmt-btn px-1.5 py-1.5 input-bg border border-padel-border text-padel-muted rounded-xl text-[12px] hover:opacity-80 transition text-center leading-tight truncate";
            }
        });

        const badge = document.getElementById('format-badge');
        const r2 = document.getElementById('row-set-2');
        const r3 = document.getElementById('row-set-3');
        const addBtn = document.getElementById('btn-add-set');
        const label1 = document.getElementById('label-set-1');
        const label2 = document.getElementById('label-set-2');
        const label3 = document.getElementById('label-set-3');

        if (formatKey === '21pts') {
            populateScoreDropdowns(21);
            if (badge) badge.innerText = 'Partie libre';
            if (label1) label1.innerText = 'Set Unique';
            if (r2) r2.style.display = 'none';
            if (r3) r3.style.display = 'none';
            if (addBtn) addBtn.style.display = 'none';
        } else if (formatKey === '6sets_comp') {
            populateScoreDropdowns(7);
            if (badge) badge.innerText = 'Set en 6 jeux compétition';
            if (label1) label1.innerText = 'Set 1';
            if (label2) label2.innerText = 'Set 2';
            if (label3) label3.innerText = 'Super TB';

            visibleSetsCount = 3;
            if (r2) r2.style.display = 'flex';
            if (r3) r3.style.display = 'flex';
            if (addBtn) addBtn.style.display = 'none';
            checkTieBreakVisibility(3);
        } else {
            const maxScore = formatKey === '9sets' ? 9 : 7;
            populateScoreDropdowns(maxScore);
            if (badge) badge.innerText = formatKey === '9sets' ? 'Sets en 9 jeux' : 'Sets en 6 jeux';
            if (label1) label1.innerText = 'Set 1';
            if (label2) label2.innerText = 'Set 2';
            if (label3) label3.innerText = 'Set 3';

            if (r2) r2.style.display = 'none';
            if (r3) r3.style.display = 'none';
            if (addBtn) {
                addBtn.style.display = 'flex';
                addBtn.querySelector('span').innerText = '+ Ajouter le Set 2';
            }
        }
    }

    // FIX HONOR: Défilement forcé à l'ajout du set
    function addSetField() {
        if (visibleSetsCount < 3) {
            visibleSetsCount++;
            const row = document.getElementById(`row-set-${visibleSetsCount}`);
            if (row) {
                row.style.display = 'flex';
                void row.offsetWidth; // Reflow forcé pour Android
            }

            const usEl = document.getElementById(`s${visibleSetsCount}-us`);
            const themEl = document.getElementById(`s${visibleSetsCount}-them`);
            if (usEl) usEl.value = "0";
            if (themEl) themEl.value = "0";

            checkTieBreakVisibility(visibleSetsCount);

            const addBtn = document.getElementById('btn-add-set');
            if (addBtn) {
                if (visibleSetsCount >= 3 || currentFormat === '6sets_comp') addBtn.style.display = 'none';
                else addBtn.querySelector('span').innerText = `+ Ajouter le Set ${visibleSetsCount + 1}`;
            }

            setTimeout(() => {
                const modalBox = document.getElementById('modal-match-content');
                if (modalBox) modalBox.scrollTop = modalBox.scrollHeight;
            }, 50);
        }
    }

    function updatePartnerDropdownOptions() {
        const select = document.getElementById('match-partner');
        if (!select) return;
        select.innerHTML = '<option value="">Sélectionner un coéquipier...</option>';
        Object.keys(playersDatabase).forEach(name => {
            const rank = playersDatabase[name]?.rank || 'P200';
            select.innerHTML += `<option value="${name}">${name} (${rank})</option>`;
        });
        select.innerHTML += '<option value="__NEW__">+ Créer un nouveau partenaire...</option>';
        select.value = "";
    }

    function renderTagDropdownOptions(selectedTags = []) {
        const menu = document.getElementById('tag-dropdown-menu');
        if (!menu) return;

        menu.innerHTML = TACTICAL_TAGS_LIST.map(tag => {
            const isChecked = selectedTags.includes(tag) ? 'checked' : '';
            return `
                <label class="flex items-center gap-2 p-1.5 hover:opacity-80 rounded-lg cursor-pointer text-xs text-padel-navy">
                    <input type="checkbox" value="${tag}" ${isChecked} onchange="updateTagSelection()" class="rounded input-bg border-padel-border text-padel-terracotta focus:ring-0">
                    <span>${tag}</span>
                </label>
            `;
        }).join('');
        updateTagDropdownLabel();
    }

    function toggleTagDropdown() {
        const menu = document.getElementById('tag-dropdown-menu');
        if (menu) {
            if (menu.style.display === 'none' || menu.style.display === '') menu.style.display = 'block';
            else menu.style.display = 'none';
        }
    }

    function updateTagSelection() {
        updateTagDropdownLabel();
    }

    function getSelectedTags() {
        const checkboxes = document.querySelectorAll('#tag-dropdown-menu input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    function updateTagDropdownLabel() {
        const label = document.getElementById('tag-dropdown-label');
        if (!label) return;
        const selected = getSelectedTags();
        if (selected.length === 0) {
            label.innerText = "Sélectionner des tags...";
            label.className = "truncate text-padel-muted";
        } else if (selected.length === 1) {
            label.innerText = selected[0];
            label.className = "truncate text-padel-terracotta font-semibold";
        } else {
            label.innerText = `${selected.length} tags sélectionnés`;
            label.className = "truncate text-padel-terracotta font-semibold";
        }
    }

    window.addEventListener('click', (e) => {
        const toggle = document.getElementById('tag-dropdown-toggle');
        const menu = document.getElementById('tag-dropdown-menu');
        if (toggle && menu && !toggle.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    // FIX HONOR: Destruction de la balise HTML pour écraser la mémoire de l'Autofill Android
    function toggleNewPartnerInput(show) {
        const fields = document.getElementById('new-partner-fields');
        const select = document.getElementById('match-partner');
        const container = document.getElementById('dynamic-partner-container');

        if (fields) {
            if (show) {
                fields.style.display = 'block';
                if (container) {
                    // Génère un ID totalement unique pour que le téléphone ne reconnaisse pas le champ
                    const uniqueId = 'partner_' + new Date().getTime();
                    container.innerHTML = `
                        <label for="${uniqueId}" class="block text-[11px] text-padel-muted mb-0.5 truncate">Prénom & Nom</label>
                        <input type="text" id="${uniqueId}" class="new-partner-dynamic-input w-full max-w-full box-border card-bg border border-padel-border rounded-lg p-1.5 text-xs text-padel-navy focus:outline-none focus:border-padel-terracotta" placeholder="Ex: Julien M." autocomplete="new-password">
                    `;
                }
                const rankSelect = document.getElementById('new-partner-rank');
                if (rankSelect) rankSelect.value = 'P200';
            } else {
                fields.style.display = 'none';
                if (container) container.innerHTML = '';
                if (select && select.value === '__NEW__') select.selectedIndex = 0;
            }
        }
    }

    function handlePartnerSelectChange(val) {
        if (val === '__NEW__') toggleNewPartnerInput(true);
        else toggleNewPartnerInput(false);
    }

    function resetMatchModalForm() {
        editingMatchId = null;
        setMatchType('amical');
        setFormat('6sets');

        const dateInput = document.getElementById('match-date-input');
        if (dateInput) {
            const today = new Date();
            dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }

        if (document.getElementById('match-racket-select')) document.getElementById('match-racket-select').value = 'main';
        if (document.getElementById('match-location')) document.getElementById('match-location').value = '';
        if (document.getElementById('match-court-position')) document.getElementById('match-court-position').value = 'Droite';
        if (document.getElementById('match-partner')) document.getElementById('match-partner').value = '';
        if (document.getElementById('match-opp1-name')) document.getElementById('match-opp1-name').value = '';
        if (document.getElementById('match-opp1-rank')) document.getElementById('match-opp1-rank').value = 'P200';
        if (document.getElementById('match-opp2-name')) document.getElementById('match-opp2-name').value = '';
        if (document.getElementById('match-opp2-rank')) document.getElementById('match-opp2-rank').value = 'P200';
        if (document.getElementById('match-feeling')) document.getElementById('match-feeling').value = '⚡ En forme';
        if (document.getElementById('match-rating')) document.getElementById('match-rating').value = '4';
        if (document.getElementById('match-comments')) document.getElementById('match-comments').value = '';

        [1, 2, 3].forEach(n => {
            const tbInput = document.getElementById(`s${n}-tb`);
            if (tbInput) tbInput.value = '';
            checkTieBreakVisibility(n);
        });

        renderTagDropdownOptions([]);
        toggleNewPartnerInput(false);
        updatePartnerDropdownOptions();
        populateScoreDropdowns(7);

        // Remise à 0 visuelle stricte pour Android
        const r2 = document.getElementById('row-set-2');
        if (r2) r2.style.display = 'none';
        const r3 = document.getElementById('row-set-3');
        if (r3) r3.style.display = 'none';
        const addBtn = document.getElementById('btn-add-set');
        if (addBtn) addBtn.style.display = 'flex';
    }

    function openMatchModal() {
        resetMatchModalForm();
        document.getElementById('modal-match').style.display = 'flex';
    }

    function closeMatchModal() {
        document.getElementById('modal-match').style.display = 'none';
    }

    function openEditMatchModal(id) {
        const m = matches.find(x => x.id === id);
        if (!m) return;

        resetMatchModalForm();
        editingMatchId = id;

        setMatchType(m.type || 'amical');
        let detectedFormat = '6sets';
        if (m.format === 'Sets en 9 jeux') detectedFormat = '9sets';
        else if (m.format === 'Set en 6 jeux compétition') detectedFormat = '6sets_comp';
        else if (m.format === 'Partie libre') detectedFormat = '21pts';
        setFormat(detectedFormat);

        if (document.getElementById('match-racket-select')) document.getElementById('match-racket-select').value = m.racketUsed || 'main';
        if (document.getElementById('match-location')) document.getElementById('match-location').value = m.location || '';
        if (document.getElementById('match-court-position')) document.getElementById('match-court-position').value = m.courtPosition || 'Droite';
        if (document.getElementById('match-partner')) document.getElementById('match-partner').value = m.partner || '';
        if (document.getElementById('match-comments')) document.getElementById('match-comments').value = m.comments || '';

        const dateInput = document.getElementById('match-date-input');
        if (dateInput && m.date) {
            const parts = m.date.split('/');
            if (parts.length === 3) dateInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        if (m.opponents) {
            const opps = m.opponents.split(/&|,|\set\s/).map(s => s.trim());
            if (opps[0] && document.getElementById('match-opp1-name')) document.getElementById('match-opp1-name').value = opps[0];
            if (opps[1] && document.getElementById('match-opp2-name')) document.getElementById('match-opp2-name').value = opps[1];
        }

        if (document.getElementById('match-feeling')) document.getElementById('match-feeling').value = m.feeling || '⚡ En forme';
        if (document.getElementById('match-rating')) document.getElementById('match-rating').value = (m.rating || 4).toString();

        renderTagDropdownOptions(m.tags || []);

        if (m.score) {
            const setScores = m.score.split(' ');
            visibleSetsCount = detectedFormat === '6sets_comp' ? 3 : Math.min(Math.max(setScores.length, 1), 3);
            for (let i = 1; i <= 3; i++) {
                const row = document.getElementById(`row-set-${i}`);
                if (row) {
                    if (i <= visibleSetsCount) row.style.display = 'flex';
                    else row.style.display = 'none';
                }
            }
            const addBtn = document.getElementById('btn-add-set');
            if (addBtn) {
                if (visibleSetsCount >= 3 || detectedFormat === '21pts' || detectedFormat === '6sets_comp') addBtn.style.display = 'none';
                else {
                    addBtn.style.display = 'flex';
                    addBtn.querySelector('span').innerText = `+ Ajouter le Set ${visibleSetsCount + 1}`;
                }
            }

            setScores.forEach((setStr, idx) => {
                const setNum = idx + 1;
                if (setNum > 3) return;
                const match = setStr.match(/^(\d+)\/(\d+)(?:\(([^)]+)\))?/);
                if (match) {
                    const usEl = document.getElementById(`s${setNum}-us`);
                    const themEl = document.getElementById(`s${setNum}-them`);
                    const tbEl = document.getElementById(`s${setNum}-tb`);
                    if (usEl) usEl.value = match[1];
                    if (themEl) themEl.value = match[2];
                    if (tbEl) tbEl.value = match[3] || '';
                    checkTieBreakVisibility(setNum);
                }
            });
        }

        document.getElementById('modal-match').style.display = 'flex';
    }

    function deleteMatch(id) {
        matches = matches.filter(m => m.id !== id);
        saveAllData();
        renderMatches(); renderRackets(); renderWeeklySchedule(); renderMonthlySchedule(); updateStats();
    }

    function submitExpressMatch() {
        let partnerName = document.getElementById('match-partner')?.value || '';
        const newPartnerFields = document.getElementById('new-partner-fields');

        if (newPartnerFields && newPartnerFields.style.display !== 'none') {
            const dynamicInput = document.querySelector('.new-partner-dynamic-input');
            const newName = dynamicInput ? dynamicInput.value.trim() : '';
            const newRank = document.getElementById('new-partner-rank')?.value || 'P200';
            if (newName) {
                partnerName = newName;
                playersDatabase[partnerName] = { rank: newRank, gender: newRank.endsWith('D') ? 'F' : 'M' };
            }
        }

        if (!partnerName || partnerName === '__NEW__') partnerName = 'Coéquipier';

        const opp1Name = document.getElementById('match-opp1-name')?.value.trim();
        const opp1Rank = document.getElementById('match-opp1-rank')?.value || 'P200';
        const opp2Name = document.getElementById('match-opp2-name')?.value.trim();
        const opp2Rank = document.getElementById('match-opp2-rank')?.value || 'P200';

        if (opp1Name) playersDatabase[opp1Name] = { rank: opp1Rank, gender: opp1Rank.endsWith('D') ? 'F' : 'M' };
        if (opp2Name) playersDatabase[opp2Name] = { rank: opp2Rank, gender: opp2Rank.endsWith('D') ? 'F' : 'M' };

        let opponentsStr = 'Adversaires';
        if (opp1Name && opp2Name) opponentsStr = `${opp1Name} & ${opp2Name}`;
        else if (opp1Name) opponentsStr = opp1Name;
        else if (opp2Name) opponentsStr = opp2Name;

        const location = document.getElementById('match-location')?.value || '';
        const courtPosition = document.getElementById('match-court-position')?.value || 'Droite';
        const feeling = document.getElementById('match-feeling')?.value || '⚡ En forme';
        const rating = parseInt(document.getElementById('match-rating')?.value) || 4;
        const racketUsed = document.getElementById('match-racket-select')?.value || 'main';
        const comments = document.getElementById('match-comments')?.value.trim() || '';
        const selectedTags = getSelectedTags();
        const tagsList = selectedTags.length > 0 ? selectedTags : ['Construction'];

        let scoreStr = '';
        let usSetsWon = 0;
        let themSetsWon = 0;

        if (currentFormat === '21pts') {
            const s1Us = parseInt(document.getElementById('s1-us')?.value) || 0;
            const s1Them = parseInt(document.getElementById('s1-them')?.value) || 0;
            scoreStr = `${s1Us}/${s1Them}`;
            if (s1Us > s1Them) usSetsWon++; else if (s1Them > s1Us) themSetsWon++;
        } else {
            let scores = [];
            for (let i = 1; i <= visibleSetsCount; i++) {
                const us = parseInt(document.getElementById(`s${i}-us`)?.value) || 0;
                const them = parseInt(document.getElementById(`s${i}-them`)?.value) || 0;
                const tbVal = document.getElementById(`s${i}-tb`)?.value?.trim() || '';
                const tbFormatted = tbVal ? `(${tbVal})` : '';
                scores.push(`${us}/${them}${tbFormatted}`);
                if (us > them) usSetsWon++;
                else if (them > us) themSetsWon++;
            }
            scoreStr = scores.join(' ');
        }

        const result = usSetsWon > themSetsWon ? 'VICTOIRE' : (usSetsWon < themSetsWon ? 'DÉFAITE' : 'MATCH NUL');
        const dateInputVal = document.getElementById('match-date-input')?.value;
        let dateStrFormatted = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        let timestampVal = new Date().getTime();

        if (dateInputVal) {
            const [yyyy, mm, dd] = dateInputVal.split('-');
            if (yyyy && mm && dd) {
                dateStrFormatted = `${dd}/${mm}/${yyyy}`;
                timestampVal = new Date(yyyy, mm - 1, dd).getTime();
            }
        }

        let formatLabel = 'Sets en 6 jeux';
        if (currentFormat === '9sets') formatLabel = 'Sets en 9 jeux';
        else if (currentFormat === '6sets_comp') formatLabel = 'Set en 6 jeux compétition';
        else if (currentFormat === '21pts') formatLabel = 'Partie libre';

        let savedMatch = null;

        if (editingMatchId) {
            const index = matches.findIndex(m => m.id === editingMatchId);
            if (index !== -1) {
                matches[index] = {
                    ...matches[index],
                    type: currentMatchType,
                    date: dateStrFormatted,
                    timestamp: timestampVal,
                    partner: partnerName,
                    opponents: opponentsStr,
                    location: location,
                    courtPosition: courtPosition,
                    racketUsed: racketUsed,
                    format: formatLabel,
                    score: scoreStr,
                    result: result,
                    feeling: feeling,
                    rating: rating,
                    tags: tagsList,
                    comments: comments
                };
                savedMatch = matches[index];
            }
        } else {
            savedMatch = {
                id: Date.now(),
                timestamp: timestampVal,
                date: dateStrFormatted,
                type: currentMatchType,
                partner: partnerName,
                opponents: opponentsStr,
                location: location,
                courtPosition: courtPosition,
                racketUsed: racketUsed,
                format: formatLabel,
                score: scoreStr,
                result: result,
                feeling: feeling,
                rating: rating,
                tags: tagsList,
                comments: comments
            };

            matches.unshift(savedMatch);
            currentSurgripMatchCount++;
            currentShoesMatchCount++;

            if (racketUsed === 'main') mainRacket.matchesCount = (mainRacket.matchesCount || 0) + 1;
            else if (racketUsed === 'backup') backupRacket.matchesCount = (backupRacket.matchesCount || 0) + 1;
            else if (racketUsed === 'test') testRacket.matchesCount = (testRacket.matchesCount || 0) + 1;
        }

        editingMatchId = null;
        saveAllData();
        renderMatches(); renderRackets(); renderWeeklySchedule(); renderMonthlySchedule(); updateStats();
        closeMatchModal();
        if (savedMatch) showResultFeedback(savedMatch);
    }
