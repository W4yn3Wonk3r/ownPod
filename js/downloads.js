// Download Manager
class DownloadManager {
    constructor() {
        this.downloadQueue = [];
        this.isProcessing = false;
    }

    // Initialize download manager
    init() {
        // Listen for messages from Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event.data);
            });
        }

        // Resume incomplete downloads
        this.resumeDownloads();
    }

    // Download episode
    async downloadEpisode(episodeId) {
        try {
            const episode = await podcastDB.getEpisode(episodeId);
            if (!episode) {
                throw new Error('Episode not found');
            }

            // Check if already downloaded or downloading
            const existingDownload = await podcastDB.getDownload(episodeId);
            if (existingDownload) {
                if (existingDownload.status === 'completed') {
                    uiManager.showNotification('Episode bereits heruntergeladen');
                    return;
                } else if (existingDownload.status === 'downloading') {
                    uiManager.showNotification('Episode wird bereits heruntergeladen');
                    return;
                }
            }

            // Add to database
            await podcastDB.addDownload(episodeId, episode.audioUrl);

            // Add to queue
            this.downloadQueue.push({
                episodeId,
                audioUrl: episode.audioUrl
            });

            // Process queue
            this.processQueue();

            // Update UI
            await uiManager.renderDownloadsList();

        } catch (error) {
            console.error('Download error:', error);
            uiManager.showNotification('Fehler beim Download', 'error');
        }
    }

    // Process download queue
    async processQueue() {
        if (this.isProcessing || this.downloadQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.downloadQueue.length > 0) {
            const download = this.downloadQueue[0];

            try {
                await this.performDownload(download);
                this.downloadQueue.shift(); // Remove from queue
            } catch (error) {
                console.error('Download failed:', error);
                await podcastDB.updateDownload(download.episodeId, {
                    status: 'failed',
                    error: error.message
                });
                this.downloadQueue.shift();
            }

            // Update UI
            await uiManager.renderDownloadsList();
        }

        this.isProcessing = false;
    }

    // Perform actual download
    async performDownload(download) {
        const { episodeId, audioUrl } = download;

        // Update status to downloading
        await podcastDB.updateDownload(episodeId, {
            status: 'downloading',
            progress: 0
        });

        // Use Service Worker to download and cache
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                // Send message to Service Worker
                navigator.serviceWorker.controller.postMessage({
                    type: 'DOWNLOAD_AUDIO',
                    url: audioUrl,
                    id: episodeId
                });

                // Wait for Service Worker to complete
                await new Promise((resolve, reject) => {
                    const messageHandler = (event) => {
                        if (event.data.type === 'DOWNLOAD_COMPLETE' && event.data.episodeId === episodeId) {
                            navigator.serviceWorker.removeEventListener('message', messageHandler);
                            resolve();
                        } else if (event.data.type === 'DOWNLOAD_ERROR' && event.data.episodeId === episodeId) {
                            navigator.serviceWorker.removeEventListener('message', messageHandler);
                            reject(new Error(event.data.error));
                        }
                    };

                    navigator.serviceWorker.addEventListener('message', messageHandler);

                    // Timeout after 5 minutes
                    setTimeout(() => {
                        navigator.serviceWorker.removeEventListener('message', messageHandler);
                        reject(new Error('Download timeout'));
                    }, 5 * 60 * 1000);
                });
            } catch (swError) {
                console.warn('Service Worker download failed, trying direct download:', swError);
                // Fallback to direct download if Service Worker fails
                await this.directDownload(audioUrl, episodeId);
            }
        } else {
            // Fallback: Direct download (no caching)
            console.log('Service Worker not available, using direct download');
            await this.directDownload(audioUrl, episodeId);
        }
    }

    // Direct download (fallback)
    async directDownload(url, episodeId) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentLength = response.headers.get('content-length');
        const total = parseInt(contentLength, 10);
        let loaded = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            loaded += value.length;

            // Update progress
            if (total) {
                const progress = (loaded / total) * 100;
                await podcastDB.updateDownload(episodeId, {
                    progress: Math.round(progress)
                });
            }
        }

        // Note: In a real implementation, you'd need to store this blob
        // For now, we just mark as completed
        await podcastDB.updateDownload(episodeId, {
            status: 'completed',
            progress: 100
        });
    }

    // Handle Service Worker messages
    async handleServiceWorkerMessage(data) {
        if (data.type === 'DOWNLOAD_COMPLETE') {
            await podcastDB.updateDownload(data.episodeId, {
                status: 'completed',
                progress: 100
            });

            uiManager.showNotification('Download abgeschlossen');
            await uiManager.renderDownloadsList();

        } else if (data.type === 'DOWNLOAD_ERROR') {
            await podcastDB.updateDownload(data.episodeId, {
                status: 'failed',
                error: data.error
            });

            uiManager.showNotification('Download fehlgeschlagen', 'error');
            await uiManager.renderDownloadsList();
        }
    }

    // Resume incomplete downloads
    async resumeDownloads() {
        try {
            const downloads = await podcastDB.getAllDownloads();
            const pending = downloads.filter(d => d.status === 'pending' || d.status === 'downloading');

            for (const download of pending) {
                this.downloadQueue.push({
                    episodeId: download.episodeId,
                    audioUrl: download.audioUrl
                });
            }

            if (this.downloadQueue.length > 0) {
                this.processQueue();
            }
        } catch (error) {
            console.error('Error resuming downloads:', error);
        }
    }

    // Delete download
    async deleteDownload(episodeId) {
        try {
            const download = await podcastDB.getDownload(episodeId);
            if (!download) return;

            // Remove from cache via Service Worker
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'DELETE_AUDIO',
                    url: download.audioUrl
                });
            }

            // Remove from database
            await podcastDB.deleteDownload(episodeId);

            // Update UI
            await uiManager.renderDownloadsList();

            uiManager.showNotification('Download gelöscht');

        } catch (error) {
            console.error('Error deleting download:', error);
            uiManager.showNotification('Fehler beim Löschen', 'error');
        }
    }

    // Check storage quota
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const percentUsed = (estimate.usage / estimate.quota) * 100;

            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentUsed: percentUsed.toFixed(2),
                usageReadable: this.formatBytes(estimate.usage),
                quotaReadable: this.formatBytes(estimate.quota)
            };
        }

        return null;
    }

    // Helper: Format bytes
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Create global download manager instance
const downloadManager = new DownloadManager();
