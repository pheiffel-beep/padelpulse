/* PadelPulse v5.1 : carte de match à partager (WhatsApp…)
 *
 * - Image 1080 × 1350 dessinée dans l'app (hors ligne), d'après la maquette validée :
 *   date, Victoire/Défaite, club, tableau des scores par set, série de victoires,
 *   pied de carte « padelpulse.app · Match noté avec PadelPulse ».
 * - Aperçu avant envoi, avec le prénom à afficher (mémorisé), puis partage du téléphone.
 * - Accès : bouton « Partager » dans la fenêtre après un match et sur chaque carte de match.
 * - Partage : app installée (Capacitor Filesystem + Share), sinon partage du navigateur,
 *   sinon téléchargement de l'image.
 */
(function () {
    const W = 1080, H = 1350;
    const NAME_KEY = 'padelpulse_share_name';
    const C = { bg: '#0B1626', line: '#1E3150', white: '#FFFFFF', dim: '#8FA3BF', soft: '#C9D6E8', terra: '#E8896B', terraFill: '#D97757', logo: '#C4552F' };
    const FB = '"Barlow Condensed", "Arial Narrow", sans-serif';
    const FM = 'Manrope, system-ui, sans-serif';
    const GENERIC = /^(coéquipier|coequipier|partenaire|teamgenoot|partner|adversaires?( ?\d)?|tegenstanders?( ?\d)?)$/i;
    const MONTHS = {
        fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
        nl: ['jan.', 'feb.', 'mrt.', 'apr.', 'mei', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.']
    };

    let current = null; // match affiché dans l'aperçu
    let lastBlob = null;

    function myName() { try { return (localStorage.getItem(NAME_KEY) || '').trim(); } catch (e) { return ''; } }
    function setMyName(v) { try { localStorage.setItem(NAME_KEY, (v || '').trim()); } catch (e) {} }
    function realName(n) { n = (n || '').trim(); return n && !GENERIC.test(n) ? n : ''; }
    function first(n) { return n; }

    function prettyDate(fr) {
        const p = (fr || '').split('/');
        if (p.length !== 3) return fr || '';
        const m = MONTHS[window.PP_LANG === 'nl' ? 'nl' : 'fr'];
        return parseInt(p[0], 10) + ' ' + m[parseInt(p[1], 10) - 1] + ' ' + p[2];
    }
    function parseSets(score) {
        const out = [];
        String(score || '').replace(/(\d+)\s*\/\s*(\d+)/g, function (_, a, b) { out.push([parseInt(a, 10), parseInt(b, 10)]); return _; });
        return out;
    }
    function winStreak(m) {
        if (m.result !== 'VICTOIRE') return 0;
        const list = matches.slice().sort(function (a, b) { return (a.timestamp || 0) - (b.timestamp || 0) || a.id - b.id; });
        const i = list.findIndex(function (x) { return x.id === m.id; });
        if (i === -1) return 0;
        let n = 0;
        for (let k = i; k >= 0 && list[k].result === 'VICTOIRE'; k--) n++;
        return n;
    }
    function streakText(n) {
        if (window.PP_LANG === 'nl') return n + 'e overwinning op rij';
        return n + 'e victoire d’affilée';
    }

    function teamUs(m) {
        const me = myName() || ppL('Moi', 'Ik');
        const p = realName(m.partner);
        return p ? me + ' & ' + p : me;
    }
    function teamThem(m) {
        const parts = String(m.opponents || '').split('&').map(realName).filter(Boolean);
        return parts.length ? parts.join(' & ') : ppL('Adversaires', 'Tegenstanders');
    }

    function fit(ctx, text, font, size, maxW, weight) {
        let s = size;
        ctx.font = weight + ' ' + s + 'px ' + font;
        while (ctx.measureText(text).width > maxW && s > 24) { s -= 2; ctx.font = weight + ' ' + s + 'px ' + font; }
        if (ctx.measureText(text).width > maxW) {
            let t = text;
            while (t.length > 3 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
            return t + '…';
        }
        return text;
    }
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }

    async function loadFonts() {
        if (!document.fonts || !document.fonts.load) return;
        try {
            await Promise.all([
                document.fonts.load('800 120px "Barlow Condensed"'),
                document.fonts.load('700 44px "Barlow Condensed"'),
                document.fonts.load('700 40px Manrope'),
                document.fonts.load('600 30px Manrope')
            ]);
        } catch (e) {}
    }

    function draw(canvas, m) {
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d');
        const P = 72;
        ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
        ctx.textBaseline = 'alphabetic';

        // En-tête : logo + date
        ctx.fillStyle = C.logo; roundRect(ctx, P, P, 72, 72, 18); ctx.fill();
        ctx.fillStyle = C.white; ctx.font = '800 56px ' + FB; ctx.textAlign = 'center'; ctx.fillText('P', P + 36, P + 56);
        ctx.textAlign = 'left'; ctx.font = '800 46px ' + FB; ctx.fillText('PadelPulse', P + 90, P + 52);
        ctx.textAlign = 'right'; ctx.fillStyle = C.soft; ctx.font = '600 28px ' + FM; ctx.fillText(prettyDate(m.date), W - P, P + 48);

        // Résultat + club
        const res = m.result === 'VICTOIRE' ? ppL('VICTOIRE', 'OVERWINNING') : m.result === 'DÉFAITE' ? ppL('DÉFAITE', 'NEDERLAAG') : ppL('MATCH NUL', 'GELIJKSPEL');
        ctx.textAlign = 'left'; ctx.fillStyle = C.terra; ctx.font = '700 46px ' + FB;
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '4px';
        ctx.fillText(res, P, 268);
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
        let y = 268;
        if (m.location) {
            y += 54;
            ctx.fillStyle = C.soft;
            ctx.fillText(fit(ctx, m.location, FM, 34, W - 2 * P, 600), P, y);
        }

        // Tableau des scores
        const sets = parseSets(m.score);
        const top = y + 70, rowH = 210;
        const cellW = sets.length > 3 ? 110 : 130;
        const scoresW = cellW * Math.max(1, sets.length);
        const won = m.result === 'VICTOIRE', lost = m.result === 'DÉFAITE';
        ctx.strokeStyle = C.line; ctx.lineWidth = 2;
        [top, top + rowH, top + 2 * rowH].forEach(function (yy) { ctx.beginPath(); ctx.moveTo(P, yy); ctx.lineTo(W - P, yy); ctx.stroke(); });
        [[teamUs(m), 0, !lost], [teamThem(m), 1, lost]].forEach(function (r) {
            const cy = top + r[1] * rowH + rowH / 2;
            const strong = r[2];
            ctx.fillStyle = strong ? C.white : C.dim;
            ctx.textAlign = 'left';
            ctx.fillText(fit(ctx, r[0], FM, 44, W - 2 * P - scoresW - 30, 700), P, cy + 15);
            sets.forEach(function (s, i) {
                const v = s[r[1]], o = s[1 - r[1]];
                ctx.fillStyle = v > o ? C.white : C.dim;
                ctx.font = '800 120px ' + FB; ctx.textAlign = 'center';
                ctx.fillText(String(v), W - P - scoresW + cellW * i + cellW / 2, cy + 42);
            });
        });

        // Série de victoires
        const st = winStreak(m);
        if (st >= 2) {
            const t = streakText(st);
            ctx.font = '800 30px ' + FM;
            const w = ctx.measureText(t).width + 64;
            const py = top + 2 * rowH + 44;
            ctx.fillStyle = C.terraFill; roundRect(ctx, P, py, w, 66, 33); ctx.fill();
            ctx.fillStyle = C.bg; ctx.textAlign = 'left'; ctx.fillText(t, P + 32, py + 44);
        }

        // Pied de carte
        ctx.textAlign = 'left'; ctx.fillStyle = C.terra; ctx.font = '800 54px ' + FB; ctx.fillText('padelpulse.app', P, H - 64);
        ctx.textAlign = 'right'; ctx.fillStyle = C.dim; ctx.font = '600 26px ' + FM;
        ctx.fillText(ppL('Match noté avec PadelPulse', 'Match bijgehouden met PadelPulse'), W - P, H - 74);
    }

    // ----- Aperçu -----
    function buildModal() {
        if (document.getElementById('pp-share-modal')) return;
        const m = document.createElement('div');
        m.id = 'pp-share-modal';
        m.className = 'fixed inset-0 z-[75] flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm';
        m.style.display = 'none';
        m.addEventListener('click', function (e) { if (e.target === m) closeShare(); });
        m.innerHTML = '<div class="card-bg w-full max-w-[420px] rounded-t-3xl sm:rounded-3xl border border-padel-border p-4 pb-6 space-y-3 shadow-2xl max-h-[92vh] overflow-y-auto">' +
            '<div class="flex justify-between items-center"><h3 class="font-extrabold text-sm text-padel-navy">' + ppL('Partager le match', 'Match delen') + '</h3>' +
            '<button type="button" id="pp-share-x" class="w-9 h-9 rounded-full input-bg text-padel-muted flex items-center justify-center" aria-label="' + ppL('Fermer', 'Sluiten') + '">' + PP_X_SVG + '</button></div>' +
            '<canvas id="pp-share-canvas" style="width:100%;height:auto;border-radius:14px;display:block"></canvas>' +
            '<div><label for="pp-share-name" class="block text-[11px] font-semibold text-padel-muted mb-1">' + ppL('Ton prénom sur la carte', 'Je voornaam op de kaart') + '</label>' +
            '<input id="pp-share-name" type="text" autocomplete="given-name" class="w-full box-border input-bg border border-padel-border rounded-xl p-2 text-padel-navy focus:outline-none" style="font-size:16px" placeholder="' + ppL('Ex. : Phil (sinon « Moi »)', 'Bv.: Phil (anders « Ik »)') + '"></div>' +
            '<p id="pp-share-msg" class="text-[12px] text-padel-muted text-center" style="display:none"></p>' +
            '<button type="button" id="pp-share-go" class="w-full bg-padel-terracotta text-white font-extrabold py-3 rounded-xl text-[14px]">' + ppL('Partager (WhatsApp…)', 'Delen (WhatsApp…)') + '</button>' +
            '</div>';
        document.body.appendChild(m);
        document.getElementById('pp-share-x').onclick = closeShare;
        const inp = document.getElementById('pp-share-name');
        inp.addEventListener('input', function () { setMyName(inp.value); redraw(); });
        document.getElementById('pp-share-go').onclick = doShare;
    }
    function closeShare() { const m = document.getElementById('pp-share-modal'); if (m) m.style.display = 'none'; }
    function redraw() { if (current) draw(document.getElementById('pp-share-canvas'), current); }
    function msg(t) { const p = document.getElementById('pp-share-msg'); if (!p) return; p.textContent = t || ''; p.style.display = t ? 'block' : 'none'; }

    async function openShare(id) {
        const m = matches.find(function (x) { return x.id === id; });
        if (!m) return;
        current = m;
        buildModal();
        document.getElementById('pp-share-name').value = myName();
        msg('');
        document.getElementById('pp-share-modal').style.display = 'flex';
        await loadFonts();
        redraw();
    }

    function toBlob(canvas) {
        return new Promise(function (res) {
            if (canvas.toBlob) canvas.toBlob(function (b) { res(b); }, 'image/png');
            else res(null);
        });
    }
    function fileName() {
        const d = (current && current.date ? current.date : '').split('/').reverse().join('-');
        return 'PadelPulse-match' + (d ? '-' + d : '') + '.png';
    }

    async function doShare() {
        if (!current) return;
        const canvas = document.getElementById('pp-share-canvas');
        draw(canvas, current);
        const text = ppL('Match noté avec PadelPulse : padelpulse.app', 'Match bijgehouden met PadelPulse: padelpulse.app');
        msg('');
        try {
            if (ppIsNative() && ppHasPlugin('Filesystem') && ppHasPlugin('Share')) {
                const data = canvas.toDataURL('image/png').split(',')[1];
                const res = await window.Capacitor.Plugins.Filesystem.writeFile({ path: fileName(), data: data, directory: 'CACHE' });
                await window.Capacitor.Plugins.Share.share({ title: 'PadelPulse', text: text, files: [res.uri] });
                return;
            }
            const blob = await toBlob(canvas);
            lastBlob = blob;
            if (blob && window.File && navigator.canShare) {
                const file = new File([blob], fileName(), { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], text: text });
                    return;
                }
            }
            // Dernier recours : télécharger l'image
            const url = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = url; a.download = fileName();
            document.body.appendChild(a); a.click(); a.remove();
            msg(ppL('Image enregistrée : envoie-la depuis ta galerie ou tes téléchargements.', 'Afbeelding opgeslagen: verstuur ze vanuit je galerij of downloads.'));
        } catch (e) {
            if (e && (e.name === 'AbortError' || /cancel/i.test(String(e.message || e)))) return;
            msg(ppL('Le partage n’a pas fonctionné. Réessaie.', 'Delen is niet gelukt. Probeer opnieuw.'));
        }
    }

    // ----- Boutons « Partager » -----
    const SHARE_SVG = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" class="pointer-events-none"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>';

    const _prevFeedback = showResultFeedback;
    showResultFeedback = function (match) {
        _prevFeedback.apply(this, arguments);
        const card = document.getElementById('feedback-card');
        if (!card || !match) return;
        let b = document.getElementById('pp-share-feedback');
        if (b) b.remove();
        b = document.createElement('button');
        b.type = 'button';
        b.id = 'pp-share-feedback';
        b.className = 'w-full flex items-center justify-center gap-2 input-bg border border-padel-border text-padel-navy font-bold py-2.5 rounded-xl text-[13px]';
        b.innerHTML = SHARE_SVG + '<span>' + ppL('Partager le match', 'Match delen') + '</span>';
        b.onclick = function () { openShare(match.id); };
        const cont = card.querySelector('button[onclick*="closeResultFeedbackModal"]');
        card.insertBefore(b, cont);
    };
    window.showResultFeedback = showResultFeedback;

    const _prevCard = renderMatchCard;
    renderMatchCard = function (m) {
        const html = _prevCard.apply(this, arguments);
        if (!m) return html;
        const btn = '<button type="button" onclick="ppShareMatch(' + m.id + ')" title="' + ppL('Partager', 'Delen') + '" aria-label="' + ppL('Partager le match', 'Match delen') + '" class="text-padel-muted hover:text-padel-terracotta p-1">' + SHARE_SVG + '</button>';
        const at = html.search(/<button[^>]*openEditMatchModal\(/);
        if (at !== -1) return html.slice(0, at) + btn + html.slice(at);
        const line = '<div class="flex justify-end pt-0.5">' + btn + '</div>';
        const end = html.lastIndexOf('</div>');
        return end === -1 ? html : html.slice(0, end) + line + html.slice(end);
    };
    window.renderMatchCard = renderMatchCard;
    try { renderMatches(); } catch (e) {}

    window.ppShareMatch = openShare;
    window.ppDrawMatchCard = draw;
})();
