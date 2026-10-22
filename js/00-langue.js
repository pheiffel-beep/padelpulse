/* PadelPulse : langue de l'application (français / néerlandais)
 *
 * Fonctionnement :
 * - Le code de l'application reste écrit en français (les données enregistrées aussi).
 * - En néerlandais, chaque texte affiché à l'écran est remplacé par sa traduction
 *   grâce au dictionnaire NL ci-dessous (et à quelques règles pour les textes avec des chiffres).
 * - Pour ajouter ou corriger une traduction : modifier une ligne du dictionnaire.
 * - Au premier lancement, la langue suit celle du téléphone ; ensuite, le choix est mémorisé.
 */
(function () {
    const STORAGE_KEY = 'padelpulse_lang';
    let lang = null;
    try { lang = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (lang !== 'fr' && lang !== 'nl') {
        const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || 'fr').toLowerCase();
        lang = nav.indexOf('nl') === 0 ? 'nl' : 'fr';
    }
    window.PP_LANG = lang;
    window.PP_LOCALE = lang === 'nl' ? 'nl-BE' : 'fr-FR';

    window.setAppLanguage = function (newLang) {
        try { localStorage.setItem(STORAGE_KEY, newLang); } catch (e) {}
        location.reload();
    };
    window.toggleAppLanguage = function () {
        window.setAppLanguage(window.PP_LANG === 'nl' ? 'fr' : 'nl');
    };

    // ---------- Dictionnaire français → néerlandais ----------
    const NL = {
        // En-tête et navigation
        'PadelPulse - Carnet & Stats Padel (v2.3 - Ultra Clean)': 'PadelPulse - Padelboek & statistieken',
        'MON CARNET PADEL': 'MIJN PADELBOEK',
        'Changer de thème': 'Thema wijzigen',
        'Sauvegarde': 'Back-up',
        'Réinitialiser': 'Resetten',
        '+ Match': '+ Match',
        'Accueil': 'Home',
        'Matchs': 'Matchen',
        'Cours': 'Lessen',
        'Matériel': 'Materiaal',
        'Modifier': 'Bewerken',
        'Supprimer': 'Verwijderen',
        'Archiver': 'Archiveren',
        '📦 Archiver': '📦 Archiveren',
        'Annuler': 'Annuleren',
        'Enregistrer': 'Opslaan',
        'Réduire': 'Minder tonen',
        'Voir plus': 'Meer tonen',
        'Voir tout': 'Alles tonen',
        '◀ Précédent': '◀ Vorige',
        'Suivant ▶': 'Volgende ▶',
        "Aujourd'hui": 'Vandaag',

        // Tableau de bord
        'Période :': 'Periode:',
        "Tout l'historique": 'Volledige historiek',
        'Ce mois-ci': 'Deze maand',
        'Cette semaine': 'Deze week',
        'Sauvegarder': 'Back-up maken',
        'Restaurer': 'Terugzetten',
        'Crée un fichier avec tous tes matchs et envoie-le-toi (WhatsApp, mail, Drive…).': 'Maak een bestand met al je matchen en stuur het naar jezelf (WhatsApp, mail, Drive…).',
        'Envoyer ma sauvegarde': 'Mijn back-up versturen',
        'Copier le texte à la place': 'In plaats daarvan de tekst kopiëren',
        'Choisir un fichier de sauvegarde': 'Een back-upbestand kiezen',
        "…ou colle ici le texte d'une sauvegarde": '…of plak hier de tekst van een back-up',
        "Sauvegarde prête : choisis où l'envoyer (WhatsApp, mail, Drive…).": 'Back-up klaar: kies waar je hem naartoe stuurt (WhatsApp, mail, Drive…).',
        "Un mail avec ta sauvegarde va s'ouvrir : envoie-le à toi-même.": 'Er opent een mail met je back-up: stuur hem naar jezelf.',
        'Impossible de lire ce fichier.': 'Dit bestand kan niet gelezen worden.',
        'Bienvenue sur PadelPulse': 'Welkom bij PadelPulse',
        'Ton carnet de padel : tes matchs, tes partenaires, tes cours et ton matériel, au même endroit.': 'Je padelboek: je matchen, partners, lessen en materiaal op één plek.',
        'Un match en 30 secondes': 'Een match in 30 seconden',
        'Touche « + Match », choisis tes joueurs en tapant 2 lettres et entre le score. Tes statistiques se calculent toutes seules.': 'Tik op « + Match », kies je spelers door 2 letters te typen en vul de score in. Je statistieken worden vanzelf berekend.',
        'Tes données restent chez toi': 'Je gegevens blijven bij jou',
        'Tout est enregistré sur ton téléphone. Pense à faire une sauvegarde de temps en temps : ⚙️ Réglages → Sauvegarde.': 'Alles wordt op je telefoon bewaard. Maak af en toe een back-up: ⚙️ Instellingen → Back-up.',
        'Passer': 'Overslaan',
        'Suivant': 'Volgende',
        'Plus tard': 'Later',
        'Ajouter mon premier match': 'Mijn eerste match toevoegen',
        'Revoir la présentation': 'Rondleiding opnieuw bekijken',
        'Adversaires supérieurs': 'Sterkere tegenstanders',
        'Adversaires inférieurs': 'Zwakkere tegenstanders',
        'Niveau à vérifier': 'Niveau te controleren',
        'Niveau constaté': 'Vastgesteld niveau',
        'Note perso (facultatif)': 'Persoonlijke notitie (optioneel)',
        'Ex : joue en dessous de son classement': 'Bv.: speelt onder zijn klassement',
        'Visible uniquement sur ton téléphone.': 'Alleen zichtbaar op je eigen telefoon.',
        'À vérifier': 'Te controleren',
        'Club le plus fréquenté': 'Meest bezochte club',
        'Meilleur club': 'Beste club',
        'Coéquipier le plus fréquent': 'Vaakste partner',
        'Meilleur duo': 'Beste duo',
        '3 matchs minimum': 'Minimum 3 matchen',
        'Effacer': 'Wissen',
        'Adversaire 1': 'Tegenstander 1',
        'Adversaire 2': 'Tegenstander 2',
        'Langue': 'Taal',
        'Thème': 'Thema',
        'Ensemble': 'Samen',
        'Contre': 'Tegen',
        'Amical': 'Vriendschappelijk',
        'Compétition': 'Competitie',
        'En forme': 'In vorm',
        'Normal': 'Normaal',
        'Moyen': 'Gemiddeld',
        'Fatigué': 'Moe',
        'Tie-Break (Points)': 'Tiebreak (punten)',
        'Tape les premières lettres...': 'Typ de eerste letters...',
        'Sauvegarde des données': 'Back-up van je gegevens',
        'Continuer': 'Verder',
        'Le travail paye sur le terrain ! Continue sur cette lancée': 'Hard werken loont op het terrein! Ga zo door',
        'Le travail paye sur le terrain !': 'Hard werken loont op het terrein!',
        "Rien n'a pu vous départager. Place à la revanche !": 'Niets kon jullie scheiden. Tijd voor revanche!',
        'Analyse tes tags tactiques et reviens plus fort': 'Bekijk je tactische tags en kom sterker terug',
        'Retirer ce club de la liste': 'Club uit de lijst verwijderen',
        'Retirer ce coéquipier de la liste': 'Partner uit de lijst verwijderen',
        'Retirer ce joueur des listes': 'Speler uit de lijsten verwijderen',
        'Retirer ce coach de la liste': 'Coach uit de lijst verwijderen',
        'Retirer ce lieu de la liste': 'Locatie uit de lijst verwijderen',
        'Fermer': 'Sluiten',
        'Semaine': 'Week',
        'Mois': 'Maand',
        'Amicaux': 'Vriendschappelijk',
        'Compétitions': 'Competitie',
        'Période': 'Periode',
        'Année en cours': 'Dit jaar',
        'Année précédente': 'Vorig jaar',
        'MATCHS': 'MATCHEN',
        'VICTOIRES': 'OVERWINNINGEN',
        'FORME MOY.': 'GEM. VORM',
        "Rythme d'Activité": 'Activiteit',
        '📆 Semaine': '📆 Week',
        '📅 Mois': '📅 Maand',
        'Semaine en cours': 'Deze week',
        'Match': 'Match',
        'Repos': 'Rust',
        'Récapitulatif & Fréquentation': 'Samenvatting & frequentie',
        'Tendances': 'Trends',
        'Club le + Joué': 'Favoriete club',
        'Coéquipier Favori': 'Favoriete partner',
        'Aucun club': 'Geen club',
        'Aucun': 'Geen',
        'Bilan Joueurs & Ratios': 'Spelersoverzicht',
        'Rechercher nom ou niveau...': 'Zoek naam of niveau...',
        'Tous': 'Alle',
        '🔍 Tous': '🔍 Alle',
        'Partenaires': 'Partners',
        'Adversaires': 'Tegenstanders',
        'Coéquipier': 'Partner',
        'Adversaire': 'Tegenstander',
        'Aucun joueur enregistré': 'Nog geen spelers',
        'Dernières parties': 'Laatste matchen',

        // Liste des matchs
        'Tous mes matchs enregistrés': 'Al mijn opgeslagen matchen',
        '🎾 Amicaux': '🎾 Vriendschappelijk',
        '🏆 Compétitions': '🏆 Competitie',
        '🎾 Amical': '🎾 Vriendschappelijk',
        '🏆 Compétition': '🏆 Competitie',
        'Aucun match enregistré': 'Nog geen matchen opgeslagen',
        'VICTOIRE': 'GEWONNEN',
        'DÉFAITE': 'VERLOREN',
        'MATCH NUL': 'GELIJKSPEL',

        // Formats de jeu
        'Sets en 6 jeux': 'Sets tot 6 games',
        'Set en 6 jeux compétition': 'Set tot 6 games (competitie)',
        '🏆 Set en 6 jeux compétition': '🏆 Set tot 6 games (competitie)',
        'Sets en 9 jeux': 'Sets tot 9 games',
        'Partie libre': 'Vrije partij',
        'Set Unique': 'Eén set',
        'Super TB': 'Super TB',

        // Humeur, tags
        '⚡ En forme': '⚡ In vorm',
        '👍 Normal': '👍 Normaal',
        '😐 Moyen': '😐 Gemiddeld',
        '🔋 Fatigué': '🔋 Moe',
        'Construction': 'Opbouw',
        'Pression imposée': 'Druk gezet',
        'Subi / Mis en difficulté': 'Onder druk gestaan',
        'Super cohésion': 'Topsamenwerking',
        'Manque de repères binôme': 'Onvoldoende samenspel',
        'Point gagnant': 'Winnend punt',
        'Faute directe': 'Onnodige fout',
        'Match serré / âpre': 'Spannende / harde match',

        // Formulaire de match
        'Saisie Express Match': 'Snelle matchinvoer',
        'Type de Partie': 'Soort match',
        'Date du Match': 'Datum van de match',
        'Raquette Utilisée': 'Gebruikt racket',
        'Raquette Principale': 'Hoofdracket',
        'Raquette de Réserve': 'Reserveracket',
        'Raquette Test': 'Testracket',
        'Lieu / Club (Optionnel)': 'Locatie / club (optioneel)',
        'Lieu / Club': 'Locatie / club',
        'Sélectionner un club...': 'Kies een club...',
        '+ Nouveau club...': '+ Nieuwe club...',
        'Nom du nouveau club': 'Naam van de nieuwe club',
        '🗑 Retirer ce club de la liste': '🗑 Club uit de lijst verwijderen',
        'Position sur le terrain': 'Positie op het terrein',
        'Position : Droite': 'Positie: rechts',
        'Position : Gauche': 'Positie: links',
        'Ton Coéquipier': 'Jouw partner',
        'Partenaire': 'Partner',
        'Sélectionner un coéquipier...': 'Kies een partner...',
        '+ Créer un nouveau partenaire...': '+ Nieuwe partner toevoegen...',
        '+ Nouveau': '+ Nieuw',
        '🗑 Retirer ce coéquipier de la liste': '🗑 Partner uit de lijst verwijderen',
        'Nouveau Coéquipier': 'Nieuwe partner',
        'Prénom & Nom': 'Voornaam & naam',
        'Classement': 'Klassement',
        'Équipe Adverse': 'Tegenstanders',
        'Adversaire 1': 'Tegenstander 1',
        'Adversaire 2': 'Tegenstander 2',
        'Format de jeu': 'Speelformaat',
        'Nous': 'Wij',
        'Eux': 'Zij',
        'Set 1': 'Set 1',
        'Set 2': 'Set 2',
        'Set 3': 'Set 3',
        '⚡ Tie-Break (Points)': '⚡ Tiebreak (punten)',
        'Ex: 7-5 ou 5': 'Bv.: 7-5 of 5',
        'Ex: Julien M.': 'Bv.: Julien M.',
        'Énergie': 'Energie',
        'Performance (/5)': 'Prestatie (/5)',
        'Tags tactiques rapides (Multi-sélection)': 'Snelle tactische tags (meerdere mogelijk)',
        'Sélectionner des tags...': 'Kies tags...',
        'Commentaires personnels (Optionnel)': 'Persoonlijke opmerkingen (optioneel)',
        'Notes sur le match, faits de jeu...': 'Notities over de match, spelmomenten...',
        'Enregistrer le match': 'Match opslaan',

        // Fenêtre de résultat
        'Victoire !': 'Gewonnen!',
        'Victoire': 'Gewonnen',
        'Super Match !': 'Supermatch!',
        'Le travail paye sur le terrain ! Continue sur cette lancée 🔥': 'Hard werken loont op het terrein! Ga zo door 🔥',
        'Le travail paye sur le terrain ! 🔥': 'Hard werken loont op het terrein! 🔥',
        'Match nul': 'Gelijkspel',
        'Match équilibré !': 'Evenwichtige match!',
        "Rien n'a pu vous départager. Place à la revanche ! 🎾": 'Niets kon jullie scheiden. Tijd voor revanche! 🎾',
        'Défaite': 'Verloren',
        'Bien battu !': 'Goed gestreden!',
        'Analyse tes tags tactiques et reviens plus fort 💪': 'Bekijk je tactische tags en kom sterker terug 💪',
        'Continuer 🎾': 'Verder 🎾',

        // Joueurs
        'Modifier le Classement': 'Klassement wijzigen',
        'Nom du joueur': 'Naam van de speler',
        'Nouveau Niveau Padel': 'Nieuw padelniveau',
        '🗑 Retirer ce joueur des listes': '🗑 Speler uit de lijsten verwijderen',

        // Cours
        'Carnet de Cours Privés': 'Cursusboek',
        '+ Cours': '+ Les',
        'Aucun cours privé enregistré': 'Nog geen privélessen opgeslagen',
        'Ajouter / Modifier Cours': 'Les toevoegen / bewerken',
        'Nom du Coach': 'Naam van de coach',
        'Sélectionner un coach...': 'Kies een coach...',
        '+ Nouveau coach...': '+ Nieuwe coach...',
        'Nom du nouveau coach': 'Naam van de nieuwe coach',
        '🗑 Retirer ce coach de la liste': '🗑 Coach uit de lijst verwijderen',
        'Date': 'Datum',
        'Thème Travaillé': 'Geoefend thema',
        'Ex: Bandeja & Placement': 'Bv.: Bandeja & plaatsing',
        'Notes & Consignes (1 par ligne)': 'Notities & tips (1 per regel)',
        'Préparation précoce\nRegard sur la balle': 'Vroege voorbereiding\nOgen op de bal',
        'Enregistrer le cours': 'Les opslaan',
        'Coach non précisé': 'Coach niet opgegeven',
        'Lieu non précisé': 'Locatie niet opgegeven',
        'Thème général': 'Algemeen thema',
        'Remarques et consignes enregistrées.': 'Opmerkingen en tips opgeslagen.',

        // Matériel
        'Raquettes': 'Rackets',
        '+ Raquette': '+ Racket',
        'En service': 'In gebruik',
        'En réserve': 'In reserve',
        'Aucune raquette enregistrée': 'Geen racket opgeslagen',
        'Aucune raquette de réserve': 'Geen reserveracket',
        'Aucune raquette test': 'Geen testracket',
        'Historique de Raquettes': 'Rackethistoriek',
        'Aucune raquette archivée': 'Geen gearchiveerde rackets',
        '↩ Réactiver': '↩ Activeren',
        'Remettre en raquette principale': 'Opnieuw als hoofdracket gebruiken',
        'Ajouter / Modifier Raquette': 'Racket toevoegen / bewerken',
        'Modèle de Raquette': 'Racketmodel',
        'Ex: Babolat Technical Viper': 'Bv.: Babolat Technical Viper',
        "Date d'Acquisition": 'Aankoopdatum',
        "Date d'acquisition": 'Aankoopdatum',
        'Ex: 15/09/2026': 'Bv.: 15/09/2026',
        'Statut': 'Status',
        'Historique (Archivée)': 'Historiek (gearchiveerd)',
        'Enregistrer la raquette': 'Racket opslaan',
        'Récemment': 'Recent',
        'Surgrips': 'Overgrips',
        '+ Surgrip': '+ Overgrip',
        'Surgrip Actuel': 'Huidige overgrip',
        'Aucun surgrip enregistré': 'Geen overgrip opgeslagen',
        'Posé le': 'Gelegd op',
        'Historique des Surgrips': 'Overgriphistoriek',
        'Aucun historique de surgrip': 'Nog geen overgriphistoriek',
        'Poser / Modifier Surgrip': 'Overgrip leggen / bewerken',
        'Modèle du Surgrip': 'Overgripmodel',
        'Ex: Wilson Pro Overgrip': 'Bv.: Wilson Pro Overgrip',
        'Date de Pose': 'Datum gelegd',
        'Valider le surgrip': 'Overgrip opslaan',
        'Chaussures': 'Schoenen',
        '+ Chaussures': '+ Schoenen',
        'Paire Actuelle': 'Huidig paar',
        'Aucune paire enregistrée': 'Geen paar opgeslagen',
        'Acquises le': 'Gekocht op',
        'Historique de Chaussures': 'Schoenenhistoriek',
        'Aucun historique de chaussures': 'Nog geen schoenenhistoriek',
        'Ajouter / Modifier Chaussures': 'Schoenen toevoegen / bewerken',
        'Modèle des Chaussures': 'Schoenmodel',
        'Ex: Asics Gel Padel': 'Bv.: Asics Gel Padel',
        'Valider les chaussures': 'Schoenen opslaan',

        // Réinitialisation
        "Réinitialiser l'application ?": 'App resetten?',
        'Effacera tous les matchs et données matérielles.': 'Alle matchen en materiaalgegevens worden gewist.',
        'Tout effacer': 'Alles wissen',

        // Réglages (v4.1)
        'Réglages': 'Instellingen',
        '⚙️ Réglages': '⚙️ Instellingen',
        '🌐 Langue': '🌐 Taal',
        '🌗 Thème': '🌗 Thema',
        'Clair': 'Licht',
        'Sombre': 'Donker',
        'Auto': 'Auto',
        'Ouvrir ›': 'Openen ›',
        "Réinitialiser l'application": 'App resetten',
        'Aucune sauvegarde pour le moment': 'Nog geen back-up gemaakt',
        "Dernière sauvegarde : aujourd'hui": 'Laatste back-up: vandaag',
        'Dernière sauvegarde : hier': 'Laatste back-up: gisteren',
        'Pense à faire une sauvegarde de tes matchs.': 'Vergeet niet een back-up van je matchen te maken.',
        'Plus tard': 'Later',
        'Sauvegarder': 'Back-up maken',
        // Fiche du jour (v4.2)
        'Rien ce jour-là': 'Niets op deze dag',
        '+ Ajouter un match': '+ Match toevoegen',
        '+ Ajouter un cours': '+ Les toevoegen',
        '🎓 Cours': '🎓 Les',
        // Joueurs (v4.6)
        '🤝 Ensemble': '🤝 Samen',
        '⚔️ Contre': '⚔️ Tegen',
        '🔍 Tape les premières lettres...': '🔍 Typ de eerste letters...',
        'Coéquipier ›': 'Partner ›',
        'Adversaire ›': 'Tegenstander ›',
        // Sauvegarde
        '💾 Sauvegarde des données': '💾 Back-up van je gegevens',
        'Pour sauvegarder : copie, puis colle le texte dans une note ou un mail à toi-même. Pour restaurer : colle ce texte dans la zone ci-dessous, puis appuie sur « Restaurer ».':
            'Back-up maken: kopieer de tekst en plak hem in een notitie of een mail aan jezelf. Terugzetten: plak de tekst in het vak hieronder en tik op « Terugzetten ».',
        'Copier ma sauvegarde': 'Mijn back-up kopiëren',
        'Colle ici une sauvegarde pour la restaurer...': 'Plak hier een back-up om hem terug te zetten...',
        'Restaurer cette sauvegarde': 'Deze back-up terugzetten',
        "Colle d'abord ta sauvegarde dans la zone ci-dessus.": 'Plak eerst je back-up in het vak hierboven.',
        'Attention : tes données actuelles seront remplacées. Appuie à nouveau pour confirmer.': 'Opgelet: je huidige gegevens worden vervangen. Tik nogmaals om te bevestigen.',
        'Cette sauvegarde est vide.': 'Deze back-up is leeg.',
        'Confirmer : remplacer mes données': 'Bevestigen: mijn gegevens vervangen',
        'Copie manuelle : appuie longuement dans la zone, choisis « Tout sélectionner » puis « Copier ».': 'Handmatig kopiëren: hou je vinger in het vak, kies « Alles selecteren » en daarna « Kopiëren ».',
        'Erreur pendant la restauration.': 'Fout tijdens het terugzetten.',
        'Sauvegarde abîmée : restauration annulée, tes données sont intactes.': 'Beschadigde back-up: terugzetten geannuleerd, je gegevens zijn intact.',
        'Sauvegarde copiée. Colle-la dans une note, un mail ou un message à toi-même.': 'Back-up gekopieerd. Plak hem in een notitie, mail of bericht aan jezelf.',
        'Texte invalide : la sauvegarde est incomplète ou abîmée.': 'Ongeldige tekst: de back-up is onvolledig of beschadigd.'
    };

    // ---------- Règles pour les textes qui contiennent des chiffres ou des noms ----------
    const plural = (n, one, many) => (parseInt(n, 10) === 1 ? one : many);
    const vnd = s => s.replace(/(\d+)V/g, '$1W').replace(/(\d+)N/g, '$1G').replace(/(\d+)D\b/g, '$1V');
    const RULES = [
        [/^(\d+) matchs? joués?$/, (m, n) => `${n} ${plural(n, 'match', 'matchen')} gespeeld`],
        [/^(\d+) matchs?$/, (m, n) => `${n} ${plural(n, 'match', 'matchen')}`],
        [/^(\d+) matchs? \((.*)\)$/, (m, n, s) => `${n} ${plural(n, 'match', 'matchen')} (${vnd(s)})`],
        [/^(\d+) affrontements? \((.*)\)$/, (m, n, s) => `${n} ${plural(n, 'confrontatie', 'confrontaties')} (${vnd(s)})`],
        [/^(\d+) parties?$/, (m, n) => `${n} ${plural(n, 'match', 'matchen')}`],
        [/^(\d+) [Ss]éances? ce mois$/, (m, n) => `${n} ${plural(n, 'sessie', 'sessies')} deze maand`],
        [/^(\d+) [Ss]éances?$/, (m, n) => `${n} ${plural(n, 'sessie', 'sessies')}`],
        [/^(\d+) tags? sélectionnés?$/, (m, n) => `${n} ${plural(n, 'tag', 'tags')} geselecteerd`],
        [/^Voir plus \((\d+) de plus\)$/, (m, n) => `Meer tonen (${n} extra)`],
        [/^Voir plus \((\d+)\)$/, (m, n) => `Meer tonen (${n})`],
        [/^Voir tout \((\d+)\)$/, (m, n) => `Alles tonen (${n})`],
        [/^(\d+)% V$/, (m, n) => `${n}% W`],
        [/^Page (\d+) \/ (\d+)$/, (m, a, b) => `Pagina ${a} / ${b}`],
        [/^\+ Ajouter le Set (\d)$/, (m, n) => `+ Set ${n} toevoegen`],
        [/^Pos: (Droite|Gauche)$/, (m, p) => `Pos: ${p === 'Droite' ? 'rechts' : 'links'}`],
        [/^avec (.+) \((Droite|Gauche)\)$/, (m, who, p) => `met ${NL[who] || who} (${p === 'Droite' ? 'rechts' : 'links'})`],
        [/^avec (.+)$/, (m, who) => `met ${NL[who] || who}`],
        [/^vs Adversaires$/, () => 'vs Tegenstanders'],
        [/^Dernière sauvegarde : il y a (\d+) jours$/, (m, n) => `Laatste back-up: ${n} dagen geleden`],
        [/^PadelPulse (v[\d.]+) · Panda Atelier$/, (m, v) => `PadelPulse ${v} · Panda Atelier`],
        [/^Thème : (.*)$/, (m, th) => `Thema: ${NL[th] || th}`],
        [/^(\d\d\/\d\d\/\d{4}) : (.+)$/, (m, d, label) => `${d}: ${NL[label] || label}`]
    ];

    const DONE = new Set(); // textes déjà traduits : ne jamais les retraduire
    function translateText(text) {
        if (!text) return text;
        const trimmed = text.trim();
        if (!trimmed || DONE.has(trimmed)) return text;
        let out = null;
        if (Object.prototype.hasOwnProperty.call(NL, trimmed)) out = NL[trimmed];
        else {
            for (const [re, fn] of RULES) {
                const m = trimmed.match(re);
                if (m) { out = fn.apply(null, m); break; }
            }
        }
        if (out === null || out === trimmed) return text;
        DONE.add(out);
        const start = text.indexOf(trimmed);
        return text.slice(0, start) + out + text.slice(start + trimmed.length);
    }
    window.t = function (fr) { return window.PP_LANG === 'nl' ? translateText(fr) : fr; };

    if (lang !== 'nl') return;

    // ---------- Traduction automatique de l'écran ----------
    const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
    const ATTRS = ['placeholder', 'title', 'aria-label'];

    function translateNode(node) {
        if (node.nodeType === 3) {
            const p = node.parentNode;
            if (p && SKIP[p.nodeName]) return;
            const v = node.nodeValue, nv = translateText(v);
            if (nv !== v) node.nodeValue = nv;
        } else if (node.nodeType === 1) {
            if (SKIP[node.nodeName] && node.nodeName !== 'TEXTAREA') return;
            for (const a of ATTRS) {
                if (node.hasAttribute && node.hasAttribute(a)) {
                    const v = node.getAttribute(a), nv = translateText(v);
                    if (nv !== v) node.setAttribute(a, nv);
                }
            }
            if (node.dataset && node.dataset.nl !== undefined && node.textContent !== node.dataset.nl) node.textContent = node.dataset.nl;
            if (node.nodeName === 'TEXTAREA') return;
            for (let c = node.firstChild; c; c = c.nextSibling) translateNode(c);
        }
    }

    document.documentElement.lang = 'nl';
    document.title = translateText(document.title);
    translateNode(document.body);

    new MutationObserver(function (mutations) {
        for (const mu of mutations) {
            if (mu.type === 'characterData') translateNode(mu.target);
            else if (mu.type === 'attributes') translateNode(mu.target);
            else mu.addedNodes.forEach(translateNode);
        }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
})();
