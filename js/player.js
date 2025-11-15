// Audio Player Manager
class AudioPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.currentEpisode = null;
        this.currentPodcast = null;
        this.sleepTimer = null;
        this.progressInterval = null;

        this.elements = {
            playPauseBtn: document.getElementById('play-pause'),
            miniPlayPauseBtn: document.getElementById('mini-play-pause'),
            skipBackward: document.getElementById('skip-backward'),
            skipForward: document.getElementById('skip-forward'),
            progressBar: document.getElementById('progress-bar'),
            currentTime: document.getElementById('current-time'),
            duration: document.getElementById('duration'),
            playbackSpeed: document.getElementById('playback-speed'),
            playerTitle: document.getElementById('player-title'),
            playerPodcast: document.getElementById('player-podcast'),
            playerArtwork: document.getElementById('player-artwork'),
            miniPlayer: document.getElementById('mini-player'),
            miniTitle: document.getElementById('mini-title'),
            miniPodcast: document.getElementById('mini-podcast'),
            miniArtwork: document.getElementById('mini-artwork'),
            sleepTimerBtn: document.getElementById('sleep-timer')
        };
    }

    // Initialize player
    init() {
        this.setupEventListeners();
        this.setupMediaSession();
        this.loadLastPlayed();
    }

    // Setup event listeners
    setupEventListeners() {
        // Play/Pause buttons
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.miniPlayPauseBtn.addEventListener('click', () => this.togglePlayPause());

        // Skip buttons
        this.elements.skipBackward.addEventListener('click', () => this.skip(-30));
        this.elements.skipForward.addEventListener('click', () => this.skip(30));

        // Progress bar
        this.elements.progressBar.addEventListener('input', (e) => {
            const time = (e.target.value / 100) * this.audio.duration;
            this.audio.currentTime = time;
        });

        // Playback speed
        this.elements.playbackSpeed.addEventListener('change', (e) => {
            this.audio.playbackRate = parseFloat(e.target.value);
        });

        // Sleep timer
        this.elements.sleepTimerBtn.addEventListener('click', () => {
            uiManager.openModal('sleep-timer-modal');
        });

        // Sleep timer buttons
        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const minutes = parseInt(btn.dataset.minutes);
                this.setSleepTimer(minutes);
            });
        });

        document.getElementById('cancel-timer').addEventListener('click', () => {
            this.cancelSleepTimer();
        });

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.onError(e));

        // Save progress periodically
        this.progressInterval = setInterval(() => {
            if (this.currentEpisode && !this.audio.paused) {
                this.saveProgress();
            }
        }, 10000); // Save every 10 seconds
    }

    // Load episode
    async loadEpisode(episodeId) {
        try {
            const episode = await podcastDB.getEpisode(episodeId);
            const podcast = await podcastDB.getPodcast(episode.podcastId);

            this.currentEpisode = episode;
            this.currentPodcast = podcast;

            // Check if downloaded
            const download = await podcastDB.getDownload(episodeId);
            let audioUrl = episode.audioUrl;

            if (download && download.status === 'completed') {
                // Use cached version
                audioUrl = episode.audioUrl; // Service worker will intercept
            }

            this.audio.src = audioUrl;

            // Update UI
            this.updatePlayerUI();

            // Load saved progress
            const progress = await podcastDB.getProgress(episodeId);
            if (progress && progress.currentTime > 0) {
                this.audio.currentTime = progress.currentTime;
            }

            // Auto-play
            this.audio.play().catch(err => {
                console.log('Auto-play prevented:', err);
            });

            // Show mini player
            this.elements.miniPlayer.style.display = 'flex';

        } catch (error) {
            console.error('Error loading episode:', error);
            uiManager.showNotification('Fehler beim Laden der Episode', 'error');
        }
    }

    // Update player UI
    updatePlayerUI() {
        const title = this.currentEpisode.title;
        const podcastName = this.currentPodcast.title;
        const artwork = this.currentEpisode.imageUrl || this.currentPodcast.imageUrl || 'icons/icon.svg';

        // Main player
        this.elements.playerTitle.textContent = title;
        this.elements.playerPodcast.textContent = podcastName;
        this.elements.playerArtwork.src = artwork;
        this.elements.playerArtwork.onerror = () => {
            this.elements.playerArtwork.src = 'icons/icon.svg';
        };

        // Mini player
        this.elements.miniTitle.textContent = title;
        this.elements.miniPodcast.textContent = podcastName;
        this.elements.miniArtwork.src = artwork;
        this.elements.miniArtwork.onerror = () => {
            this.elements.miniArtwork.src = 'icons/icon.svg';
        };

        // Update media session
        this.updateMediaSession();
    }

    // Toggle play/pause
    togglePlayPause() {
        if (this.audio.paused) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
    }

    // Skip forward/backward
    skip(seconds) {
        this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + seconds));
    }

    // Event: Loaded metadata
    onLoadedMetadata() {
        this.elements.duration.textContent = this.formatTime(this.audio.duration);
    }

    // Event: Time update
    onTimeUpdate() {
        const currentTime = this.audio.currentTime;
        const duration = this.audio.duration;

        if (duration) {
            const progress = (currentTime / duration) * 100;
            this.elements.progressBar.value = progress;
            this.elements.currentTime.textContent = this.formatTime(currentTime);
        }
    }

    // Event: Ended
    async onEnded() {
        this.elements.playPauseBtn.textContent = '▶';
        this.elements.miniPlayPauseBtn.textContent = '▶';

        // Mark as completed (save progress at end)
        await this.saveProgress();
    }

    // Event: Play
    onPlay() {
        this.elements.playPauseBtn.textContent = '⏸';
        this.elements.miniPlayPauseBtn.textContent = '⏸';
    }

    // Event: Pause
    onPause() {
        this.elements.playPauseBtn.textContent = '▶';
        this.elements.miniPlayPauseBtn.textContent = '▶';

        // Save progress when pausing
        this.saveProgress();
    }

    // Event: Error
    onError(e) {
        console.error('Audio error:', e);
        uiManager.showNotification('Fehler beim Abspielen', 'error');
    }

    // Save playback progress
    async saveProgress() {
        if (!this.currentEpisode) return;

        try {
            await podcastDB.saveProgress(
                this.currentEpisode.id,
                this.audio.currentTime,
                this.audio.duration
            );
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    // Load last played episode
    async loadLastPlayed() {
        try {
            const recentlyPlayed = await podcastDB.getRecentlyPlayed(1);
            if (recentlyPlayed.length > 0) {
                const progress = recentlyPlayed[0];
                await this.loadEpisode(progress.episodeId);
                this.audio.pause(); // Don't auto-play
            }
        } catch (error) {
            console.log('No recently played episodes');
        }
    }

    // Set sleep timer
    setSleepTimer(minutes) {
        // Cancel existing timer
        this.cancelSleepTimer();

        const milliseconds = minutes * 60 * 1000;
        const endTime = new Date(Date.now() + milliseconds);

        this.sleepTimer = setTimeout(() => {
            this.audio.pause();
            uiManager.showNotification('Sleep Timer abgelaufen');
            this.cancelSleepTimer();
        }, milliseconds);

        // Update UI
        const statusEl = document.getElementById('timer-status');
        const cancelBtn = document.getElementById('cancel-timer');

        statusEl.textContent = `Timer endet um ${endTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        cancelBtn.style.display = 'block';

        uiManager.showNotification(`Sleep Timer auf ${minutes} Minuten gesetzt`);
    }

    // Cancel sleep timer
    cancelSleepTimer() {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = null;

            const statusEl = document.getElementById('timer-status');
            const cancelBtn = document.getElementById('cancel-timer');

            statusEl.textContent = '';
            cancelBtn.style.display = 'none';
        }
    }

    // Setup Media Session API (for lock screen controls)
    setupMediaSession() {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.setActionHandler('play', () => this.audio.play());
            navigator.mediaSession.setActionHandler('pause', () => this.audio.pause());
            navigator.mediaSession.setActionHandler('seekbackward', () => this.skip(-30));
            navigator.mediaSession.setActionHandler('seekforward', () => this.skip(30));
            navigator.mediaSession.setActionHandler('previoustrack', () => this.skip(-30));
            navigator.mediaSession.setActionHandler('nexttrack', () => this.skip(30));
        }
    }

    // Update Media Session metadata
    updateMediaSession() {
        if ('mediaSession' in navigator && this.currentEpisode && this.currentPodcast) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: this.currentEpisode.title,
                artist: this.currentPodcast.title,
                album: this.currentPodcast.title,
                artwork: [
                    {
                        src: this.currentEpisode.imageUrl || this.currentPodcast.imageUrl || 'icons/icon.svg',
                        sizes: '512x512',
                        type: 'image/svg+xml'
                    }
                ]
            });
        }
    }

    // Helper: Format time (seconds to MM:SS)
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Create global audio player instance
const audioPlayer = new AudioPlayer();
