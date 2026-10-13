/* PadelPulse : Rythme d'activité : semaine et mois */
    function getCurrentWeekDays() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + distToMon);
        monday.setHours(0,0,0,0);

        const days = [];
        const dayLetters = window.PP_LANG === 'nl' ? ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            days.push({
                letter: dayLetters[i],
                dateNum: d.getDate(),
                dateStr: dateStr,
                isToday: d.toDateString() === now.toDateString()
            });
        }
        return days;
    }

    function getDayStatus(dateStr) {
        if (weeklyOverrides[dateStr]) {
            const type = weeklyOverrides[dateStr];
            if (type === 'match') return { type: 'match', label: 'Match', icon: '🎾' };
            if (type === 'lesson') return { type: 'lesson', label: 'Cours', icon: '🎓' };
            return { type: 'rest', label: 'Repos', icon: '💤' };
        }

        const todayStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        const hasMatch = matches.some(m => {
            if (m.date === dateStr) return true;
            if (m.date === "Aujourd'hui" && dateStr === todayStr) return true;
            if (m.timestamp) {
                const mDateStr = new Date(m.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                if (mDateStr === dateStr) return true;
            }
            return false;
        });
        if (hasMatch) return { type: 'match', label: 'Match', icon: '🎾' };

        const hasLesson = lessons.some(l => {
            if (l.date === dateStr) return true;
            if (l.date === "Aujourd'hui" && dateStr === todayStr) return true;
            if (l.timestamp) {
                const lDateStr = new Date(l.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                if (lDateStr === dateStr) return true;
            }
            return false;
        });
        if (hasLesson) return { type: 'lesson', label: 'Cours', icon: '🎓' };

        return { type: 'rest', label: 'Repos', icon: '💤' };
    }

    function cycleDayActivity(dateStr) {
        const currentStatus = getDayStatus(dateStr);
        const types = ['rest', 'match', 'lesson'];
        const nextIdx = (types.indexOf(currentStatus.type) + 1) % types.length;

        weeklyOverrides[dateStr] = types[nextIdx];
        saveAllData();
        renderWeeklySchedule();
        renderMonthlySchedule();
    }

    function renderWeeklySchedule() {
        const container = document.getElementById('weekly-grid');
        const sessionCountEl = document.getElementById('weekly-session-count');
        if (!container) return;

        const weekDays = getCurrentWeekDays();
        let activeCount = 0;

        container.innerHTML = weekDays.map(d => {
            const status = getDayStatus(d.dateStr);
            let badgeStyle = 'input-bg border-padel-border text-slate-400';

            if (status.type === 'match') {
                badgeStyle = 'bg-padel-terracotta/15 border-padel-terracotta/30 text-padel-terracotta font-bold';
                activeCount++;
            } else if (status.type === 'lesson') {
                badgeStyle = 'bg-amber-500/15 border-amber-500/30 text-amber-600 font-bold';
                activeCount++;
            }

            const todayRing = d.isToday ? 'ring-1 ring-padel-terracotta' : '';

            return `
                <div onclick="cycleDayActivity('${d.dateStr}')" title="${d.dateStr} : ${status.label}" class="p-1.5 rounded-xl border ${badgeStyle} ${todayRing} cursor-pointer hover:border-padel-terracotta/60 transition flex flex-col items-center justify-between h-16 select-none relative shadow-xs">
                    <div class="flex items-center justify-center gap-0.5">
                        <span class="text-[11px] font-extrabold text-padel-navy uppercase">${d.letter}</span>
                        <span class="text-[10px] text-padel-muted font-mono">${d.dateNum}</span>
                    </div>
                    <span class="text-xs my-0.5">${status.icon}</span>
                    <span class="text-[10px] truncate max-w-full font-medium">${status.label}</span>
                </div>
            `;
        }).join('');

        if (sessionCountEl) sessionCountEl.innerText = `${activeCount} Séance${activeCount > 1 ? 's' : ''}`;
    }

    function setRhythmViewMode(mode) {
        rhythmViewMode = mode;
        const btnWeek = document.getElementById('btn-rhythm-week');
        const btnMonth = document.getElementById('btn-rhythm-month');
        const wrapWeek = document.getElementById('wrapper-weekly-view');
        const wrapMonth = document.getElementById('wrapper-monthly-view');

        if (mode === 'month') {
            if (btnMonth) btnMonth.className = "px-2 py-0.5 rounded-lg text-[12px] font-bold card-bg text-padel-terracotta shadow-xs transition";
            if (btnWeek) btnWeek.className = "px-2 py-0.5 rounded-lg text-[12px] font-medium text-padel-muted hover:text-padel-navy transition";
            if (wrapWeek) wrapWeek.style.display = 'none';
            if (wrapMonth) wrapMonth.style.display = 'block';
            renderMonthlySchedule();
        } else {
            if (btnWeek) btnWeek.className = "px-2 py-0.5 rounded-lg text-[12px] font-bold card-bg text-padel-terracotta shadow-xs transition";
            if (btnMonth) btnMonth.className = "px-2 py-0.5 rounded-lg text-[12px] font-medium text-padel-muted hover:text-padel-navy transition";
            if (wrapMonth) wrapMonth.style.display = 'none';
            if (wrapWeek) wrapWeek.style.display = 'block';
            renderWeeklySchedule();
        }
    }

    function navigateCalendarMonth(delta) {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
        renderMonthlySchedule();
    }

    function renderMonthlySchedule() {
        const container = document.getElementById('monthly-grid');
        const monthLabel = document.getElementById('calendar-month-label');
        const sessionCountEl = document.getElementById('monthly-session-count');
        if (!container) return;

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const monthName = currentCalendarDate.toLocaleDateString(window.PP_LOCALE || 'fr-FR', { month: 'long', year: 'numeric' });
        if (monthLabel) monthLabel.innerText = monthName;

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let startDayIndex = firstDayOfMonth.getDay() - 1;
        if (startDayIndex === -1) startDayIndex = 6;

        const today = new Date();
        const todayStr = today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

        let html = '';
        let activeMonthSessions = 0;

        for (let i = 0; i < startDayIndex; i++) {
            html += `<div class="p-1 rounded-lg bg-transparent border border-transparent h-10"></div>`;
        }

        for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
            const dateObj = new Date(year, month, dayNum);
            const dateStr = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const status = getDayStatus(dateStr);
            const isToday = dateStr === todayStr;

            let cellStyle = 'input-bg border-padel-border text-padel-muted';
            let dotIcon = '';

            if (status.type === 'match') {
                cellStyle = 'bg-padel-terracotta/15 border-padel-terracotta/40 text-padel-terracotta font-bold';
                dotIcon = '🎾';
                activeMonthSessions++;
            } else if (status.type === 'lesson') {
                cellStyle = 'bg-amber-500/15 border-amber-500/40 text-amber-600 font-bold';
                dotIcon = '🎓';
                activeMonthSessions++;
            }

            const todayRing = isToday ? 'ring-1 ring-padel-terracotta' : '';

            html += `
                <div onclick="cycleDayActivity('${dateStr}')" title="${dateStr} : ${status.label}" class="p-1 rounded-xl border ${cellStyle} ${todayRing} cursor-pointer hover:border-padel-terracotta/60 transition flex flex-col items-center justify-between h-10 select-none relative overflow-hidden shadow-xs">
                    <span class="text-[11px] font-mono leading-none font-bold">${dayNum}</span>
                    <span class="text-[11px] leading-none">${dotIcon || '·'}</span>
                </div>
            `;
        }

        container.innerHTML = html;
        if (sessionCountEl) sessionCountEl.innerText = `${activeMonthSessions} séance${activeMonthSessions > 1 ? 's' : ''} ce mois`;
    }
