/* PadelPulse : Cours privés */
    function openLessonModal() {
        editingLessonId = null;
        if (document.getElementById('lesson-input-coach')) document.getElementById('lesson-input-coach').value = '';
        if (document.getElementById('lesson-input-location')) document.getElementById('lesson-input-location').value = '';

        const dateInput = document.getElementById('lesson-date-input');
        if (dateInput) {
            const today = new Date();
            dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        if (document.getElementById('lesson-racket-select')) document.getElementById('lesson-racket-select').value = 'main';
        if (document.getElementById('lesson-input-theme')) document.getElementById('lesson-input-theme').value = '';
        if (document.getElementById('lesson-input-notes')) document.getElementById('lesson-input-notes').value = '';
        document.getElementById('modal-lesson').style.display = 'flex';
    }

    function closeLessonModal() { document.getElementById('modal-lesson').style.display = 'none'; }

    function openEditLessonModal(id) {
        const l = lessons.find(x => x.id === id);
        if (!l) return;

        editingLessonId = id;
        if (document.getElementById('lesson-input-coach')) document.getElementById('lesson-input-coach').value = l.coach || '';
        if (document.getElementById('lesson-input-location')) document.getElementById('lesson-input-location').value = l.location || '';
        if (document.getElementById('lesson-racket-select')) document.getElementById('lesson-racket-select').value = l.racketUsed || 'main';

        const dateInput = document.getElementById('lesson-date-input');
        if (dateInput && l.date) {
            const parts = l.date.split('/');
            if (parts.length === 3) dateInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        if (document.getElementById('lesson-input-theme')) document.getElementById('lesson-input-theme').value = l.theme || '';
        if (document.getElementById('lesson-input-notes')) document.getElementById('lesson-input-notes').value = (l.notes || []).join('\n');
        document.getElementById('modal-lesson').style.display = 'flex';
    }

    function deleteLesson(id) {
        lessons = lessons.filter(l => l.id !== id);
        saveAllData(); renderLessons(); renderWeeklySchedule(); renderMonthlySchedule();
    }

    function submitLesson() {
        const coach = document.getElementById('lesson-input-coach')?.value || 'Coach non précisé';
        const location = document.getElementById('lesson-input-location')?.value || 'Lieu non précisé';
        const racketUsed = document.getElementById('lesson-racket-select')?.value || 'main';
        const theme = document.getElementById('lesson-input-theme')?.value || 'Thème général';
        const notesRaw = document.getElementById('lesson-input-notes')?.value || '';
        const notes = notesRaw.split('\n').map(n => n.trim()).filter(Boolean);

        const dateInputVal = document.getElementById('lesson-date-input')?.value;
        let dateStrFormatted = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        let timestampVal = new Date().getTime();

        if (dateInputVal) {
            const [yyyy, mm, dd] = dateInputVal.split('-');
            if (yyyy && mm && dd) {
                dateStrFormatted = `${dd}/${mm}/${yyyy}`;
                timestampVal = new Date(yyyy, mm - 1, dd).getTime();
            }
        }

        if (editingLessonId) {
            const index = lessons.findIndex(l => l.id === editingLessonId);
            if (index !== -1) {
                lessons[index] = {
                    ...lessons[index],
                    coach: coach,
                    location: location,
                    racketUsed: racketUsed,
                    date: dateStrFormatted,
                    timestamp: timestampVal,
                    theme: theme,
                    notes: notes.length ? notes : ['Remarques et consignes enregistrées.']
                };
            }
        } else {
            lessons.unshift({
                id: Date.now(),
                timestamp: timestampVal,
                coach: coach,
                location: location,
                racketUsed: racketUsed,
                date: dateStrFormatted,
                theme: theme,
                notes: notes.length ? notes : ['Remarques et consignes enregistrées.']
            });

            currentSurgripMatchCount++;
            currentShoesMatchCount++;

            if (racketUsed === 'main') mainRacket.matchesCount = (mainRacket.matchesCount || 0) + 1;
            else if (racketUsed === 'backup') backupRacket.matchesCount = (backupRacket.matchesCount || 0) + 1;
            else if (racketUsed === 'test') testRacket.matchesCount = (testRacket.matchesCount || 0) + 1;
        }

        editingLessonId = null;
        saveAllData(); renderLessons(); renderRackets(); renderMatches();
        renderWeeklySchedule(); renderMonthlySchedule(); closeLessonModal();
    }

    function toggleAllLessons() {
        showAllLessons = !showAllLessons;
        renderLessons();
    }

    function renderLessons() {
        const container = document.getElementById('lessons-container');
        const toggleBtn = document.getElementById('btn-toggle-all-lessons');
        if (!container) return;

        if (lessons.length === 0) {
            container.innerHTML = `<p class="text-[11px] text-padel-muted text-center py-4">Aucun cours privé enregistré</p>`;
            if (toggleBtn) toggleBtn.style.display = 'none';
            return;
        }

        if (toggleBtn) {
            if (lessons.length > 2) {
                toggleBtn.style.display = 'block';
                toggleBtn.innerText = showAllLessons ? 'Réduire' : `Voir tout (${lessons.length})`;
            } else toggleBtn.style.display = 'none';
        }

        const displayLessons = showAllLessons ? lessons : lessons.slice(0, 2);
        container.innerHTML = displayLessons.map(l => `
            <div class="input-bg p-3 rounded-xl border border-padel-border space-y-2 relative group">
                <div class="flex justify-between items-start gap-2">
                    <span class="text-[12px] font-bold text-padel-terracotta bg-padel-terracotta/10 px-2 py-0.5 rounded border border-padel-terracotta/20">${l.date}</span>
                    <div class="flex items-center gap-2">
                        <div class="text-right flex items-center gap-1.5 text-[12px] text-padel-muted">
                            <span class="font-medium text-padel-navy flex items-center gap-1"><i data-lucide="user" class="w-3 h-3 text-padel-terracotta"></i> ${l.coach}</span>
                            <span>•</span>
                            <span class="text-padel-muted flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3 text-amber-600"></i> ${l.location}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="openEditLessonModal(${l.id})" title="Modifier" class="text-padel-muted hover:text-padel-terracotta text-xs p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
                            <button onclick="deleteLesson(${l.id})" title="Supprimer" class="text-padel-muted hover:text-rose-500 text-xs p-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block align-middle pointer-events-none"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg></button>
                        </div>
                    </div>
                </div>
                <p class="text-xs text-padel-navy font-extrabold pt-0.5">Thème : ${l.theme}</p>
                <ul class="text-sm font-medium text-slate-800 dark:text-slate-300 space-y-1 list-disc list-inside">
                    ${l.notes.map(n => `<li>${n}</li>`).join('')}
                </ul>
            </div>
        `).join('');
        if (window.lucide) lucide.createIcons();
    }
