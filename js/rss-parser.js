// RSS Feed Parser
class RSSParser {
    constructor() {
        // Multiple CORS proxy options for better reliability
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        this.currentProxyIndex = 0;
    }

    // Parse RSS feed from URL
    async parseFeed(feedUrl) {
        let lastError = null;

        // Try direct fetch first (in case CORS is not an issue)
        try {
            console.log('Trying direct fetch...');
            return await this.fetchAndParse(feedUrl);
        } catch (error) {
            console.log('Direct fetch failed:', error.message);
            lastError = error;
        }

        // Try each CORS proxy
        for (let i = 0; i < this.corsProxies.length; i++) {
            try {
                const proxy = this.corsProxies[i];
                const url = proxy + encodeURIComponent(feedUrl);
                console.log(`Trying proxy ${i + 1}/${this.corsProxies.length}:`, proxy);
                return await this.fetchAndParse(url);
            } catch (error) {
                console.log(`Proxy ${i + 1} failed:`, error.message);
                lastError = error;
            }
        }

        // All methods failed
        throw new Error(`Alle Feed-Quellen fehlgeschlagen. Letzter Fehler: ${lastError.message}`);
    }

    // Fetch and parse feed
    async fetchAndParse(url) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();

        // Log first 500 chars for debugging
        console.log('Feed response preview:', text.substring(0, 500));

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        // Check for parsing errors
        const parseError = xml.querySelector('parsererror');
        if (parseError) {
            console.error('XML Parse error:', parseError.textContent);
            throw new Error('XML konnte nicht geparst werden. Möglicherweise ist dies kein gültiger RSS/Atom Feed.');
        }

        // Determine feed type (RSS or Atom)
        const isAtom = xml.querySelector('feed');
        const isRSS = xml.querySelector('rss') || xml.querySelector('channel');

