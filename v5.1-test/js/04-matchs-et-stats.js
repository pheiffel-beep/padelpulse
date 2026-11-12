/* PadelPulse : Liste des matchs, joueurs et statistiques */
    function setTimePeriodFilter(period) {
        currentTimePeriod = period;
        updateStats(); renderMatches();
    }

    function getFilteredMatches() {
        let filtered = matches;
        if (matchTypeFilter !== 'all') {
            filtered = filtered.filter(m => (m.type || 'amical') === matchTypeFilter);
        }

        if (currentTimePeriod !== 'all') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            filtered = filtered.filter(m => {
                const matchDate = m.timestamp ? new Date(m.timestamp) : new Date();
                if (currentTimePeriod === 'this_month') return matchDate.getFullYear() === currentYear && matchDate.getMonth() === currentMonth;
                if (currentTimePeriod === 'this_year') return matchDate.getFullYear() === currentYear;
                if (currentTimePeriod === 'prev_year') return matchDate.getFullYear() === currentYear - 1;
                return true;
            });
        }
        return filtered;
    }

    function showResultFeedback(match) {
        const modal = document.getElementById('modal-result-feedback');
        const card = document.getElementById('feedback-card');
        const iconWrap = document.getElementById('feedback-icon-wrapper');
        const emojiEl = document.getElementById('feedback-emoji');
        const badgeEl = document.getElementById('feedback-badge');
        const titleEl = document.getElementById('feedback-title');
        const msgEl = document.getElementById('feedback-message');
        const partnerEl = document.getElementById('feedback-partner-text');
        const scoreEl = document.getElementById('feedback-score-text');
        const oppEl = document.getElementById('feedback-opponents-text');

        if (!modal || !card) return;

        if (partnerEl) partnerEl.innerText = `avec ${match.partner} (${match.courtPosition || 'Droite'})`;
        if (scoreEl) scoreEl.innerText = match.score;
        if (oppEl) oppEl.innerText = `vs ${match.opponents}`;

        if (match.result === 'VICTOIRE') {
            card.className = "card-bg w-full max-w-[320px] rounded-3xl p-5 space-y-3.5 shadow-2xl relative my-auto shrink-0 text-center border border-padel-terracotta/40 animate-pop-in";
            if (iconWrap) iconWrap.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg bg-padel-terracotta/20 text-padel-terracotta border border-padel-terracotta/40";
            if (emojiEl) emojiEl.innerText = "🏆";
            if (badgeEl) {
                badgeEl.className = "text-[12px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-padel-terracotta/20 text-padel-terracotta border-padel-terracotta/40";
                badgeEl.innerText = "Victoire !";
            }
            if (titleEl) titleEl.innerText = "Super Match !";
            if (msgEl) msgEl.innerText = "Le travail paye sur le terrain ! Continue sur cette lancée 🔥";
            if (window.confetti) confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } else {
            card.className = "card-bg w-full max-w-[320px] rounded-3xl p-5 space-y-3.5 shadow-2xl relative my-auto shrink-0 text-center border border-rose-500/30 animate-shake";
            if (iconWrap) iconWrap.className = "w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg bg-rose-500/20 text-rose-500 border border-rose-500/30";
            if (emojiEl) emojiEl.innerText = "🧠";
            if (badgeEl) {
                badgeEl.className = "text-[12px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-rose-500/20 text-rose-500 border-rose-500/30";
                badgeEl.innerText = "Défaite";
            }
            if (titleEl) titleEl.innerText = "Bien battu !";
            if (msgEl) msgEl.innerText = "Analyse tes tags tactiques et reviens plus fort 💪";
        }
        modal.style.display = 'flex';
    }

    function closeResultFeedbackModal() { document.getElementById('modal-result-feedback').style.display = 'none'; }

    function renderMatchCard(m) {
        let badgeClass = 'bg-slate-500 text-white border-slate-500';
        if (m.result === 'VICTOIRE') badgeClass = 'bg-emerald-600 text-white border-emerald-600';
        if (m.result === 'DÉFAITE') badgeClass = 'bg-rose-600 text-white border-rose-600';

        const typeTag = m.type === 'competition'
            ? `<span class="text-[11px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">🏆 Compétition</span>`
            : `<span class="text-[11px] text-padel-muted input-bg px-1.5 py-0.2 rounded border border-padel-border">🎾 Amical</span>`;

        const locationTag = m.location
            ? `<span class="text-[11px] text-padel-muted font-medium flex items-center gap-0.5"><i data-lucide="map-pin" class="w-3 h-3 text-amber-600"></i> ${m.location}</span>`
            : '';

        const positionTag = `<span class="text-[11px] text-padel-terracotta font-bold bg-padel-terracotta/10 px-1.5 py-0.2 rounded border border-padel-terracotta/20">Pos: ${m.courtPosition || 'Droite'}</span>`;

        return `
            <div class="card-bg p-3 rounded-2xl border border-padel-border space-y-2 relative group shadow-sm">
                <div class="flex justify-between items-start gap-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="text-[12px] font-bold ${badgeClass} px-2 py-0.5 rounded-full border">${m.result}</span>
                        ${typeTag}
                        ${positionTag}
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button onclick="openEditMatchModal(${m.id})" title="Modifier" class="text-padel-muted hover:text-padel-terracotta text-xs p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                        <button onclick="deleteMatch(${m.id})" title="Supprimer" class="text-padel-muted hover:text-rose-500 text-xs p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                    </div>
                </div>
                <div class="flex justify-between items-start gap-3">
                    <div class="min-w-0">
                        <p class="text-[12px] text-padel-muted font-medium">${m.date}</p>
                        <h4 class="text-xs font-bold text-padel-navy">avec ${m.partner}</h4>
                        <p class="text-[12px] text-padel-muted">vs ${m.opponents}</p>
                        ${locationTag ? `<p class="mt-0.5">${locationTag}</p>` : ''}
                    </div>
                    <div class="text-right shrink-0 max-w-[45%]">
                        <span class="text-xs font-black tracking-wide text-padel-terracotta block">${m.score}</span>
                        <span class="text-[11px] text-padel-muted block">${m.format}</span>
                    </div>
                </div>

                ${m.comments ? `<div class="input-bg p-2 rounded-xl border border-padel-border text-[12px] text-slate-600 dark:text-slate-300 italic">💬 "${m.comments}"</div>` : ''}

                <div class="flex items-start justify-between gap-2 border-t border-padel-border pt-2 text-[12px]">
                    <span class="text-padel-muted whitespace-nowrap shrink-0 pt-0.5">${m.feeling}</span>
                    <div class="flex gap-1 flex-wrap justify-end">
                        ${(m.tags || []).map(t => `<span class="input-bg px-2 py-0.5 rounded-md text-[11px] text-padel-navy border border-padel-border">${t}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function toggleAllRecentMatches() {
        showAllRecentMatches = !showAllRecentMatches;
        renderMatches();
    }

    function changeMatchesPage(direction) {
        currentMatchesPage += direction;
        renderMatches();
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.scrollTop = 0;
    }

    function renderMatches() {
        const recentContainer = document.getElementById('recent-matches-container');
        const allContainer = document.getElementById('all-matches-container');
        const paginationContainer = document.getElementById('matches-pagination-controls');
        const filtered = getFilteredMatches();

        if (recentContainer) {
            const displayRecent = showAllRecentMatches ? filtered : filtered.slice(0, 3);
            let html = displayRecent.map(m => renderMatchCard(m)).join('');

            if (filtered.length > 3) {
                html += `
                    <button onclick="toggleAllRecentMatches()" class="w-full py-2 card-bg hover:opacity-80 border border-padel-border rounded-xl text-xs text-padel-terracotta font-semibold transition flex items-center justify-center gap-1 mt-1 shadow-xs">
                        <span>${showAllRecentMatches ? 'Réduire' : `Voir plus (${filtered.length - 3} de plus)`}</span>
                        <i data-lucide="${showAllRecentMatches ? 'chevron-up' : 'chevron-down'}" class="w-3.5 h-3.5"></i>
                    </button>
                `;
            }
            recentContainer.innerHTML = html;
        }

        if (allContainer) {
            const totalPages = Math.ceil(filtered.length / matchesPerPage) || 1;
            if (currentMatchesPage > totalPages) currentMatchesPage = totalPages;
            if (currentMatchesPage < 1) currentMatchesPage = 1;

            const startIdx = (currentMatchesPage - 1) * matchesPerPage;
            const pageItems = filtered.slice(startIdx, startIdx + matchesPerPage);

            allContainer.innerHTML = pageItems.length > 0 ? pageItems.map(m => renderMatchCard(m)).join('') : `<p class="text-[11px] text-padel-muted text-center py-6">Aucun match enregistré</p>`;

            if (paginationContainer) {
                if (filtered.length > matchesPerPage) {
                    paginationContainer.style.display = 'flex';
                    paginationContainer.innerHTML = `
                        <button onclick="changeMatchesPage(-1)" ${currentMatchesPage === 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl text-xs font-bold card-bg border border-padel-border ${currentMatchesPage === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 text-padel-terracotta'} transition shadow-xs">◀ Précédent</button>
                        <span class="text-[11px] font-bold text-padel-muted">Page ${currentMatchesPage} / ${totalPages}</span>
                        <button onclick="changeMatchesPage(1)" ${currentMatchesPage === totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-xl text-xs font-bold card-bg border border-padel-border ${currentMatchesPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 text-padel-terracotta'} transition shadow-xs">Suivant ▶</button>
                    `;
                } else {
                    paginationContainer.style.display = 'none';
                }
            }
        }

        const currentSurgripMatchesEl = document.getElementById('current-surgrip-matches');
        if (currentSurgripMatchesEl) currentSurgripMatchesEl.innerText = `${currentSurgripMatchCount} match${currentSurgripMatchCount > 1 ? 's' : ''} joué${currentSurgripMatchCount > 1 ? 's' : ''}`;

        const currentShoesMatchesEl = document.getElementById('current-shoes-matches');
        if (currentShoesMatchesEl) currentShoesMatchesEl.innerText = `${currentShoesMatchCount} match${currentShoesMatchCount > 1 ? 's' : ''} joué${currentShoesMatchCount > 1 ? 's' : ''}`;

        if (window.lucide) lucide.createIcons();
    }

    function openEditPlayerModal(playerName) {
        editingPlayerName = playerName;
        const titleEl = document.getElementById('edit-player-name-title');
        const selectEl = document.getElementById('edit-player-rank-select');
        if (titleEl) titleEl.innerText = `Joueur : ${playerName}`;
        if (selectEl) selectEl.value = playersDatabase[playerName]?.rank || 'P200';
        document.getElementById('modal-edit-player').style.display = 'flex';
    }

    function closeEditPlayerModal() {
        document.getElementById('modal-edit-player').style.display = 'none';
        editingPlayerName = null;
    }

    function savePlayerRankEdit() {
        if (!editingPlayerName) return;
        const newRank = document.getElementById('edit-player-rank-select').value;
        if (!playersDatabase[editingPlayerName]) {
            playersDatabase[editingPlayerName] = { rank: newRank, gender: newRank.endsWith('D') ? 'F' : 'M' };
        } else {
            playersDatabase[editingPlayerName].rank = newRank;
        }
        saveAllData(); renderPlayersStats(); updatePartnerDropdownOptions(); closeEditPlayerModal();
    }

    function toggleAllPlayers() {
        showAllPlayers = !showAllPlayers;
        renderPlayersStats();
    }

    function setPlayerFilter(type) {
        playerFilterType = type;
        showAllPlayers = false;
        ['all', 'partner', 'opponent'].forEach(t => {
            const btn = document.getElementById('filter-btn-' + t);
            if (!btn) return;
            if (t === type) btn.className = "px-2.5 py-1 rounded-lg text-[12px] font-bold bg-padel-terracotta/15 text-padel-terracotta border border-padel-terracotta/30 transition";
            else btn.className = "px-2.5 py-1 rounded-lg text-[12px] font-medium input-bg text-padel-muted border border-padel-border transition";
        });
        renderPlayersStats();
    }

    function renderPlayersStats() {
        const searchVal = (document.getElementById('player-search-input')?.value || '').toLowerCase().trim();
        const container = document.getElementById('partners-list');
        if (!container) return;

        const partnersMap = {};
        const opponentsMap = {};

        matches.forEach(m => {
            if (m.partner) {
                if (!partnersMap[m.partner]) partnersMap[m.partner] = { name: m.partner, wins: 0, total: 0, type: 'partner' };
                partnersMap[m.partner].total++;
                if (m.result === 'VICTOIRE') partnersMap[m.partner].wins++;
            }
            if (m.opponents) {
                const oppList = m.opponents.split(/&|,|\set\s/).map(s => s.trim()).filter(Boolean);
                oppList.forEach(opp => {
                    if (!opponentsMap[opp]) opponentsMap[opp] = { name: opp, wins: 0, total: 0, type: 'opponent' };
                    opponentsMap[opp].total++;
                    if (m.result === 'VICTOIRE') opponentsMap[opp].wins++;
                });
            }
        });

        let list = [];
        if (playerFilterType === 'all' || playerFilterType === 'partner') Object.values(partnersMap).forEach(p => list.push(p));
        if (playerFilterType === 'all' || playerFilterType === 'opponent') {
            Object.values(opponentsMap).forEach(o => {
                if (!list.find(item => item.name.toLowerCase() === o.name.toLowerCase())) list.push(o);
            });
        }

        list = list.filter(function(it) { return !isPlayerHidden(it.name); }); if (searchVal) {
            list = list.filter(item => {
                const info = playersDatabase[item.name] || {};
                const rankStr = info.rank ? info.rank.toLowerCase() : '';
                return item.name.toLowerCase().includes(searchVal) || rankStr.includes(searchVal);
            });
        }

        if (list.length === 0) {
            container.innerHTML = `<p class="text-[11px] text-padel-muted text-center py-3">Aucun joueur enregistré</p>`;
            return;
        }

        const displayList = showAllPlayers ? list : list.slice(0, 3);

        let html = displayList.map(item => {
            const winRate = item.total ? Math.round((item.wins / item.total) * 100) : 0;
            let badgeColor = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30';
            if (winRate < 50) badgeColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            else if (winRate === 50) badgeColor = 'text-slate-500 bg-slate-500/10 border-slate-500/30';

            const initials = item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const roleLabel = item.type === 'partner' ? 'Coéquipier' : 'Adversaire';
            const playerInfo = playersDatabase[item.name] || { rank: 'P200', gender: 'M' };
            const isDames = playerInfo.rank.endsWith('D') || playerInfo.gender === 'F';
            const rankBadgeClass = isDames ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-500/30' : 'input-bg text-padel-terracotta border-padel-terracotta/30';
            const detailText = item.type === 'partner' ? `${item.total} match${item.total > 1 ? 's' : ''} (${item.wins}V - ${drawsOf(item) ? drawsOf(item) + 'N - ' : ''}${item.total - item.wins - drawsOf(item)}D)` : `${item.total} affrontement${item.total > 1 ? 's' : ''} (${item.wins}V - ${drawsOf(item) ? drawsOf(item) + 'N - ' : ''}${item.total - item.wins - drawsOf(item)}D)`;

            return `
                <div onclick="openPlayerHistory(decodeURIComponent('${encodeURIComponent(item.name).replace(/'/g, '%27')}'))" class="flex items-center justify-between input-bg p-2.5 rounded-xl border border-padel-border cursor-pointer active:scale-[0.99] transition">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-full card-bg border border-padel-border flex items-center justify-center font-bold text-xs text-padel-terracotta shrink-0 shadow-xs">${initials}</div>
                        <div class="min-w-0">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="font-extrabold text-xs text-padel-navy truncate">${item.name}</span>
                                <button onclick="event.stopPropagation();openEditPlayerModal(decodeURIComponent('${encodeURIComponent(item.name).replace(/'/g, '%27')}'))" title="Modifier" class="text-[11px] ${rankBadgeClass} px-1.5 py-0.2 rounded font-bold border hover:border-padel-terracotta transition">${playerInfo.rank} <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                            </div>
                            <span class="text-[12px] text-padel-muted block truncate">${detailText}</span>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="text-[12px] font-bold ${badgeColor} px-2 py-0.5 rounded-full border">${winRate}% V</span>
                        <span class="text-[11px] text-padel-muted block mt-0.5">${roleLabel} ›</span>
                    </div>
                </div>
            `;
        }).join('');

        if (list.length > 3) {
            html += `
                <button onclick="toggleAllPlayers()" class="w-full py-1.5 card-bg hover:opacity-80 border border-padel-border rounded-xl text-[12px] text-padel-terracotta font-semibold transition flex items-center justify-center gap-1 mt-1 shadow-xs">
                    <span>${showAllPlayers ? 'Réduire' : `Voir plus (${list.length - 3} de plus)`}</span>
                    <i data-lucide="${showAllPlayers ? 'chevron-up' : 'chevron-down'}" class="w-3 h-3"></i>
                </button>
            `;
        }
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    function updateStats() {
        const filtered = getFilteredMatches();
        const total = filtered.length;

        const totalEl = document.getElementById('stat-total-matches');
        if (totalEl) totalEl.innerText = total.toString();

        const wins = filtered.filter(m => m.result === 'VICTOIRE').length;
        const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
        const winRateEl = document.getElementById('stat-win-rate');
        if (winRateEl) winRateEl.innerText = `${winRate}%`;

        const avgRatingEl = document.getElementById('stat-avg-feeling');
        if (avgRatingEl) {
            if (total > 0) {
                const sumRating = filtered.reduce((acc, m) => acc + (parseFloat(m.rating) || 4), 0);
                avgRatingEl.innerHTML = `${(sumRating / total).toFixed(1)}<span class="text-xs text-padel-muted font-normal">/5</span>`;
            } else {
                avgRatingEl.innerHTML = `-<span class="text-xs text-padel-muted font-normal">/5</span>`;
            }
        }

        const summaryGrid = document.getElementById('stats-summary-grid');
        if (summaryGrid) {
            const locations = {}; const partners = {};
            filtered.forEach(m => {
                if (m.location?.trim()) {
                    const loc = m.location.trim();
                    if (!locations[loc]) locations[loc] = { total: 0, wins: 0 };
                    locations[loc].total++;
                    if (m.result === 'VICTOIRE') locations[loc].wins++;
                }
                if (m.partner?.trim()) {
                    const part = m.partner.trim();
                    if (!partners[part]) partners[part] = { total: 0, wins: 0 };
                    partners[part].total++;
                    if (m.result === 'VICTOIRE') partners[part].wins++;
                }
            });

            let topLocName = 'Aucun club', topLocDetails = '0 partie', topLocWinRate = '0%', maxLocCount = 0;
            Object.keys(locations).forEach(loc => {
                if (locations[loc].total > maxLocCount) {
                    maxLocCount = locations[loc].total;
                    topLocName = loc;
                    topLocDetails = `${maxLocCount} partie${maxLocCount > 1 ? 's' : ''}`;
                    topLocWinRate = `${Math.round((locations[loc].wins / maxLocCount) * 100)}% V`;
                }
            });

            let topPartnerName = 'Aucun', topPartnerDetails = '0 partie', topPartnerWinRate = '0%', maxPartCount = 0;
            Object.keys(partners).forEach(part => {
                if (partners[part].total > maxPartCount) {
                    maxPartCount = partners[part].total;
                    topPartnerName = part;
                    topPartnerDetails = `${maxPartCount} partie${maxPartCount > 1 ? 's' : ''}`;
                    topPartnerWinRate = `${Math.round((partners[part].wins / maxPartCount) * 100)}% V`;
                }
            });

            summaryGrid.innerHTML = `
                <div class="input-bg p-2.5 rounded-xl border border-padel-border space-y-1">
                    <span class="text-[11px] font-bold text-padel-muted uppercase tracking-wider block flex items-center gap-1">
                        <i data-lucide="map-pin" class="w-3 h-3 text-amber-600"></i> Club le + Joué
                    </span>
                    <p class="font-extrabold text-xs text-padel-navy truncate">${topLocName}</p>
                    <div class="flex justify-between items-center text-[12px] text-padel-muted pt-0.5">
                        <span>${topLocDetails}</span>
                        <span class="text-padel-terracotta font-bold">${topLocWinRate}</span>
                    </div>
                </div>
                <div class="input-bg p-2.5 rounded-xl border border-padel-border space-y-1">
                    <span class="text-[11px] font-bold text-padel-muted uppercase tracking-wider block flex items-center gap-1">
                        <i data-lucide="heart" class="w-3 h-3 text-rose-500"></i> Coéquipier Favori
                    </span>
                    <p class="font-extrabold text-xs text-padel-navy truncate">${topPartnerName}</p>
                    <div class="flex justify-between items-center text-[12px] text-padel-muted pt-0.5">
                        <span>${topPartnerDetails}</span>
                        <span class="text-padel-terracotta font-bold">${topPartnerWinRate}</span>
                    </div>
                </div>
            `;
        }
        renderPlayersStats();
    }
