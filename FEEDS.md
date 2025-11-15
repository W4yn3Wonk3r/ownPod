# Test Podcast Feeds

Hier sind einige bekannte funktionierende Podcast-Feeds zum Testen:

## Deutsche Podcasts

### Nachrichten & Politik
```
Lage der Nation
https://feeds.lagedernation.org/feeds/ldn-mp3.xml

Tagesschau
https://www.tagesschau.de/export/podcast/hi/tagesschau/

Deutschlandfunk - Der Tag
https://www.deutschlandfunk.de/podcast-der-tag.3417.de.podcast.xml
```

### Comedy & Talk
```
Fest & Flauschig
https://feeds.soundcloud.com/users/soundcloud:users:178138865/sounds.rss

Gemischtes Hack
https://feeds.soundcloud.com/users/soundcloud:users:343038962/sounds.rss

Sanft & Sorgfältig
https://feeds.soundcloud.com/users/soundcloud:users:317891214/sounds.rss
```

### Tech & Wissenschaft
```
CRE - Technik, Kultur, Gesellschaft
https://cre.fm/feed/mp3/

Methodisch Inkorrekt
http://minkorrekt.de/feed/m4a/
```

## Internationale Podcasts

### Tech
```
The Daily (NYT)
https://feeds.simplecast.com/54nAGcIl

Reply All
https://feeds.megaphone.fm/replyall
```

## Feed finden

### Podcast Verzeichnisse
- **Apple Podcasts**: Im Browser öffnen → RSS-Link kopieren
- **Spotify**: Keine direkte RSS-Feeds
- **Podcast-Index**: https://podcastindex.org

### Von Website
1. Suche nach "RSS" oder "Feed" Button
2. Rechtsklick → Link kopieren
3. URL endet meist mit `.xml` oder `.rss`

## CORS-Probleme beheben

Falls ein Feed nicht lädt:

1. **Browser-Console öffnen** (F12)
2. **Fehler prüfen**: Steht dort "CORS"?
3. **Alternative Proxies**: Der Parser versucht automatisch mehrere
4. **Direkte Feeds bevorzugen**: Feeds ohne Authentifizierung funktionieren besser

### Feed-URL testen

```javascript
// In Browser-Console:
fetch('FEED_URL_HIER')
  .then(r => r.text())
  .then(t => console.log(t.substring(0, 500)))
```

## Eigene Feeds erstellen

Du kannst auch eigene RSS-Feeds erstellen:

### Mit YouTube
- Kanal-RSS: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- Playlist-RSS: YouTube bietet keine offiziellen Playlist-Feeds

### Mit SoundCloud
- User-Feed: `https://feeds.soundcloud.com/users/soundcloud:users:USER_ID/sounds.rss`
- USER_ID findest du in der URL des Profils

## Troubleshooting

### Feed lädt nicht
- ✅ Prüfe URL (muss mit `http://` oder `https://` beginnen)
- ✅ Teste Feed in anderem Reader (z.B. Feedly.com)
- ✅ Schaue in Browser-Console nach Fehlern

### Keine Episoden sichtbar
- ✅ Prüfe ob Feed `<item>` oder `<entry>` Tags hat
- ✅ Manche Feeds haben nur Text, keine Audio-Enclosures

### Audio spielt nicht
- ✅ Prüfe ob Episode einen `<enclosure>` Tag mit Audio-URL hat
- ✅ Teste Audio-URL direkt im Browser

## Feed-Qualität prüfen

Gute Podcast-Feeds haben:
- ✅ `<enclosure>` mit Audio-URL (MP3, M4A, etc.)
- ✅ `<itunes:image>` oder `<image>` für Artwork
- ✅ `<pubDate>` für Sortierung
- ✅ `<description>` für Episode-Info
- ✅ `<itunes:duration>` für Länge

## Hilfreiche Tools

- **Validator**: https://validator.w3.org/feed/
- **Podcast-Index**: https://podcastindex.org
- **Feed-Test**: https://www.castfeedvalidator.com/

Viel Erfolg beim Podcasts finden! 🎧