        if (isAtom) {
            console.log('Detected Atom feed');
            return this.parseAtomFeed(xml, url);
        } else if (isRSS) {
            console.log('Detected RSS feed');
            return this.parseRSSFeed(xml, url);
        } else {
            throw new Error('Unbekanntes Feed-Format. Bitte RSS oder Atom Feed verwenden.');
        }
    }

    // Parse RSS 2.0 feed
    parseRSSFeed(xml, feedUrl) {
        const channel = xml.querySelector('channel');
        if (!channel) {
            throw new Error('Invalid RSS feed');
        }

        // Extract podcast information
        const podcast = {
            title: this.getElementText(channel, 'title'),
            description: this.getElementText(channel, 'description'),
            imageUrl: this.getImageUrl(channel),
            link: this.getElementText(channel, 'link'),
            author: this.getElementText(channel, 'author') ||
                    this.getElementText(channel, 'managingEditor') ||
                    'Unbekannt',
            feedUrl: feedUrl
        };

        // Extract episodes
        const items = Array.from(xml.querySelectorAll('item'));
        const episodes = items.map(item => this.parseRSSItem(item));

        return { podcast, episodes };
    }

    // Parse Atom feed
    parseAtomFeed(xml, feedUrl) {
        const feed = xml.querySelector('feed');
        if (!feed) {
            throw new Error('Invalid Atom feed');
        }

        // Extract podcast information
        const podcast = {
            title: this.getElementText(feed, 'title'),
            description: this.getElementText(feed, 'subtitle'),
            imageUrl: this.getAtomImageUrl(feed),
            link: feed.querySelector('link')?.getAttribute('href') || '',
            author: this.getElementText(feed, 'author name'),
            feedUrl: feedUrl
        };

        // Extract episodes
        const entries = Array.from(xml.querySelectorAll('entry'));
        const episodes = entries.map(entry => this.parseAtomEntry(entry));

        return { podcast, episodes };
    }

    // Parse RSS item (episode)
    parseRSSItem(item) {
        const enclosure = item.querySelector('enclosure');
        const audioUrl = enclosure?.getAttribute('url') || '';

        // Get description with fallbacks
        const description = this.getElementText(item, 'description') ||
                          this.getElementText(item, 'summary') ||
                          this.getElementText(item, 'content:encoded') ||
                          '';

        // Get duration with fallbacks
        const duration = this.parseDuration(
            this.getElementText(item, 'duration') ||
            this.getElementText(item, 'itunes:duration')
        );

        return {
            guid: this.getElementText(item, 'guid') || audioUrl || Date.now().toString(),
            title: this.getElementText(item, 'title') || 'Unbenannte Episode',
            description: description,
            audioUrl: audioUrl,
            duration: duration,
            pubDate: this.getElementText(item, 'pubDate') || new Date().toISOString(),
            imageUrl: this.getItemImageUrl(item)
        };
    }

    // Parse Atom entry (episode)
    parseAtomEntry(entry) {
        const link = entry.querySelector('link[type*="audio"]');
        const audioUrl = link?.getAttribute('href') || '';

        return {
            guid: this.getElementText(entry, 'id') || audioUrl,
            title: this.getElementText(entry, 'title'),
            description: this.getElementText(entry, 'summary') ||
                        this.getElementText(entry, 'content'),
            audioUrl: audioUrl,
            duration: 0,
            pubDate: this.getElementText(entry, 'published') ||
                     this.getElementText(entry, 'updated'),
            imageUrl: null
        };
    }

    // Helper: Get text content of element (with namespace support)
    getElementText(parent, selector) {
        // Try direct selector first
        let element = parent.querySelector(selector);
        if (element) {
            return element.textContent?.trim() || '';
        }

        // Try without namespace prefix (e.g., "itunes:author" -> "author")
        if (selector.includes(':')) {
            const withoutNs = selector.split(':')[1];
            element = parent.querySelector(withoutNs);
            if (element) {
                return element.textContent?.trim() || '';
            }
        }

        return '';
    }

    // Helper: Get image URL from channel
    getImageUrl(channel) {
        // Try iTunes image first (multiple namespace variations)
        const itunesSelectors = ['itunes\\:image', 'image[href]'];
        for (const selector of itunesSelectors) {
            const image = channel.querySelector(selector);
            if (image) {
                const href = image.getAttribute('href');
                if (href) return href;
            }
        }

        // Try standard image
        const standardImage = channel.querySelector('image url');
        if (standardImage) {
            return standardImage.textContent.trim();
        }

        // Try direct image tag
        const directImage = channel.querySelector('image');
        if (directImage) {
            const url = directImage.querySelector('url');
            if (url) return url.textContent.trim();
        }

        // Try media:thumbnail
        const mediaThumbnail = channel.querySelector('thumbnail');
        if (mediaThumbnail) {
            const url = mediaThumbnail.getAttribute('url');
            if (url) return url;
        }

        return null;
    }

    // Helper: Get image URL from item
    getItemImageUrl(item) {
        // Try iTunes image
        const itunesImage = item.querySelector('image[href]');
        if (itunesImage) {
            const href = itunesImage.getAttribute('href');
            if (href) return href;
        }

        // Try media:thumbnail
        const mediaThumbnail = item.querySelector('thumbnail');
        if (mediaThumbnail) {
            const url = mediaThumbnail.getAttribute('url');
            if (url) return url;
        }

        return null;
    }

    // Helper: Get Atom image URL
    getAtomImageUrl(feed) {
        const image = feed.querySelector('logo, icon');
        return image?.textContent?.trim() || null;
    }

    // Helper: Parse duration (iTunes format: HH:MM:SS or seconds)
    parseDuration(duration) {
        if (!duration) return 0;

        // If it's already in seconds
        if (/^\d+$/.test(duration)) {
            return parseInt(duration, 10);
        }

        // Parse HH:MM:SS or MM:SS
        const parts = duration.split(':').map(p => parseInt(p, 10));
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }

        return 0;
    }

    // Test feed URL without fully parsing
    async testFeed(feedUrl) {
        try {
            const url = this.corsProxy + encodeURIComponent(feedUrl);
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create global RSS parser instance
const rssParser = new RSSParser();
