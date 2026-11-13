/* PadelPulse v5.1 : fiche joueur enrichie
 *
 * La fiche existante (Bilan joueurs → toucher un joueur) montrait les matchs « Ensemble » et « Contre ».
 * On ajoute, au-dessus :
 * 1. « Commentaires des matchs » : tous les commentaires des matchs avec ou contre lui, d'un coup (retour de Lala).
 * 2. « Pourquoi je perds contre lui » : sur les défaites contre lui, les points perdus notés
 *    (« Où as-tu perdu des points ? »), les tags les plus fréquents et ses partenaires contre toi.
 * 3. « Ses conseils » : les conseils dont il est l'auteur.
 * Tout est calculé dans l'app, hors ligne.
 */
(function () {
    const SHOW_COMMENTS = 4;
    let showAllComments = false;
    let lastName = null;

    function esc(s) { return ppEsc(String(s == null ? '' : s)); }
    function dateKey(m) {
        if (m.timestamp) return m.timestamp;
        const p = matchDayStr(m).split('/');
        return p.length === 3 ? new Date(+p[2], +p[1] - 1, +p[0]).getTime() : 0;
    }
    function badge(m) {
        return '<span class="res-square ' + resultClass(m) + '" style="width:22px;height:22px;border-radius:7px;font-size:12px;flex-shrink:0">' + resultLetter(m) + '</span>';
    }
    function block(title, inner, extraCls) {
        return '<div class="pp-sheet-block ' + (extraCls || '') + '">' +
            '<p class="text-[11px] font-bold text-padel-muted uppercase tracking-wider mb-1.5">' + title + '</p>' + inner + '</div>';
    }
    function countsList(map, max) {
        return Object.keys(map).map(function (k) { return [k, map[k]]; })
            .sort(function (a, b) { return b[1] - a[1]; }).slice(0, max || 10);
    }
    function bars(list, total, labelFn) {
        return list.map(function (it) {
            const pct = Math.round(it[1] / Math.max(1, total) * 100);
            return '<div class="space-y-0.5"><div class="flex justify-between text-[12px]"><span class="text-padel-navy font-semibold">' + esc(labelFn(it[0])) + '</span>' +
                '<span class="text-padel-muted font-bold">' + it[1] + '×</span></div>' +
                '<div class="pp-bar"><span style="width:' + pct + '%"></span></div></div>';
        }).join('');
    }

    function commentsBlock(withList, againstList) {
        const all = withList.map(function (m) { return [m, true]; }).concat(againstList.map(function (m) { return [m, false]; }))
            .filter(function (x) { return (x[0].comments || '').trim(); })
            .sort(function (a, b) { return dateKey(b[0]) - dateKey(a[0]); });
        if (!all.length) return '';
        const shown = showAllComments ? all : all.slice(0, SHOW_COMMENTS);
        let html = '<div class="space-y-1.5">' + shown.map(function (x) {
            const m = x[0];
            const ctx = x[1] ? ppL('avec lui', 'met hem') : ppL('contre lui', 'tegen hem');
            return '<div class="input-bg rounded-xl border border-padel-border p-2.5 space-y-1">' +
                '<div class="flex items-center gap-2">' + badge(m) +
                '<span class="text-[11px] text-padel-muted truncate">' + esc(matchDayStr(m)) + ' · ' + ctx + ' · ' + esc(m.score || '') + '</span></div>' +
                '<p class="text-[13px] text-padel-navy leading-snug whitespace-pre-line break-words">' + esc(m.comments.trim()) + '</p></div>';
        }).join('') + '</div>';
        if (all.length > SHOW_COMMENTS) {
            html += '<button type="button" onclick="ppSheetToggleComments()" class="text-[12px] font-bold text-padel-terracotta mt-1.5">' +
                (showAllComments ? ppL('Voir moins', 'Minder tonen') : ppL('Voir les ' + all.length + ' commentaires', 'Alle ' + all.length + ' opmerkingen tonen')) + '</button>';
        }
        return block(ppL('Commentaires des matchs', 'Opmerkingen bij de matchen') + ' (' + all.length + ')', html);
    }

    function whyBlock(name, againstList) {
        const lost = againstList.filter(function (m) { return m.result === 'DÉFAITE'; });
        if (!lost.length) return '';
        const head = '<p class="text-[13px] text-padel-navy font-bold mb-2">' +
            ppL(lost.length + ' défaite' + (lost.length > 1 ? 's' : '') + ' sur ' + againstList.length + ' match' + (againstList.length > 1 ? 's' : '') + ' contre lui',
                lost.length + ' ' + (lost.length > 1 ? 'nederlagen' : 'nederlaag') + ' op ' + againstList.length + ' ' + (againstList.length > 1 ? 'matchen' : 'match') + ' tegen hem') + '</p>';
        let inner = head;

        const lp = {};
        let withLp = 0;
        lost.forEach(function (m) {
            if (Array.isArray(m.lostPoints) && m.lostPoints.length) {
                withLp++;
                m.lostPoints.forEach(function (k) { lp[k] = (lp[k] || 0) + 1; });
            }
        });
        if (withLp) {
            inner += '<p class="text-[11px] font-semibold text-padel-muted mb-1">' + ppL('Où tu as perdu des points', 'Waar je punten verloor') +
                ' <span class="font-normal">(' + ppL(withLp + ' défaite' + (withLp > 1 ? 's' : '') + ' renseignée' + (withLp > 1 ? 's' : ''), withLp + ' ingevuld') + ')</span></p>' +
                '<div class="space-y-1.5 mb-2.5">' + bars(countsList(lp), withLp, function (k) { return window.ppLostLabel ? ppLostLabel(k) : k; }) + '</div>';
        } else {
            inner += '<p class="text-[12px] text-padel-muted mb-2.5 leading-snug">' + ppL(
                'Réponds à « Où as-tu perdu des points ? » après tes défaites : cet encadré te montrera ce qui revient contre lui.',
                'Beantwoord « Waar verloor je punten? » na je nederlagen: dit vak toont dan wat tegen hem terugkomt.') + '</p>';
        }

        const tags = {};
        lost.forEach(function (m) { (m.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); });
        const topTags = countsList(tags, 3);
        if (topTags.length) {
            inner += '<p class="text-[11px] font-semibold text-padel-muted mb-1">' + ppL('Tags de ces défaites', 'Tags van deze nederlagen') + '</p>' +
                '<div class="flex flex-wrap gap-1.5 mb-2.5 text-[12px]">' + topTags.map(function (it) {
                    const label = typeof window.t === 'function' ? window.t(it[0]) : it[0];
                    return '<span class="pp-lp-tag">' + esc(label) + ' · ' + it[1] + '×</span>';
                }).join('') + '</div>';
        }

        const key = normName(name);
        const pairs = {};
        againstList.forEach(function (m) {
            const mate = oppNamesOf(m).filter(function (o) { return normName(o) !== key; })[0] || '';
            if (!mate) return;
            const k = mate;
            pairs[k] = pairs[k] || [];
            pairs[k].push(m);
        });
        const pairList = Object.keys(pairs).sort(function (a, b) { return pairs[b].length - pairs[a].length; }).slice(0, 4);
        if (pairList.length) {
            inner += '<p class="text-[11px] font-semibold text-padel-muted mb-1">' + ppL('Ses partenaires contre toi', 'Zijn partners tegen jou') + '</p>' +
                '<div class="space-y-1">' + pairList.map(function (p) {
                    return '<div class="flex justify-between gap-2 text-[12px]"><span class="text-padel-navy font-semibold truncate">' + esc(name) + ' & ' + esc(p) + '</span>' +
                        '<span class="text-padel-muted font-bold shrink-0">' + esc(summaryText(pairs[p])) + '</span></div>';
                }).join('') + '</div>';
        }
        return block(ppL('Pourquoi je perds contre lui', 'Waarom ik van hem verlies'), inner, 'pp-why');
    }

    function tipsBlock(name) {
        const tips = window.ppGetTips ? ppGetTips().filter(function (t) { return t.author && sameName(t.author, name); }) : [];
        if (!tips.length) return '';
        const STATUS = { todo: ['À travailler', 'Te oefenen'], doing: ['En cours', 'Bezig'], done: ['Acquis', 'Onder de knie'] };
        const html = '<div class="space-y-1.5">' + tips.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).map(function (t) {
            const st = STATUS[t.status] || STATUS.todo;
            return '<div class="input-bg rounded-xl border border-padel-border p-2.5 space-y-1">' +
                '<div class="flex items-center gap-1.5 flex-wrap">' + (t.theme ? '<span class="meta-chip">' + esc(t.theme) + '</span>' : '') +
                '<span class="pp-tip-status is-' + esc(t.status) + '">' + ppL(st[0], st[1]) + '</span>' +
                '<span class="text-[11px] text-padel-muted">' + esc(t.date) + '</span></div>' +
                '<p class="text-[13px] text-padel-navy leading-snug break-words">' + esc(t.text) + '</p></div>';
        }).join('') + '</div>';
        return block(ppL('Ses conseils', 'Zijn tips') + ' (' + tips.length + ')', html);
    }

    const _prevRender = renderPlayerHistory;
    renderPlayerHistory = function () {
        _prevRender.apply(this, arguments);
        if (!openPlayerName) return;
        if (lastName !== openPlayerName) { showAllComments = false; lastName = openPlayerName; }
        const key = normName(openPlayerName);
        const withList = matches.filter(function (m) { return normName(m.partner) === key; });
        const againstList = matches.filter(function (m) { return oppNamesOf(m).some(function (o) { return normName(o) === key; }); });
        const extra = commentsBlock(withList, againstList) + whyBlock(openPlayerName, againstList) + tipsBlock(openPlayerName);
        if (!extra) return;
        const box = document.getElementById('player-sheet-content');
        if (!box) return;
        const wrap = document.createElement('div');
        wrap.className = 'space-y-4';
        wrap.innerHTML = extra;
        box.insertBefore(wrap, box.firstChild);
        if (window.lucide && lucide.createIcons) { try { lucide.createIcons(); } catch (e) {} }
    };
    window.renderPlayerHistory = renderPlayerHistory;

    window.ppSheetToggleComments = function () { showAllComments = !showAllComments; renderPlayerHistory(); };
})();
