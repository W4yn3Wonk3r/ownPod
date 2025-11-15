# OwnPod - Schnellstart-Anleitung

## Installation & Start

### Methode 1: Automatischer Start (empfohlen)

```bash
cd /home/wayne/ownPod
./start.sh
```

Das Skript erkennt automatisch verfügbare Web-Server (Python, PHP, Node.js) und startet die App.

### Methode 2: Manueller Start

#### Mit Python 3
```bash
python3 -m http.server 8000
```

#### Mit PHP
```bash
php -S localhost:8000
```

#### Mit Node.js
```bash
npx http-server -p 8000
```

### Methode 3: Browser öffnen

Öffne `http://localhost:8000` in deinem Browser.

## Erste Schritte

### 1. Podcast hinzufügen

- Klicke auf das **+** Symbol oben rechts
- Gib eine RSS Feed URL ein

**Test-Feeds:**
```
https://feeds.soundcloud.com/users/soundcloud:users:178138865/sounds.rss
https://feeds.lagedernation.org/feeds/ldn-mp3.xml
```

### 2. Episoden anhören

- Tippe auf den Podcast in der Liste
- Wähle eine Episode
- Klicke "Abspielen"

### 3. Offline-Download

- Öffne eine Episode
- Klicke "Download"
- Die Episode ist nun offline verfügbar

### 4. Als PWA installieren

#### Desktop (Chrome/Edge)
- Klicke auf das Install-Icon in der Adressleiste
- Oder: Menu > "OwnPod installieren"

#### Mobile (Android)
- Menu > "Zum Startbildschirm hinzufügen"

#### Mobile (iOS/Safari)
- Teilen-Button > "Zum Home-Bildschirm"

## Funktionen

### Player
- **Play/Pause**: Wiedergabe steuern
- **Skip ±30s**: Vor-/Zurückspulen
- **Geschwindigkeit**: 0.5x - 2x
- **Sleep Timer**: 5-60 Minuten
- **Fortschritt**: Wird automatisch gespeichert

### Downloads
- Episoden für Offline-Wiedergabe
- Automatische Cache-Verwaltung
- Download-Fortschritt im Downloads-Tab

### Tabs
- **Podcasts**: Deine Abonnements
- **Player**: Aktuelle Episode
- **Downloads**: Heruntergeladene Episoden

## Troubleshooting

### Service Worker funktioniert nicht
- Stelle sicher, dass du `localhost` oder `https://` verwendest
- Chrome DevTools > Application > Service Workers > "Unregister" und neu laden

### Feeds laden nicht
- Prüfe die CORS-Proxy Verfügbarkeit
- Manche Feeds blockieren externe Anfragen

### Audio spielt nicht
- Prüfe ob die Audio-URL erreichbar ist
- Manche Browser blockieren Auto-Play

### PWA installiert nicht
- Nur über HTTPS oder localhost möglich
- Manifest und Service Worker müssen funktionieren

## Browser-Support

| Browser | Support | Anmerkungen |
|---------|---------|-------------|
| Chrome Desktop | ✅ Voll | Beste Erfahrung |
| Chrome Mobile | ✅ Voll | PWA installierbar |
| Firefox Desktop | ✅ Voll | - |
| Firefox Mobile | ✅ Voll | - |
| Edge | ✅ Voll | - |
| Safari Desktop | ⚠️ Teilweise | Eingeschränkt |
| Safari iOS | ⚠️ Teilweise | Kein Hintergrund-Playback |

## Entwicklung

### Struktur prüfen
```bash
ls -la
```

### Service Worker neu laden
1. Chrome DevTools öffnen (F12)
2. Application Tab
3. Service Workers > Update

### Cache löschen
1. Chrome DevTools > Application
2. Clear storage > Clear site data

### Logs anzeigen
Console in Browser DevTools (F12)

## Nächste Schritte

1. **Podcasts abonnieren**: Füge deine Lieblings-Feeds hinzu
2. **Episoden herunterladen**: Für Offline-Nutzung
3. **PWA installieren**: Für App-ähnliche Erfahrung
4. **Feedback geben**: Melde Bugs oder Feature-Wünsche

## Support

Bei Problemen:
1. Browser-Console auf Fehler prüfen
2. Service Worker Status prüfen
3. Cache löschen und neu laden

Viel Spaß mit OwnPod! 🎧
