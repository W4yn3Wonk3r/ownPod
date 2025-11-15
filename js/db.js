// IndexedDB Database Manager
class PodcastDB {
    constructor() {
        this.dbName = 'OwnPodDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Podcasts store
                if (!db.objectStoreNames.contains('podcasts')) {
                    const podcastStore = db.createObjectStore('podcasts', { keyPath: 'id', autoIncrement: true });
                    podcastStore.createIndex('feedUrl', 'feedUrl', { unique: true });
                    podcastStore.createIndex('title', 'title', { unique: false });
                }

                // Episodes store
                if (!db.objectStoreNames.contains('episodes')) {
                    const episodeStore = db.createObjectStore('episodes', { keyPath: 'id', autoIncrement: true });
                    episodeStore.createIndex('podcastId', 'podcastId', { unique: false });
                    episodeStore.createIndex('guid', 'guid', { unique: true });
                    episodeStore.createIndex('pubDate', 'pubDate', { unique: false });
                }

                // Downloads store
                if (!db.objectStoreNames.contains('downloads')) {
                    const downloadStore = db.createObjectStore('downloads', { keyPath: 'episodeId' });
                    downloadStore.createIndex('status', 'status', { unique: false });
                }

                // Playback progress store
                if (!db.objectStoreNames.contains('progress')) {
                    const progressStore = db.createObjectStore('progress', { keyPath: 'episodeId' });
                    progressStore.createIndex('lastPlayed', 'lastPlayed', { unique: false });
                }

                console.log('Database setup complete');
            };
        });
    }

    // Generic transaction helper
    async transaction(storeName, mode, operation) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            const request = operation(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Podcast methods
    async addPodcast(podcast) {
        return this.transaction('podcasts', 'readwrite', (store) => {
            return store.add({
                title: podcast.title,
                description: podcast.description,
                feedUrl: podcast.feedUrl,
                imageUrl: podcast.imageUrl,
                author: podcast.author,
                link: podcast.link,
                addedDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        });
    }

    async getPodcast(id) {
        return this.transaction('podcasts', 'readonly', (store) => store.get(id));
    }

    async getPodcastByFeedUrl(feedUrl) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['podcasts'], 'readonly');
            const store = transaction.objectStore('podcasts');
            const index = store.index('feedUrl');
            const request = index.get(feedUrl);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPodcasts() {
        return this.transaction('podcasts', 'readonly', (store) => store.getAll());
    }

    async updatePodcast(id, updates) {
        const podcast = await this.getPodcast(id);
        if (!podcast) throw new Error('Podcast not found');

        return this.transaction('podcasts', 'readwrite', (store) => {
            return store.put({ ...podcast, ...updates, lastUpdated: new Date().toISOString() });
        });
    }

    async deletePodcast(id) {
        // Delete all episodes of this podcast first
        const episodes = await this.getEpisodesByPodcast(id);
        for (const episode of episodes) {
            await this.deleteEpisode(episode.id);
        }
        return this.transaction('podcasts', 'readwrite', (store) => store.delete(id));
    }

    // Episode methods
    async addEpisode(episode) {
        return this.transaction('episodes', 'readwrite', (store) => {
            return store.add({
                podcastId: episode.podcastId,
                guid: episode.guid,
                title: episode.title,
                description: episode.description,
                audioUrl: episode.audioUrl,
                duration: episode.duration,
                pubDate: episode.pubDate,
                imageUrl: episode.imageUrl,
                addedDate: new Date().toISOString()
            });
        });
    }

    async addEpisodes(episodes) {
        const promises = episodes.map(episode =>
            this.addEpisode(episode).catch(err => {
                // Ignore duplicate errors (existing episodes)
                if (!err.message.includes('constraint')) {
                    console.error('Error adding episode:', err);
                }
            })
        );
        return Promise.all(promises);
    }

    async getEpisode(id) {
        return this.transaction('episodes', 'readonly', (store) => store.get(id));
    }

    async getEpisodesByPodcast(podcastId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['episodes'], 'readonly');
            const store = transaction.objectStore('episodes');
            const index = store.index('podcastId');
            const request = index.getAll(podcastId);

            request.onsuccess = () => {
                const episodes = request.result;
                // Sort by publication date (newest first)
                episodes.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                resolve(episodes);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteEpisode(id) {
        // Delete associated download if exists
        await this.deleteDownload(id).catch(() => {});
        // Delete progress
        await this.deleteProgress(id).catch(() => {});
        return this.transaction('episodes', 'readwrite', (store) => store.delete(id));
    }

    // Download methods
    async addDownload(episodeId, audioUrl) {
        return this.transaction('downloads', 'readwrite', (store) => {
            return store.add({
                episodeId,
                audioUrl,
                status: 'pending',
                progress: 0,
                downloadedDate: new Date().toISOString()
            });
        });
    }

    async getDownload(episodeId) {
        return this.transaction('downloads', 'readonly', (store) => store.get(episodeId));
    }

    async getAllDownloads() {
        return this.transaction('downloads', 'readonly', (store) => store.getAll());
    }

    async updateDownload(episodeId, updates) {
        const download = await this.getDownload(episodeId);
        if (!download) throw new Error('Download not found');

        return this.transaction('downloads', 'readwrite', (store) => {
            return store.put({ ...download, ...updates });
        });
    }

    async deleteDownload(episodeId) {
        return this.transaction('downloads', 'readwrite', (store) => store.delete(episodeId));
    }

    // Progress methods
    async saveProgress(episodeId, currentTime, duration) {
        return this.transaction('progress', 'readwrite', (store) => {
            return store.put({
                episodeId,
                currentTime,
                duration,
                lastPlayed: new Date().toISOString()
            });
        });
    }

    async getProgress(episodeId) {
        return this.transaction('progress', 'readonly', (store) => store.get(episodeId));
    }

    async deleteProgress(episodeId) {
        return this.transaction('progress', 'readwrite', (store) => store.delete(episodeId));
    }

    async getRecentlyPlayed(limit = 10) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['progress'], 'readonly');
            const store = transaction.objectStore('progress');
            const index = store.index('lastPlayed');
            const request = index.openCursor(null, 'prev');

            const results = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Create global database instance
const podcastDB = new PodcastDB();
