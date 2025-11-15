// Podcast Search API (iTunes)
class PodcastSearch {
    constructor() {
        this.baseUrl = 'https://itunes.apple.com/search';
        // Use CORS proxy for HTTP connections (mobile devices on local network)
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://api.codetabs.com/v1/proxy?quest='
        ];
        this.currentProxyIndex = -1; // -1 means no proxy (direct)
    }

    // Build search URL with or without proxy
    buildSearchUrl(params, useProxy = false) {
        const url = `${this.baseUrl}?${params}`;

        if (!useProxy || this.currentProxyIndex === -1) {
            return url;
        }

        const proxy = this.corsProxies[this.currentProxyIndex];
        return `${proxy}${encodeURIComponent(url)}`;
    }

    // Search for podcasts by term
    async search(term, limit = 20) {
        if (!term || term.trim().length === 0) {
            throw new Error('Suchbegriff darf nicht leer sein');
        }

        const params = new URLSearchParams({
            term: term.trim(),
            media: 'podcast',
            entity: 'podcast',
            limit: limit,
            country: 'DE' // German podcasts preferred
        });

        console.log('Searching for podcasts:', term);

        try {
            // Try direct connection first
            let response;
            let data;

            try {
                console.log('Trying direct connection to iTunes API...');
                response = await fetch(`${this.baseUrl}?${params}`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                data = await response.json();
                console.log('Direct connection successful, found', data.resultCount, 'results');

            } catch (directError) {
                console.warn('Direct connection failed:', directError.message);
                console.log('Trying with CORS proxy...');

                // Try with CORS proxies
                let lastError = directError;

                for (let i = 0; i < this.corsProxies.length; i++) {
                    this.currentProxyIndex = i;
                    const proxyUrl = this.buildSearchUrl(params, true);

                    try {
                        console.log(`Trying proxy ${i + 1}/${this.corsProxies.length}:`, this.corsProxies[i]);
                        response = await fetch(proxyUrl);

                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }

                        data = await response.json();
                        console.log('Proxy connection successful, found', data.resultCount, 'results');
                        break;

                    } catch (proxyError) {
                        console.warn(`Proxy ${i + 1} failed:`, proxyError.message);
                        lastError = proxyError;

                        if (i === this.corsProxies.length - 1) {
                            throw lastError;
                        }
                    }
                }
            }

            if (!data || !data.results || data.results.length === 0) {
                console.log('No results found');
                return [];
            }

            // Transform iTunes results to our format
            const results = data.results.map(result => ({
                title: result.collectionName || result.trackName,
                author: result.artistName,
                feedUrl: result.feedUrl,
                imageUrl: result.artworkUrl600 || result.artworkUrl100,
                description: result.collectionName || '',
                genres: result.genres || [],
                trackCount: result.trackCount || 0,
                country: result.country,
                itunesId: result.collectionId
            }));

            console.log('Transformed results:', results.length);
            return results;

        } catch (error) {
            console.error('Podcast search error:', error);
            throw new Error('Fehler bei der Suche: ' + error.message);
        }
    }

    // Search with fallback to worldwide if no German results
    async searchWithFallback(term, limit = 20) {
        try {
            // Try German podcasts first
            console.log('Starting search with fallback...');
            let results = await this.search(term, limit);

            if (results.length === 0) {
                // Fallback to worldwide search
                console.log('No German results, searching worldwide...');
                const params = new URLSearchParams({
                    term: term.trim(),
                    media: 'podcast',
                    entity: 'podcast',
                    limit: limit
                    // No country parameter = worldwide
                });

                let response;
                let data;

                try {
                    response = await fetch(`${this.baseUrl}?${params}`);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    data = await response.json();
                } catch (directError) {
                    // Try with proxy
                    console.log('Worldwide search with proxy...');
                    const proxyUrl = this.buildSearchUrl(params, true);
                    response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    data = await response.json();
                }

                results = (data.results || []).map(result => ({
                    title: result.collectionName || result.trackName,
                    author: result.artistName,
                    feedUrl: result.feedUrl,
                    imageUrl: result.artworkUrl600 || result.artworkUrl100,
                    description: result.collectionName || '',
                    genres: result.genres || [],
                    trackCount: result.trackCount || 0,
                    country: result.country,
                    itunesId: result.collectionId
                }));

                console.log('Worldwide search found', results.length, 'results');
            }

            return results;

        } catch (error) {
            console.error('Podcast search with fallback error:', error);
            throw error;
        }
    }

    // Get podcast details by iTunes ID
    async getPodcastById(itunesId) {
        const params = new URLSearchParams({
            id: itunesId,
            entity: 'podcast'
        });

        try {
            const response = await fetch(`https://itunes.apple.com/lookup?${params}`);
            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                throw new Error('Podcast nicht gefunden');
            }

            const result = data.results[0];
            return {
                title: result.collectionName || result.trackName,
                author: result.artistName,
                feedUrl: result.feedUrl,
                imageUrl: result.artworkUrl600 || result.artworkUrl100,
                description: result.collectionName || '',
                genres: result.genres || [],
                trackCount: result.trackCount || 0,
                country: result.country,
                itunesId: result.collectionId
            };

        } catch (error) {
            console.error('Get podcast by ID error:', error);
            throw new Error('Fehler beim Laden des Podcasts: ' + error.message);
        }
    }
}

// Create global instance
const podcastSearch = new PodcastSearch();
