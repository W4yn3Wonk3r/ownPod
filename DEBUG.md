# Debug Guide - "Lade Feed..." hängt

## Problem diagnostizieren

### Schritt 1: Browser Console öffnen
1. Drücke **F12** (oder Rechtsklick > Inspect)
2. Wechsel zum **Console** Tab
3. Versuche Feed hinzuzufügen
4. Beobachte die Ausgabe

### Erwartete Console-Ausgabe (ERFOLG):
```
Fetching feed: https://example.com/feed.xml
Trying direct fetch...
Feed response preview: <?xml version="1.0"...
Detected RSS feed
Podcast added with ID: 1
Added 50 episodes
[INFO] ✓ Podcast Name hinzugefügt (50 Episoden)
```

### Fehlerhafte Ausgabe (PROBLEM):
```
Fetching feed: https://example.com/feed.xml
Trying direct fetch...
Direct fetch failed: Failed to fetch
Trying proxy 1/3: https://api.allorigins.win/raw?url=
[HÄNGT HIER]
```

## Häufige Probleme & Lösungen

### Problem 1: CORS-Proxy blockiert
**Symptom:** Hängt bei "Trying proxy X/3"

**Lösung:**
1. Öffne `test-feed.html` im Browser
2. Teste deinen Feed direkt
3. Schau welcher Proxy funktioniert

**Alternative Feed-URL probieren:**
```
https://feeds.lagedernation.org/feeds/ldn-mp3.xml  ✓ Funktioniert meist
https://www.tagesschau.de/export/podcast/hi/tagesschau/  ✓ Funktioniert meist
```

### Problem 2: Timeout (>30 Sekunden)
**Symptom:** Error: "Timeout: Feed-Abruf dauert zu lange"

**Ursache:** Proxy ist sehr langsam oder offline

**Lösung:**
- Warte kurz und versuche es nochmal
- Feed ist möglicherweise zu groß
- Andere Feed-URL probieren

### Problem 3: XML Parse Error
**Symptom:** "XML konnte nicht geparst werden"

**Ursache:** Feed ist kein gültiges RSS/Atom XML

**Lösung:**
- Prüfe Feed-URL (muss .xml oder .rss enden)
- Teste Feed in externem Validator: https://validator.w3.org/feed/

### Problem 4: Feed-URL nicht erreichbar
**Symptom:** "HTTP 404" oder "Failed to fetch"

**Ursache:** Feed existiert nicht mehr

**Lösung:**
- Prüfe URL im Browser
- Suche nach aktualisierter Feed-URL

### Problem 5: Netzwerk-Probleme
**Symptom:** Alle Proxies schlagen fehl

**Ursache:** Keine Internetverbindung oder Firewall

**Lösung:**
```bash
# Teste Netzwerk
ping google.com

# Teste ob Proxies erreichbar sind
curl https://api.allorigins.win/
```

## Quick Fix: Test-Feed nutzen

### Feed Tester öffnen:
```
http://localhost:8000/test-feed.html
```

Dieser zeigt dir:
- ✓ Welche Abruf-Methode funktioniert
- ✓ Ob der Feed gültiges XML ist
- ✓ Wie viele Episoden gefunden wurden

## Manual Debug im Code

### Aktiviere ausführliches Logging:

Öffne Browser Console und führe aus:

```javascript
// Aktiviere ausführliches Logging
localStorage.setItem('debug', 'true');

// Reload
location.reload();
```

### Feed manuell testen:

```javascript
// In Browser Console
await rssParser.parseFeed('https://feeds.lagedernation.org/feeds/ldn-mp3.xml')
  .then(data => {
    console.log('✓ Erfolg!', data);
  })
  .catch(error => {
    console.error('✗ Fehler:', error);
  });
```

### Database prüfen:

```javascript
// Podcasts anzeigen
await podcastDB.getAllPodcasts()
  .then(podcasts => console.table(podcasts));

// Database löschen (Reset)
await indexedDB.deleteDatabase('OwnPodDB');
location.reload();
```

## Bekannte funktionierende Feeds

Diese Feeds funktionieren garantiert (Stand Test):

```
✓ Lage der Nation
https://feeds.lagedernation.org/feeds/ldn-mp3.xml

✓ Tagesschau
https://www.tagesschau.de/export/podcast/hi/tagesschau/

✓ Deutschlandfunk
https://www.deutschlandfunk.de/podcast-der-tag.3417.de.podcast.xml
```

## Wenn nichts hilft

### 1. Service Worker zurücksetzen:
```javascript
// In Console:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
location.reload();
```

### 2. Cache leeren:
- Chrome: DevTools > Application > Clear Storage > Clear site data

### 3. Hard Reload:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### 4. Private/Incognito Mode:
- Teste App in Private Browsing Mode
- Schließt Browser-Extension-Konflikte aus

## Support erhalten

Wenn das Problem weiterhin besteht:

1. **Console Log kopieren:**
   - Rechtsklick in Console > Save as...

2. **Feed URL teilen:**
   - Welche URL hast du versucht?

3. **Browser Info:**
   - Welcher Browser? Version?
   - OS (Windows/Mac/Linux)?

4. **Network Tab checken:**
   - DevTools > Network
   - Zeigt genaue HTTP-Requests

## Workaround: Feed lokal testen

```bash
# Feed direkt herunterladen
curl "https://feeds.lagedernation.org/feeds/ldn-mp3.xml" > test-feed.xml

# Im Browser öffnen
# Dann manuell die Daten in der Console verarbeiten
```

---

**Quick Links:**
- Test-Tool: http://localhost:8000/test-feed.html
- Feed-Liste: siehe FEEDS.md
- Changelog: siehe CHANGELOG.md
