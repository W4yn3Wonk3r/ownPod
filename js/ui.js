// UI Manager
class UIManager {
    constructor() {
        this.currentTab = 'subscriptions';
        this.currentPodcastId = null;
        this.modals = {};
    }

    // Get app instance safely
    getApp() {
        console.log('getApp() called, window.ownPodApp:', window.ownPodApp);
        if (!window.ownPodApp) {
            console.error('window.ownPodApp is undefined!');
            throw new Error('App not initialized');
        }
        return window.ownPodApp;
    }

    // Initialize UI
    init() {
        this.setupTabs();
        this.setupModals();
        this.setupAddFeedButtons();
        this.setupSearchTabs();
        this.setupPodcastSearch();
    }

    // Setup tab navigation
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;

                // Update active states
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(`${tab}-tab`).classList.add('active');

                this.currentTab = tab;
            });
        });
    }

    // Setup modals
    setupModals() {
        const modals = document.querySelectorAll('.modal');

        modals.forEach(modal => {
            this.modals[modal.id] = modal;

            // Close button
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(modal.id));
            }

            // Click outside to close
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    }

    // Setup add feed buttons
    setupAddFeedButtons() {
        const addFeedBtn = document.getElementById('add-feed-btn');
        const addFirstFeedBtn = document.getElementById('add-first-feed');

        addFeedBtn?.addEventListener('click', () => this.openModal('add-feed-modal'));
        addFirstFeedBtn?.addEventListener('click', () => this.openModal('add-feed-modal'));
    }

    // Setup search/URL tabs in add feed modal
    setupSearchTabs() {
        const searchTabBtn = document.getElementById('search-tab-btn');
        const urlTabBtn = document.getElementById('url-tab-btn');
        const searchTabContent = document.getElementById('search-tab-content');
        const urlTabContent = document.getElementById('url-tab-content');

        searchTabBtn?.addEventListener('click', () => {
            searchTabBtn.classList.add('active');
            urlTabBtn.classList.remove('active');
            searchTabContent.classList.add('active');
            urlTabContent.classList.remove('active');
        });

        urlTabBtn?.addEventListener('click', () => {
            urlTabBtn.classList.add('active');
            searchTabBtn.classList.remove('active');
            urlTabContent.classList.add('active');
            searchTabContent.classList.remove('active');
        });
    }

    // Setup podcast search functionality
    setupPodcastSearch() {
        const searchBtn = document.getElementById('podcast-search-btn');
        const searchInput = document.getElementById('podcast-search-input');

        searchBtn?.addEventListener('click', () => this.performPodcastSearch());

        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performPodcastSearch();
            }
        });
    }

    // Perform podcast search
    async performPodcastSearch() {
        const searchInput = document.getElementById('podcast-search-input');
        const resultsContainer = document.getElementById('search-results');
        const searchBtn = document.getElementById('podcast-search-btn');
        const searchTerm = searchInput.value.trim();

        console.log('performPodcastSearch called with term:', searchTerm);

        if (!searchTerm) {
            this.showNotification('Bitte einen Suchbegriff eingeben', 'error');
            return;
        }

        try {
            // Disable button and show loading state
            searchBtn.disabled = true;
            searchBtn.textContent = 'Suche...';
            resultsContainer.innerHTML = '<div class="loading">Suche läuft... Bitte warten.</div>';

            console.log('Starting search...');

            // Perform search
            const results = await podcastSearch.searchWithFallback(searchTerm, 20);

            console.log('Search completed, results:', results.length);

            if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="empty-state"><p>Keine Podcasts gefunden</p></div>';
                this.showNotification('Keine Ergebnisse gefunden', 'error');
                return;
            }

            // Render results
            resultsContainer.innerHTML = results.map(podcast => `
                <div class="search-result-item" data-feed-url="${podcast.feedUrl}">
                    <img src="${podcast.imageUrl}"
                         alt="${this.escapeHtml(podcast.title)}"
                         class="search-result-image"
                         onerror="this.src='icons/icon-192.png'">
                    <div class="search-result-info">
                        <h4>${this.escapeHtml(podcast.title)}</h4>
                        <p class="search-result-author">${this.escapeHtml(podcast.author)}</p>
                        <p class="search-result-meta">${podcast.trackCount} Episoden • ${podcast.country}</p>
                    </div>
                    <button class="btn-small btn-primary subscribe-btn" data-feed-url="${podcast.feedUrl}">
                        Abonnieren
                    </button>
                </div>
            `).join('');

            console.log('Results rendered');

            // Add event listeners to subscribe buttons
            resultsContainer.querySelectorAll('.subscribe-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const feedUrl = btn.dataset.feedUrl;

                    console.log('Subscribe button clicked for:', feedUrl);

                    if (!feedUrl) {
                        this.showNotification('Kein Feed-URL verfügbar', 'error');
                        return;
                    }

                    // Call the app's addFeed method
                    try {
                        const app = this.getApp();
                        await app.addFeed(feedUrl);
                    } catch (error) {
                        console.error('Error adding feed:', error);
                        this.showNotification('Fehler: ' + error.message, 'error');
                    }
                });
            });

            this.showNotification(`${results.length} Podcasts gefunden`);

        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Fehler bei der Suche</p>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">${this.escapeHtml(error.message)}</p>
                </div>
            `;
            this.showNotification('Suchfehler: ' + error.message, 'error');
        } finally {
            // Re-enable button
            searchBtn.disabled = false;
            searchBtn.textContent = 'Suchen';
        }
    }

    // Open modal
    openModal(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.add('show');
        }
    }

    // Close modal
    closeModal(modalId) {
        const modal = this.modals[modalId];
        if (modal) {
            modal.classList.remove('show');

            // Clear search results when closing add-feed modal
            if (modalId === 'add-feed-modal') {
                const searchResults = document.getElementById('search-results');
                const searchInput = document.getElementById('podcast-search-input');
                if (searchResults) searchResults.innerHTML = '';
                if (searchInput) searchInput.value = '';
            }
        }
    }

    // Render podcasts list
    async renderPodcastsList() {
        const container = document.getElementById('podcasts-list');
        const podcasts = await podcastDB.getAllPodcasts();

        if (podcasts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Noch keine Podcasts abonniert</p>
                    <button id="add-first-feed" class="btn-primary">Feed hinzufügen</button>
                </div>
            `;
            this.setupAddFeedButtons();
            return;
        }

        container.innerHTML = podcasts.map(podcast => `
            <div class="podcast-item" data-id="${podcast.id}">
                <img src="${podcast.imageUrl || 'icons/icon-192.png'}"
                     alt="${podcast.title}"
                     onerror="this.src='icons/icon-192.png'">
                <div class="podcast-info">
                    <h3>${this.escapeHtml(podcast.title)}</h3>
                    <p>${this.truncate(this.stripHtml(podcast.description), 100)}</p>
                </div>
                <div class="podcast-actions">
                    <button class="btn-small btn-refresh" data-id="${podcast.id}">Aktualisieren</button>
                    <button class="btn-small btn-delete" data-id="${podcast.id}">Löschen</button>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.podcast-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.podcast-actions')) {
                    this.showEpisodes(id);
                }
            });
        });

        container.querySelectorAll('.btn-refresh').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.refreshPodcast(parseInt(btn.dataset.id));
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePodcast(parseInt(btn.dataset.id));
            });
        });
    }

    // Show episodes for a podcast
    async showEpisodes(podcastId) {
        const podcast = await podcastDB.getPodcast(podcastId);
        const episodes = await podcastDB.getEpisodesByPodcast(podcastId);

        const modalTitle = document.getElementById('episode-modal-title');
        const episodesList = document.getElementById('episodes-list');

        modalTitle.textContent = podcast.title;

        if (episodes.length === 0) {
            episodesList.innerHTML = `
                <div class="empty-state">
                    <p>Keine Episoden vorhanden</p>
                </div>
            `;
        } else {
            episodesList.innerHTML = episodes.map(episode => `
                <div class="episode-item" data-id="${episode.id}">
                    <h4>${this.escapeHtml(episode.title)}</h4>
                    <p>${this.formatDate(episode.pubDate)}</p>
                    <p>${this.truncate(this.stripHtml(episode.description), 150)}</p>
                    <div class="episode-actions">
                        <button class="btn-small btn-refresh play-episode" data-id="${episode.id}">Abspielen</button>
                        <button class="btn-small btn-secondary download-episode" data-id="${episode.id}">Download</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners
            episodesList.querySelectorAll('.play-episode').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const episodeId = parseInt(btn.dataset.id);
                    await audioPlayer.loadEpisode(episodeId);
                    this.closeModal('episode-modal');

                    // Switch to player tab
                    document.querySelector('[data-tab="player"]').click();
                });
            });

            episodesList.querySelectorAll('.download-episode').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const episodeId = parseInt(btn.dataset.id);
                    await downloadManager.downloadEpisode(episodeId);
                    this.showNotification('Download gestartet');
                });
            });
        }

        this.openModal('episode-modal');
    }

    // Refresh podcast feed
    async refreshPodcast(podcastId) {
        try {
            const podcast = await podcastDB.getPodcast(podcastId);
            this.showNotification('Aktualisiere Feed...');

            const feedData = await rssParser.parseFeed(podcast.feedUrl);

            // Add new episodes
            const episodes = feedData.episodes.map(ep => ({
                ...ep,
                podcastId: podcastId,
                imageUrl: ep.imageUrl || podcast.imageUrl
            }));

            await podcastDB.addEpisodes(episodes);
            await podcastDB.updatePodcast(podcastId, {});

            this.showNotification('Feed aktualisiert');
        } catch (error) {
            this.showNotification('Fehler beim Aktualisieren', 'error');
            console.error('Refresh error:', error);
        }
    }

    // Delete podcast
    async deletePodcast(podcastId) {
        if (!confirm('Möchtest du diesen Podcast wirklich löschen?')) {
            return;
        }

        try {
            await podcastDB.deletePodcast(podcastId);
            await this.renderPodcastsList();
            this.showNotification('Podcast gelöscht');
        } catch (error) {
            this.showNotification('Fehler beim Löschen', 'error');
            console.error('Delete error:', error);
        }
    }

    // Render downloads list
    async renderDownloadsList() {
        const container = document.getElementById('downloads-list');
        const downloads = await podcastDB.getAllDownloads();

        if (downloads.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Keine Downloads vorhanden</p>
                </div>
            `;
            return;
        }

        const downloadItems = await Promise.all(
            downloads.map(async (download) => {
                const episode = await podcastDB.getEpisode(download.episodeId);
                const podcast = await podcastDB.getPodcast(episode.podcastId);

                const isCompleted = download.status === 'completed';

                return `
                    <div class="download-item" data-episode-id="${download.episodeId}">
                        <h4>${this.escapeHtml(episode.title)}</h4>
                        <p>${this.escapeHtml(podcast.title)}</p>
                        <div class="download-progress">
                            <div class="download-progress-bar" style="width: ${download.progress}%"></div>
                        </div>
                        <p>Status: ${isCompleted ? 'Abgeschlossen' : 'Lädt...'}</p>
                        ${isCompleted ? `
                            <div class="download-actions">
                                <button class="btn-small btn-refresh play-download" data-id="${download.episodeId}">Abspielen</button>
                                <button class="btn-small btn-delete delete-download" data-id="${download.episodeId}">Löschen</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            })
        );

        container.innerHTML = downloadItems.join('');

        // Add event listeners for play buttons
        container.querySelectorAll('.play-download').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const episodeId = parseInt(btn.dataset.id);
                await audioPlayer.loadEpisode(episodeId);

                // Switch to player tab
                document.querySelector('[data-tab="player"]').click();
            });
        });

        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-download').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const episodeId = parseInt(btn.dataset.id);

                if (confirm('Download wirklich löschen?')) {
                    await downloadManager.deleteDownload(episodeId);
                    this.showNotification('Download gelöscht');
                }
            });
        });
    }

    // Helper: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper: Strip HTML tags
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    // Helper: Truncate text
    truncate(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    }

    // Helper: Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Heute';
        if (days === 1) return 'Gestern';
        if (days < 7) return `vor ${days} Tagen`;

        return date.toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background-color: ${type === 'error' ? '#e94560' : '#0f3460'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show persistent notification (must be manually removed)
    showPersistentNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message} (persistent)`);

        const toast = document.createElement('div');
        toast.className = 'toast toast-persistent toast-' + type;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            background-color: ${type === 'error' ? '#e94560' : '#0f3460'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            animation: slideUp 0.3s ease-out;
        `;

        document.body.appendChild(toast);

        // Return element so it can be removed manually
        return toast;
    }
}

// Create global UI manager instance
const uiManager = new UIManager();
