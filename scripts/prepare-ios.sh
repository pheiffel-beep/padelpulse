#!/bin/bash
# À lancer après « npx cap add ios » : règle les paramètres iOS de PadelPulse.
set -e
APP=ios/App/App
PLIST=$APP/Info.plist
PBX=ios/App/App.xcodeproj/project.pbxproj

# Nom affiché sous l'icône
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName PadelPulse" "$PLIST"

# Pas de chiffrement spécifique : évite la question « conformité à l'exportation » à chaque envoi
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Set :ITSAppUsesNonExemptEncryption false" "$PLIST"

# iPhone uniquement (pas d'iPad : évite d'avoir à fournir des captures iPad)
sed -i '' 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' "$PBX"

# Orientation portrait uniquement sur iPhone
/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait" "$PLIST"

# Version affichée et numéro de build
sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = ${APP_VERSION:-5.0.0};/g" "$PBX"
sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*;/CURRENT_PROJECT_VERSION = ${BUILD_NUMBER:-1};/g" "$PBX"

# Icône de l'application (1024 x 1024, sans transparence)
cp ios-assets/AppIcon-1024.png "$APP/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"

echo "Réglages iOS appliqués."
