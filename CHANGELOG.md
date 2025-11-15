# Changelog

## Version 1.1 - Bugfixes & Verbesserungen

### RSS Parser Fixes
- ✅ **Multiple CORS Proxies**: Automatisches Fallback auf 3 verschiedene Proxies
- ✅ **Direkter Fetch**: Versucht zuerst direkten Abruf ohne Proxy
- ✅ **Bessere Namespace-Behandlung**: iTunes-Tags werden korrekt erkannt
- ✅ **Verbesserte Fehlerbehandlung**: Detaillierte Fehlermeldungen mit Debug-Info
- ✅ **Fallback-Werte**: Keine leeren Felder mehr bei fehlenden Metadaten
- ✅ **Feed-Format-Erkennung**: Automatische Erkennung von RSS vs. Atom

### UI Verbesserungen
- ✅ **Toast Notifications**: Schöne animierte Benachrichtigungen statt Alert-Boxen
- ✅ **Console Logging**: Ausführliche Logs für Debugging
- ✅ **Bessere Fehlermeldungen**: Nutzer sehen genau was schiefgelaufen ist

### Bug Fixes
- 🐛 **XML Parsing Error**: Behoben durch bessere Error-Detection
- 🐛 **CORS Probleme**: Durch Multi-Proxy-Ansatz minimiert
- 🐛 **Namespace-Probleme**: iTunes/Media Tags werden korrekt ausgelesen
- 🐛 **Fehlende Metadaten**: Fallback-Werte verhindern leere Einträge

### Dokumentation
- 📚 **FEEDS.md**: Liste mit funktionierenden Test-Feeds
- 📚 **CHANGELOG.md**: Diese Datei
- 📚 **Erweiterte README**: Bessere Troubleshooting-Hilfe

## Version 1.0 - Initial Release

### Features
- ✅ RSS/Atom Feed Parser
- ✅ Podcast Abonnements
- ✅ Audio Player mit Kontrollen
- ✅ Offline Downloads
- ✅ Progressive Web App
- ✅ IndexedDB Speicherung
- ✅ Service Worker
- ✅ Responsive Design

---

## Debug-Modus aktivieren

Öffne die Browser-Console (F12) um detaillierte Logs zu sehen:

```javascript
// Feed-Parsing verfolgen
// Alle Schritte werden in Console ausgegeben

// Storage prüfen
indexedDB.databases().then(console.log)

// Cache prüfen
caches.keys().then(console.log)
```

## Known Issues

### CORS Limitations
- Manche Feeds blockieren alle Cross-Origin Requests
- **Workaround**: Verwende Feeds von podcaster-freundlichen Hosts

### iOS Safari
- Hintergrund-Wiedergabe funktioniert nur begrenzt
- **Workaround**: PWA installieren für bessere Integration

### Service Worker
- Funktioniert nur über HTTPS oder localhost
- **Workaround**: Lokalen Server verwenden (siehe start.sh)

## Geplante Features (v1.2)

- [ ] OPML Import/Export
- [ ] Podcast-Suche/Verzeichnis-Integration
- [ ] Erweiterte Filter (ungehört, favoriten)
- [ ] Playlists
- [ ] Kapitel-Unterstützung (wenn im Feed vorhanden)
- [ ] Bessere Download-Progress-Anzeige
- [ ] Auto-Download neue Episoden
- [ ] Podcast-Kategorien

## Beitragen

Bugs gefunden? Feature-Wünsche?
Öffne ein Issue oder Pull Request!
