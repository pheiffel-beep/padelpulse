#!/bin/bash
# Copie les fichiers de l'application web dans le dossier www (lu par Capacitor).
set -e
rm -rf www
mkdir -p www
cp index.html tailwind.js lucide.min.js confetti.min.js www/
cp -R css js fonts www/
echo "Dossier www prêt :"
ls www
