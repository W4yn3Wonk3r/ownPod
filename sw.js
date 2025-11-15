const CACHE_NAME = 'ownpod-v4';
const AUDIO_CACHE = 'ownpod-audio-v2';

const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './js/app.js',
    './js/db.js',
    './js/rss-parser.js',
    './js/podcast-search.js',
    './js/player.js',
    './js/downloads.js',
    './js/ui.js',
    './manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((err) => console.log('Cache error:', err))
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME && cache !== AUDIO_CACHE) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle audio files separately
    if (request.url.includes('/audio/') || request.headers.get('accept')?.includes('audio')) {
        event.respondWith(handleAudioRequest(request));
        return;
    }

    // Network first for RSS feeds
    if (request.url.includes('/rss') || request.url.includes('.xml')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Cache first for static assets
    event.respondWith(cacheFirst(request));
});

// Cache first strategy
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.log('Fetch failed:', error);
        // Return a fallback if available
        return cache.match('/index.html');
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        return cached || new Response('Offline - no cached version available');
    }
}

// Handle audio requests with range support
async function handleAudioRequest(request) {
    const cache = await caches.open(AUDIO_CACHE);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        console.log('Audio fetch failed:', error);
        return new Response('Audio not available', { status: 404 });
    }
}

// Download audio file (called from main app)
self.addEventListener('message', (event) => {
    if (event.data.type === 'DOWNLOAD_AUDIO') {
        downloadAudio(event.data.url, event.data.id);
    } else if (event.data.type === 'DELETE_AUDIO') {
        deleteAudio(event.data.url);
    }
});

// Download and cache audio
async function downloadAudio(url, episodeId) {
    try {
        console.log('Service Worker: Downloading audio:', url);

        // Try with CORS mode first
        let response = await fetch(url, {
            mode: 'cors',
            credentials: 'omit'
        }).catch(async (corsError) => {
            console.log('CORS fetch failed, trying no-cors mode:', corsError);
            // Fallback to no-cors mode
            return fetch(url, {
                mode: 'no-cors'
            });
        });

        if (!response || (!response.ok && response.type !== 'opaque')) {
            throw new Error(`Fetch failed with status: ${response?.status || 'unknown'}`);
        }

        console.log('Service Worker: Audio fetched, caching...');
        const cache = await caches.open(AUDIO_CACHE);
        await cache.put(url, response.clone());

        console.log('Service Worker: Audio cached successfully');

        // Notify the client
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'DOWNLOAD_COMPLETE',
                episodeId: episodeId,
                url: url
            });
        });
    } catch (error) {
        console.error('Service Worker: Download failed:', error);
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
            client.postMessage({
                type: 'DOWNLOAD_ERROR',
                episodeId: episodeId,
                error: error.message || 'NetworkError when attempting to fetch resource.'
            });
        });
    }
}

// Delete cached audio
async function deleteAudio(url) {
    const cache = await caches.open(AUDIO_CACHE);
    await cache.delete(url);
}
