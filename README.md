# OwnPod - Dein persönlicher Podcast Player

Ein moderner, browser-basierter Podcast Player mit Offline-Funktionalität, gebaut als Progressive Web App (PWA).

## Features

- **RSS Feed Verwaltung**: Abonniere deine Lieblings-Podcasts über RSS/Atom Feeds
- **Offline Downloads**: Lade Episoden herunter und höre sie offline
- **Erweiterte Wiedergabe**:
  - Geschwindigkeitsanpassung (0.5x - 2x)
  - Skip-Buttons (±30 Sekunden)
  - Sleep Timer
  - Automatische Fortschritts-Speicherung
- **PWA-Funktionalität**: Installierbar auf dem Home-Screen
- **Responsive Design**: Optimiert für Mobile und Desktop
- **Lokale Datenspeicherung**: Alle Daten bleiben auf deinem Gerät (IndexedDB)

## Technologie-Stack

- **Vanilla JavaScript** - Kein Framework, minimale Dependencies
- **IndexedDB** - Lokale Datenbank für Podcasts, Episoden und Fortschritt
- **Service Workers** - Offline-Funktionalität und Caching
- **Web Audio API** - Audio-Wiedergabe mit erweiterten Features
- **Media Session API** - Lock-Screen-Steuerung

## Installation

### Option 1: Lokaler Web-Server

1. Klone oder lade dieses Repository herunter
2. Starte einen lokalen Web-Server im Projekt-Verzeichnis:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (npx)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

3. Öffne `http://localhost:8000` in deinem Browser

### Option 2: Als PWA installieren

1. Öffne die App im Browser (Chrome, Edge, Safari)
2. Klicke auf "Installieren" wenn die PWA-Installation angeboten wird
3. Die App erscheint auf deinem Home-Screen

## Nutzung

### Podcast hinzufügen

1. Klicke auf den "+" Button oben rechts
2. Gib die RSS Feed URL ein (z.B. von deinem Lieblings-Podcast)
3. Die App lädt automatisch alle verfügbaren Episoden

### Beispiel Feeds (Deutsch)

```
Fest & Flauschig: https://feeds.soundcloud.com/users/soundcloud:users:178138865/sounds.rss
Lage der Nation: https://feeds.lagedernation.org/feeds/ldn-mp3.xml
```

### Episode abspielen

1. Tippe auf einen Podcast in der Liste
2. Wähle eine Episode aus
3. Klicke auf "Abspielen"

### Episode herunterladen

1. Öffne die Episode-Liste eines Podcasts
2. Klicke auf "Download" bei der gewünschten Episode
3. Die Episode wird im Hintergrund heruntergeladen
4. Heruntergeladene Episoden sind offline verfügbar

### Sleep Timer

1. Gehe zum Player-Tab während eine Episode läuft
2. Klicke auf "Sleep Timer"
3. Wähle die gewünschte Zeit (5-60 Minuten)
4. Die Wiedergabe stoppt automatisch

## Browser-Kompatibilität

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ⚠️ Safari (iOS): Eingeschränkte Hintergrund-Wiedergabe

## Projektstruktur

```
ownPod/
├── index.html              # Haupt-HTML-Datei
├── styles.css             # Styling
├── manifest.json          # PWA Manifest
├── sw.js                  # Service Worker
├── js/
│   ├── app.js            # Haupt-App-Logik
│   ├── db.js             # IndexedDB Manager
│   ├── rss-parser.js     # RSS/Atom Feed Parser
│   ├── player.js         # Audio Player
│   ├── downloads.js      # Download Manager
│   └── ui.js             # UI Manager
└── icons/                # PWA Icons
```

## Entwicklung

### Icons erstellen

Die App benötigt Icons in verschiedenen Größen (72, 96, 128, 144, 152, 192, 384, 512px).

Mit ImageMagick:
```bash
./create-icons.sh
```

Oder erstelle manuell PNG-Dateien im `icons/` Ordner.

### CORS-Proxy

Der RSS Parser verwendet einen CORS-Proxy (`allorigins.win`), um Feeds zu laden.
Für Production solltest du deinen eigenen Proxy verwenden:

```javascript
// In js/rss-parser.js
this.corsProxy = 'https://dein-proxy.com/api?url=';
```

### Service Worker Debugging

Chrome DevTools > Application > Service Workers

Dort kannst du:
- Service Worker neu laden
- Cache-Inhalte inspizieren
- Offline-Modus testen

## Bekannte Einschränkungen

1. **iOS Safari**: Hintergrund-Wiedergabe funktioniert nur begrenzt
2. **CORS**: Einige Podcast-Feeds blockieren Cross-Origin Requests
3. **Speicherplatz**: Browser-Quotas variieren (meistens 50% verfügbarer Speicher)

## Zukünftige Features

- [ ] Playlist-Funktion
- [ ] Synchronisation über mehrere Geräte (optional mit Backend)
- [ ] Podcast-Suche/Verzeichnis
- [ ] Kapitel-Unterstützung
- [ ] Erweiterte Filterfunktionen
- [ ] Import/Export von Abonnements (OPML)

## Lizenz

MIT License - Frei verwendbar für private und kommerzielle Projekte

## Beitragen

Pull Requests sind willkommen! Für größere Änderungen bitte zuerst ein Issue öffnen.

## Support

Bei Fragen oder Problemen erstelle bitte ein Issue im Repository.

---

**Hinweis**: Dies ist eine offline-first PWA. Alle deine Podcast-Abonnements und Downloads bleiben lokal auf deinem Gerät gespeichert.
