// Main Application
class OwnPodApp {
    constructor() {
        this.initialized = false;
    }

    // Initialize application
    async init() {
        try {
            console.log('Initializing OwnPod...');

            // Initialize database
            await podcastDB.init();
            console.log('Database initialized');

            // Initialize UI
            uiManager.init();
            console.log('UI initialized');

            // Initialize audio player
            audioPlayer.init();
            console.log('Audio player initialized');

            // Initialize download manager
            downloadManager.init();
            console.log('Download manager initialized');

            // Setup add feed form
            this.setupAddFeedForm();

            // Load initial data
            await this.loadInitialData();

            this.initialized = true;
            console.log('OwnPod initialized successfully');

            // Check for install prompt
            this.setupInstallPrompt();

        } catch (error) {
            console.error('Initialization error:', error);
            alert('Fehler beim Starten der App. Bitte Seite neu laden.');
        }
    }

    // Setup add feed form
    setupAddFeedForm() {
        const form = document.getElementById('add-feed-submit');
        const input = document.getElementById('feed-url');

        form.addEventListener('click', async () => {
            const feedUrl = input.value.trim();

            if (!feedUrl) {
                uiManager.showNotification('Bitte eine Feed-URL eingeben', 'error');
                return;
            }

            // Validate URL
            try {
                new URL(feedUrl);
            } catch (e) {
                uiManager.showNotification('Ungültige URL', 'error');
                return;
            }

            await this.addFeed(feedUrl);
            input.value = '';
        });

        // Allow Enter key to submit
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                form.click();
            }
        });
    }

    // Add podcast feed
    async addFeed(feedUrl) {
        let loadingToast = null;

        try {
            // Check if already subscribed
            const existing = await podcastDB.getPodcastByFeedUrl(feedUrl);
            if (existing) {
                uiManager.showNotification('Podcast bereits abonniert', 'error');
                return;
            }

            // Show loading with persistent toast
            loadingToast = uiManager.showPersistentNotification('Lade Feed...');
            console.log('Fetching feed:', feedUrl);

            // Parse feed with timeout
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout: Feed-Abruf dauert zu lange (>30s)')), 30000)
            );

            const feedData = await Promise.race([
                rssParser.parseFeed(feedUrl),
                timeoutPromise
            ]);

            console.log('Feed parsed successfully:', feedData.podcast.title);

            // Add podcast to database
            const podcastId = await podcastDB.addPodcast(feedData.podcast);
            console.log('Podcast added with ID:', podcastId);

            // Add episodes
            const episodes = feedData.episodes.map(ep => ({
                ...ep,
                podcastId: podcastId,
                imageUrl: ep.imageUrl || feedData.podcast.imageUrl
            }));

            await podcastDB.addEpisodes(episodes);
            console.log('Added', episodes.length, 'episodes');

            // Close loading toast
            if (loadingToast) loadingToast.remove();

            uiManager.showNotification(`✓ ${feedData.podcast.title} hinzugefügt (${episodes.length} Episoden)`);
            uiManager.closeModal('add-feed-modal');

            // Refresh podcasts list
            await uiManager.renderPodcastsList();

        } catch (error) {
            console.error('Add feed error:', error);

            // Close loading toast
            if (loadingToast) loadingToast.remove();

            // Show error
            uiManager.showNotification(error.message || 'Unbekannter Fehler beim Laden des Feeds', 'error');
        }
    }

    // Load initial data
    async loadInitialData() {
        await uiManager.renderPodcastsList();
        await uiManager.renderDownloadsList();
    }

    // Setup PWA install prompt
    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Stash the event so it can be triggered later
            deferredPrompt = e;

            // You could show a custom install button here
            console.log('PWA install prompt ready');
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            deferredPrompt = null;
        });
    }

    // Example feeds for testing
    getExampleFeeds() {
        return [
            {
                name: 'Fest & Flauschig',
                url: 'https://feeds.soundcloud.com/users/soundcloud:users:178138865/sounds.rss'
            },
            {
                name: 'Gemischtes Hack',
                url: 'https://feeds.soundcloud.com/users/soundcloud:users:343038962/sounds.rss'
            },
            {
                name: 'Lage der Nation',
                url: 'https://feeds.lagedernation.org/feeds/ldn-mp3.xml'
            }
        ];
    }
}

// Initialize app when DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new OwnPodApp();
        app.init();
    });
} else {
    app = new OwnPodApp();
    app.init();
}

// Make app available globally for debugging
window.ownPodApp = app;
