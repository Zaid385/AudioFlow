/**
 * AudioFlow - Main Frontend Controller
 * Handles SPA navigation, Audio playback, Visualizers, Dynamic UI, and Admin tools.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class PanelResizer {
    constructor() {
        this.isResizing = false;
        this.currentHandle = null;
        this.init();
        this.loadSavedSizes();
    }
    init() {
        const leftHandle = document.getElementById('sidebarResizer');
        const rightHandle = document.getElementById('panelResizer');
        leftHandle === null || leftHandle === void 0 ? void 0 : leftHandle.addEventListener('pointerdown', (e) => this.startResize(e, 'left'));
        rightHandle === null || rightHandle === void 0 ? void 0 : rightHandle.addEventListener('pointerdown', (e) => this.startResize(e, 'right'));
        document.addEventListener('pointermove', (e) => this.resize(e));
        document.addEventListener('pointerup', () => this.stopResize());
    }
    startResize(e, side) {
        this.isResizing = true;
        this.currentHandle = e.currentTarget;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }
    resize(e) {
        if (!this.isResizing || !this.currentHandle)
            return;
        if (this.currentHandle.id === 'sidebarResizer') {
            const width = Math.max(72, Math.min(600, e.clientX));
            document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
            const sidebar = document.querySelector('.sidebar');
            if (width < 160) {
                sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.add('collapsed');
            }
            else {
                sidebar === null || sidebar === void 0 ? void 0 : sidebar.classList.remove('collapsed');
            }
        }
        else {
            const width = Math.max(200, Math.min(500, window.innerWidth - e.clientX));
            document.documentElement.style.setProperty('--right-panel-width', `${width}px`);
        }
    }
    stopResize() {
        if (!this.isResizing)
            return;
        this.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.saveSizes();
    }
    saveSizes() {
        const left = document.documentElement.style.getPropertyValue('--sidebar-width');
        const right = document.documentElement.style.getPropertyValue('--right-panel-width');
        localStorage.setItem('audioflow_sidebar_width', left);
        localStorage.setItem('audioflow_panel_width', right);
    }
    loadSavedSizes() {
        var _a;
        const left = localStorage.getItem('audioflow_sidebar_width');
        const right = localStorage.getItem('audioflow_panel_width');
        if (left) {
            document.documentElement.style.setProperty('--sidebar-width', left);
            if (parseInt(left) < 160)
                (_a = document.querySelector('.sidebar')) === null || _a === void 0 ? void 0 : _a.classList.add('collapsed');
        }
        if (right) {
            document.documentElement.style.setProperty('--right-panel-width', right);
        }
    }
}
class AudioPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTrack = null;
        this.queue = [];
        this.history = [];
        this.volume = 0.7;
        this.likedSongsPlaylistId = null;
        this.userPlaylists = [];
        // Web Audio API
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.animationId = null;
        // Admin selection state
        this.isAdminSelecting = false;
        this.selectedSongIds = new Set();
        this.audio = document.getElementById('mainAudioElement');
        this.setupEventListeners();
        this.setupSPANavigation();
        this.loadState();
        this.initLibrary();
        this.initPageSpecifics();
        this.autoHideAlerts();
        new PanelResizer();
    }
    autoHideAlerts() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => alert.style.display = 'none', 500);
            }, 5000);
        });
    }
    setupSPANavigation() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            const link = target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin) &&
                !link.href.includes('/logout') && !link.target && !link.hasAttribute('download')) {
                e.preventDefault();
                this.navigateTo(link.href);
            }
        });
        window.addEventListener('popstate', () => this.navigateTo(window.location.href, false));
    }
    navigateTo(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, pushState = true) {
            try {
                const response = yield fetch(url);
                const html = yield response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newContent = doc.querySelector('.main-content');
                if (newContent) {
                    document.querySelector('.main-content').innerHTML = newContent.innerHTML;
                    document.title = doc.title;
                    if (pushState)
                        window.history.pushState({}, '', url);
                    this.initPageSpecifics();
                    this.autoHideAlerts();
                    document.querySelector('.main-view').scrollTo(0, 0);
                }
            }
            catch (err) {
                window.location.href = url;
            }
        });
    }
    initPageSpecifics() {
        this.initAdminDashboard();
        this.highlightActiveCard();
        this.updateLibraryActiveStates();
        this.setupPlaylistPlayAll();
    }
    updateLibraryActiveStates() {
        const path = window.location.pathname;
        document.querySelectorAll('.sidebar-nav a, .library-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('href') === path);
        });
    }
    setupPlaylistPlayAll() {
        const playAllBtn = document.getElementById('playlistPlayAll');
        if (!playAllBtn)
            return;
        playAllBtn.addEventListener('click', () => {
            const songRows = document.querySelectorAll('.playlist-row .play-btn');
            if (songRows.length === 0) {
                this.showToast('Playlist is empty');
                return;
            }
            const allTracks = Array.from(songRows).map(btn => {
                const data = JSON.parse(btn.getAttribute('data-song') || '{}');
                return {
                    id: data.id || data._id,
                    title: data.title,
                    artist: data.artist,
                    albumArt: data.albumArt || data.coverUrl,
                    audioUrl: data.audioUrl
                };
            });
            if (allTracks.length > 0) {
                const first = allTracks[0];
                this.queue = allTracks.slice(1);
                this.playTrack(first);
                this.showToast('Playing playlist');
            }
        });
    }
    setupEventListeners() {
        const playPauseBtn = document.getElementById('playerPlayPauseBtn');
        const prevBtn = document.getElementById('playerPrevBtn');
        const nextBtn = document.getElementById('playerNextBtn');
        const progressBarContainer = document.getElementById('progressBarContainer');
        const volumeBarContainer = document.getElementById('volumeBarContainer');
        const createPlaylistBtn = document.getElementById('createPlaylistBtn');
        const confirmCreateBtn = document.getElementById('confirmCreatePlaylist');
        const likeBtn = document.getElementById('playerLikeBtn');
        playPauseBtn === null || playPauseBtn === void 0 ? void 0 : playPauseBtn.addEventListener('click', () => this.togglePlay());
        prevBtn === null || prevBtn === void 0 ? void 0 : prevBtn.addEventListener('click', () => this.playPrevious());
        nextBtn === null || nextBtn === void 0 ? void 0 : nextBtn.addEventListener('click', () => this.playNextInQueue());
        createPlaylistBtn === null || createPlaylistBtn === void 0 ? void 0 : createPlaylistBtn.addEventListener('click', () => document.getElementById('createPlaylistModal').style.display = 'flex');
        confirmCreateBtn === null || confirmCreateBtn === void 0 ? void 0 : confirmCreateBtn.addEventListener('click', () => this.handleCreatePlaylist());
        likeBtn === null || likeBtn === void 0 ? void 0 : likeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.handleHeartClick(); });
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('play', () => { this.isPlaying = true; this.updateUI(); this.startVisualizer(); });
        this.audio.addEventListener('pause', () => { this.isPlaying = false; this.updateUI(); this.stopVisualizer(); });
        this.audio.addEventListener('ended', () => this.playNextInQueue());
        this.audio.addEventListener('error', () => this.showToast('Audio playback failed'));
        progressBarContainer === null || progressBarContainer === void 0 ? void 0 : progressBarContainer.addEventListener('click', (e) => this.seek(e));
        let isDraggingVolume = false;
        const setVol = (e) => {
            const rect = volumeBarContainer.getBoundingClientRect();
            const vol = (e.clientX - rect.left) / rect.width;
            this.volume = Math.max(0, Math.min(1, vol));
            this.audio.volume = this.volume;
            const bar = document.getElementById('volumeBar');
            if (bar)
                bar.style.width = `${this.volume * 100}%`;
            this.saveState();
        };
        volumeBarContainer === null || volumeBarContainer === void 0 ? void 0 : volumeBarContainer.addEventListener('mousedown', (e) => { isDraggingVolume = true; setVol(e); });
        document.addEventListener('mousemove', (e) => { if (isDraggingVolume)
            setVol(e); });
        document.addEventListener('mouseup', () => { isDraggingVolume = false; });
        document.addEventListener('click', (e) => {
            const target = e.target;
            const queueAddBtn = target.closest('.queue-add-btn');
            if (queueAddBtn) {
                e.stopPropagation();
                const data = queueAddBtn.getAttribute('data-song');
                if (data) {
                    const song = JSON.parse(data);
                    this.addToQueue({
                        id: song.id || song._id,
                        title: song.title,
                        artist: song.artist,
                        albumArt: song.coverUrl || song.albumArt,
                        audioUrl: song.audioUrl,
                        genre: song.genre,
                        duration: song.duration,
                        playCount: song.playCount
                    });
                }
                return;
            }
            const playCardBtn = target.closest('.play-btn');
            if (playCardBtn) {
                const data = playCardBtn.getAttribute('data-song');
                if (data) {
                    const song = JSON.parse(data);
                    const grid = target.closest('.song-grid');
                    if (grid) {
                        const allSongs = Array.from(grid.querySelectorAll('.play-btn')).map(btn => JSON.parse(btn.getAttribute('data-song') || '{}'));
                        const currentIndex = allSongs.findIndex(s => (s.id || s._id) === (song.id || song._id));
                        this.queue = allSongs.slice(currentIndex + 1).map(s => ({
                            id: s.id || s._id,
                            title: s.title,
                            artist: s.artist,
                            albumArt: s.coverUrl || s.albumArt,
                            audioUrl: s.audioUrl,
                            genre: s.genre,
                            duration: s.duration,
                            playCount: s.playCount
                        }));
                    }
                    this.playTrack({
                        id: song.id || song._id,
                        title: song.title,
                        artist: song.artist,
                        albumArt: song.coverUrl || song.albumArt,
                        audioUrl: song.audioUrl,
                        genre: song.genre,
                        duration: song.duration,
                        playCount: song.playCount
                    });
                }
                return;
            }
            const suggestion = target.closest('.suggestion-item');
            if (suggestion) {
                if (e.target.closest('.suggestion-queue-btn')) {
                    const data = suggestion.getAttribute('data-song');
                    if (data) {
                        const s = JSON.parse(data);
                        this.addToQueue({
                            id: s.id || s._id,
                            title: s.title,
                            artist: s.artist,
                            albumArt: s.coverUrl || s.albumArt,
                            audioUrl: s.audioUrl,
                            genre: s.genre,
                            duration: s.duration,
                            playCount: s.playCount
                        });
                    }
                    return;
                }
                const data = suggestion.getAttribute('data-song');
                if (data) {
                    const s = JSON.parse(data);
                    this.playTrack({
                        id: s.id || s._id,
                        title: s.title,
                        artist: s.artist,
                        albumArt: s.coverUrl || s.albumArt,
                        audioUrl: s.audioUrl,
                        genre: s.genre,
                        duration: s.duration,
                        playCount: s.playCount
                    });
                }
                document.getElementById('searchSuggestions').style.display = 'none';
                return;
            }
            const addBtn = target.closest('.add-to-playlist-btn');
            if (addBtn) {
                const songId = addBtn.getAttribute('data-song-id');
                if (songId)
                    this.handleSongPlaylistManagement(songId);
                return;
            }
            if (!target.closest('.searchBar') && !target.closest('#searchSuggestions')) {
                document.getElementById('searchSuggestions').style.display = 'none';
            }
        });
        const searchInput = document.querySelector('.searchBar input');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.handleSearch(searchInput), 300);
            });
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.length >= 1)
                    document.getElementById('searchSuggestions').style.display = 'block';
            });
        }
    }
    initLibrary() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchUserPlaylists();
            this.updatePlaylistSidebar();
            if (this.currentTrack)
                this.updateHeartIcon();
        });
    }
    fetchUserPlaylists() {
        return __awaiter(this, void 0, void 0, function* () {
            const token = localStorage.getItem('audioflow_token');
            if (!token)
                return;
            try {
                const res = yield fetch('/api/v1/playlists', { headers: { 'Authorization': `Bearer ${token}` } });
                const json = yield res.json();
                if (json.status === 'success') {
                    this.userPlaylists = json.data.playlists;
                    const liked = this.userPlaylists.find((p) => p.name === 'Liked Songs');
                    if (liked)
                        this.likedSongsPlaylistId = liked._id;
                }
            }
            catch (err) {
                console.error('Fetch playlists error:', err);
            }
        });
    }
    updatePlaylistSidebar() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchUserPlaylists();
            const list = document.getElementById('playlistList');
            if (!list)
                return;
            if (this.userPlaylists.length > 0) {
                document.getElementById('playlistPlaceholder').style.display = 'none';
                list.innerHTML = this.userPlaylists.map((p) => {
                    let coverHtml = '';
                    const songs = p.songs || [];
                    if (songs.length >= 4) {
                        coverHtml = `
                        <div class="playlist-cover grid-4">
                            <img src="${songs[0].coverUrl || songs[0].albumArt || '/images/Your_Library.svg'}">
                            <img src="${songs[1].coverUrl || songs[1].albumArt || '/images/Your_Library.svg'}">
                            <img src="${songs[2].coverUrl || songs[2].albumArt || '/images/Your_Library.svg'}">
                            <img src="${songs[3].coverUrl || songs[3].albumArt || '/images/Your_Library.svg'}">
                        </div>
                    `;
                    }
                    else if (songs.length === 3) {
                        coverHtml = `
                        <div class="playlist-cover grid-3">
                            <img src="${songs[0].coverUrl || songs[0].albumArt || '/images/Your_Library.svg'}">
                            <img src="${songs[1].coverUrl || songs[1].albumArt || '/images/Your_Library.svg'}">
                            <img src="${songs[2].coverUrl || songs[2].albumArt || '/images/Your_Library.svg'}">
                        </div>
                    `;
                    }
                    else if (songs.length === 2) {
                        coverHtml = `
                        <div class="playlist-cover grid-2">
                            <img src="${songs[0].coverUrl || songs[0].albumArt || '/images/Your_Library.svg'}">
                            <img src="${songs[1].coverUrl || songs[1].albumArt || '/images/Your_Library.svg'}">
                        </div>
                    `;
                    }
                    else if (songs.length === 1) {
                        coverHtml = `<div class="playlist-cover single"><img src="${songs[0].coverUrl || songs[0].albumArt || '/images/Your_Library.svg'}"></div>`;
                    }
                    else {
                        coverHtml = `<div class="playlist-cover placeholder"><img src="/images/Your_Library.svg" style="opacity: 0.3; width: 24px;"></div>`;
                    }
                    return `
                    <a href="/playlists/${p._id}" class="library-item">
                        <div class="item-icon">
                            ${coverHtml}
                        </div>
                        <div class="item-info">
                            <div class="item-title">${p.name}</div>
                            <div class="item-subtitle">Playlist • ${songs.length} songs</div>
                        </div>
                    </a>
                `;
                }).join('');
                this.updateLibraryActiveStates();
            }
        });
    }
    handleSearch(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = input.value;
            const box = document.getElementById('searchSuggestions');
            if (!box || query.length < 1) {
                if (box)
                    box.style.display = 'none';
                return;
            }
            try {
                const res = yield fetch(`/api/v1/songs?search=${query}&limit=6`);
                const json = yield res.json();
                if (json.status === 'success') {
                    const songs = json.data.songs;
                    if (songs.length > 0) {
                        box.innerHTML = songs.map((s) => `
                        <div class="suggestion-item" data-song='${JSON.stringify({ _id: s._id, title: s.title, artist: s.artist, albumArt: s.coverUrl || s.albumArt, audioUrl: s.audioUrl, genre: s.genre, duration: s.duration, playCount: s.playCount })}'>
                            <img src="${s.coverUrl || s.albumArt}" onerror="this.src='/images/Your_Library.svg'" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                            <div style="flex: 1; overflow: hidden;"><div style="font-size: 14px; font-weight: bold; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.title}</div><div style="font-size: 12px; color: var(--text-muted);">${s.artist}</div></div>
                            <button class="suggestion-queue-btn" title="Add to Queue" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 8px;">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18 12V9h-2v3h-3v2h3v3h2v-3h3v-2h-3zM4 10H2v2h2v-2zm0-4H2v2h2V6zm0 8H2v2h2v-2zm10-8H6v2h8V6zm0 4H6v2h8v-2zm0 4H6v2h8v-2z"></path></svg>
                            </button>
                        </div>
                    `).join('');
                        box.style.display = 'block';
                    }
                    else {
                        box.innerHTML = '<div style="padding: 16px; color: var(--text-muted); font-size: 14px;">No results found</div>';
                        box.style.display = 'block';
                    }
                }
            }
            catch (err) {
                console.error('Search error:', err);
            }
        });
    }
    handleCreatePlaylist() {
        return __awaiter(this, void 0, void 0, function* () {
            const name = document.getElementById('newPlaylistName').value.trim() || 'My Playlist';
            const token = localStorage.getItem('audioflow_token');
            if (!token)
                return this.showToast('Please log in');
            try {
                const res = yield fetch('/api/v1/playlists', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name })
                });
                if ((yield res.json()).status === 'success') {
                    this.showToast('Playlist created!');
                    document.getElementById('createPlaylistModal').style.display = 'none';
                    document.getElementById('newPlaylistName').value = '';
                    yield this.updatePlaylistSidebar();
                }
            }
            catch (err) {
                this.showToast('Failed to create playlist');
            }
        });
    }
    requireAuth(track) {
        const token = localStorage.getItem('audioflow_token');
        if (!token) {
            const modal = document.getElementById('loginPromptModal');
            const img = document.getElementById('loginPromptArt');
            if (modal) {
                if (track && img) {
                    img.src = track.albumArt;
                    img.style.display = 'block';
                }
                else if (img) {
                    img.style.display = 'none';
                }
                modal.style.display = 'flex';
            }
            else {
                this.showToast('Login to listen to music');
                setTimeout(() => window.location.href = '/login', 1000);
            }
            return false;
        }
        return true;
    }
    addToQueue(track) {
        if (!this.requireAuth(track))
            return;
        this.queue.push(track);
        this.showToast(`"${track.title}" added to queue`);
        this.updateUI();
    }
    playTrack(track) {
        var _a;
        if (!this.requireAuth(track))
            return;
        if (((_a = this.currentTrack) === null || _a === void 0 ? void 0 : _a.id) === track.id) {
            this.togglePlay();
            return;
        }
        if (this.currentTrack) {
            this.history.push(this.currentTrack);
            if (this.history.length > 50)
                this.history.shift();
        }
        this.currentTrack = track;
        this.audio.src = track.audioUrl;
        this.audio.load();
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.updateUI();
            this.updateHeartIcon();
            this.updateGlow();
        }).catch(() => this.showToast('Playback failed'));
        this.saveState();
    }
    playNextInQueue() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.requireAuth())
                return;
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                if (next)
                    this.playTrack(next);
            }
            else {
                yield this.playRandomSong();
            }
        });
    }
    playPrevious() {
        if (!this.requireAuth())
            return;
        if (this.history.length > 0) {
            const prev = this.history.pop();
            if (prev) {
                const current = this.currentTrack;
                this.currentTrack = null;
                this.playTrack(prev);
            }
        }
        else {
            this.audio.currentTime = 0;
            this.audio.play();
        }
    }
    playRandomSong() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!localStorage.getItem('audioflow_token'))
                return;
            try {
                const res = yield fetch('/api/v1/songs?limit=50');
                const json = yield res.json();
                if (json.status === 'success') {
                    const songs = json.data.songs;
                    if (songs.length > 0) {
                        const randomSong = songs[Math.floor(Math.random() * songs.length)];
                        this.playTrack({
                            id: randomSong._id,
                            title: randomSong.title,
                            artist: randomSong.artist,
                            albumArt: randomSong.coverUrl || randomSong.albumArt,
                            audioUrl: randomSong.audioUrl,
                            genre: randomSong.genre,
                            duration: randomSong.duration,
                            playCount: randomSong.playCount
                        });
                    }
                }
            }
            catch (e) {
                this.isPlaying = false;
                this.updateUI();
            }
        });
    }
    togglePlay() {
        if (!this.requireAuth(this.currentTrack || undefined))
            return;
        if (!this.currentTrack)
            return;
        if (this.isPlaying)
            this.audio.pause();
        else
            this.audio.play().catch(console.error);
    }
    updateProgress() {
        if (!this.audio.duration)
            return;
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;
        document.getElementById('currentTime').textContent = this.formatTime(this.audio.currentTime);
    }
    seek(e) {
        const container = document.getElementById('progressBarContainer');
        const rect = container.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (this.audio.duration)
            this.audio.currentTime = pos * this.audio.duration;
    }
    updateGlow() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentTrack || typeof FastAverageColor === 'undefined')
                return;
            const fac = new FastAverageColor();
            try {
                const color = yield fac.getColorAsync(this.currentTrack.albumArt);
                document.documentElement.style.setProperty('--glow-color', color.rgba.replace('1)', '0.6)'));
            }
            catch (e) { }
        });
    }
    startVisualizer() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
        }
        const canvas = document.getElementById('visualizerCanvas');
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        this.analyser.fftSize = 64;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const draw = () => {
            this.animationId = requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillStyle = 'white';
                ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        };
        draw();
    }
    stopVisualizer() { if (this.animationId)
        cancelAnimationFrame(this.animationId); }
    updateUI() {
        var _a;
        if (!this.currentTrack)
            return;
        document.getElementById('playerTrackTitle').textContent = this.currentTrack.title;
        document.getElementById('playerTrackArtist').textContent = this.currentTrack.artist;
        const art = document.getElementById('playerTrackArt');
        if (art) {
            art.src = this.currentTrack.albumArt;
            art.style.display = 'block';
        }
        const playIco = document.getElementById('playIcon');
        const pauseIco = document.getElementById('pauseIcon');
        if (playIco)
            playIco.style.display = this.isPlaying ? 'none' : 'block';
        if (pauseIco)
            pauseIco.style.display = this.isPlaying ? 'block' : 'none';
        const dur = document.getElementById('durationTime');
        if (dur && this.audio.duration)
            dur.textContent = this.formatTime(this.audio.duration);
        const details = document.getElementById('nowPlayingDetails');
        if (details) {
            document.getElementById('rightPanel').classList.add('active');
            details.innerHTML = `
                <div class="now-playing-card">
                    <img src="${this.currentTrack.albumArt}" class="main-art">
                    <div class="right-panel-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px;">
                        <div style="overflow: hidden; flex: 1;">
                            <h2 class="track-title" style="margin: 0;">${this.currentTrack.title}</h2>
                            <p class="track-artist" style="margin: 0; opacity: 0.7;">${this.currentTrack.artist}</p>
                        </div>
                        <button id="sidebarHeartBtn" class="heart-btn" style="background: none; padding: 0; width: auto; height: auto; margin-top: 4px;">
                            <svg id="sidebarHeart" width="24" height="24" viewBox="0 0 16 16" fill="currentColor"><path d="M1.69 2A4.582 4.582 0 0 1 8 2.023 4.583 4.583 0 0 1 14.31 2c1.908 0 3.182 1.534 3.182 3.286 0 1.98-.863 3.357-2.362 4.602l-7.13 5.903-7.13-5.903C.553 8.643-.31 7.266-.31 5.286-.31 3.534.965 2 2.872 2h-1.182z"></path></svg>
                        </button>
                    </div>
                    <canvas id="visualizerCanvas" width="300" height="60"></canvas>
                    <div class="metadata-grid">
                        <div class="meta-item"><span>Genre</span><span>${this.currentTrack.genre || 'Various'}</span></div>
                        <div class="meta-item"><span>Duration</span><span>${this.currentTrack.duration || '--'}</span></div>
                        <div class="meta-item"><span>Plays</span><span>${this.currentTrack.playCount || 0}</span></div>
                    </div>
                    <div class="actions-row">
                        <button class="btn-login add-to-playlist-btn" data-song-id="${this.currentTrack.id}" style="flex: 1;">Add to playlist</button>
                    </div>
                    <div class="queue-section">
                        <h3>Next in Queue</h3>
                        <div id="queueList">
                            ${this.queue.length > 0 ? this.queue.map(q => `
                                <div class="queue-item" onclick="window.player.playFromQueue('${q.id}')">
                                    <img src="${q.albumArt}">
                                    <div class="queue-item-info">
                                        <div class="queue-item-title">${q.title}</div>
                                        <div class="queue-item-artist">${q.artist}</div>
                                    </div>
                                </div>
                            `).join('') : '<p style="color: var(--text-muted); font-size: 12px;">Autoplay is on (random songs)</p>'}
                        </div>
                    </div>
                </div>
            `;
            (_a = document.getElementById('sidebarHeartBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.handleHeartClick());
            this.updateHeartIcon();
            if (this.isPlaying)
                this.startVisualizer();
        }
        this.highlightActiveCard();
    }
    playFromQueue(id) {
        const index = this.queue.findIndex(t => t.id === id);
        if (index !== -1) {
            const track = this.queue[index];
            this.queue.splice(index, 1);
            this.playTrack(track);
        }
    }
    highlightActiveCard() {
        document.querySelectorAll('.song-card, .playlist-row').forEach(card => {
            var _a;
            const cardEl = card;
            const btn = cardEl.querySelector('.play-btn');
            const data = btn === null || btn === void 0 ? void 0 : btn.getAttribute('data-song');
            if (data) {
                const song = JSON.parse(data);
                const isActive = (song.id || song._id) === ((_a = this.currentTrack) === null || _a === void 0 ? void 0 : _a.id);
                cardEl.classList.toggle('active-track', isActive);
                const h3 = cardEl.querySelector('h3, .song-title');
                if (h3)
                    h3.style.color = isActive ? 'var(--spotify-green)' : '';
            }
        });
    }
    updateHeartIcon() {
        if (!this.currentTrack)
            return;
        const isLiked = this.userPlaylists.some(p => p.songs.some((s) => { var _a; return (s._id || s) === ((_a = this.currentTrack) === null || _a === void 0 ? void 0 : _a.id); }));
        document.querySelectorAll('#playerLikeBtn, #sidebarHeart').forEach(h => {
            h.style.color = isLiked ? 'var(--spotify-green)' : 'var(--text-muted)';
        });
    }
    handleHeartClick() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentTrack)
                return;
            this.handleSongPlaylistManagement(this.currentTrack.id);
        });
    }
    handleSongPlaylistManagement(songId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchUserPlaylists();
            const inPlaylists = this.userPlaylists.filter(p => p.songs.some((s) => (s._id || s) === songId));
            const modal = document.getElementById('playlistModal');
            const box = document.getElementById('playlistOptions');
            modal.style.display = 'flex';
            let html = '';
            if (inPlaylists.length > 0) {
                html += `<p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">This song is in:</p>` +
                    inPlaylists.map(p => `<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #333; margin-bottom: 8px; border-radius: 4px;"><span style="font-weight: bold; color: white;">${p.name}</span><button onclick="window.player.removeSongFromPlaylist('${p._id}', '${songId}')" style="background: none; border: none; color: #ff4444; cursor: pointer; font-size: 12px; font-weight: bold;">Remove</button></div>`).join('') +
                    `<hr style="border: 0; border-top: 1px solid #444; margin: 16px 0;">`;
            }
            const notInPlaylists = this.userPlaylists.filter(p => !p.songs.some((s) => (s._id || s) === songId));
            if (notInPlaylists.length > 0) {
                html += `<p style="color: var(--text-muted); font-size: 14px; margin-bottom: 12px;">Add to:</p>` +
                    notInPlaylists.map(p => `<div class="playlist-option" onclick="window.player.addSongToPlaylist('${p._id}', '${songId}')" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 4px; cursor: pointer;"><div style="width: 40px; height: 40px; background: #333; border-radius: 4px; display: flex; align-items: center; justify-content: center;"><img src="/images/Your_Library.svg" width="20" height="20" style="opacity: 0.5;"></div><span style="font-weight: bold; color: white;">${p.name}</span></div>`).join('');
            }
            box.innerHTML = html;
        });
    }
    removeSongFromPlaylist(pid, sid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const t = localStorage.getItem('audioflow_token');
                const res = yield fetch(`/api/v1/playlists/${pid}/remove/${sid}`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` } });
                if ((yield res.json()).status === 'success') {
                    this.showToast('Removed');
                    document.getElementById('playlistModal').style.display = 'none';
                    yield this.initLibrary();
                    if (window.location.pathname.includes(`/playlists/${pid}`))
                        this.navigateTo(window.location.href, false);
                }
            }
            catch (e) { }
        });
    }
    addSongToPlaylist(pid, sid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const t = localStorage.getItem('audioflow_token');
                const res = yield fetch(`/api/v1/playlists/${pid}/add-song/${sid}`, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` } });
                if ((yield res.json()).status === 'success') {
                    this.showToast('Added');
                    document.getElementById('playlistModal').style.display = 'none';
                    yield this.initLibrary();
                }
            }
            catch (e) { }
        });
    }
    formatTime(s) { if (isNaN(s))
        return '0:00'; const m = Math.floor(s / 60); const sc = Math.floor(s % 60); return `${m}:${sc < 10 ? '0' : ''}${sc}`; }
    saveState() { localStorage.setItem('audioflow_player_state', JSON.stringify({ track: this.currentTrack, time: this.audio.currentTime, vol: this.volume })); }
    loadState() {
        const s = localStorage.getItem('audioflow_player_state');
        if (s) {
            const data = JSON.parse(s);
            this.currentTrack = data.track;
            this.volume = data.vol;
            this.audio.volume = this.volume;
            if (document.getElementById('volumeBar'))
                document.getElementById('volumeBar').style.width = `${this.volume * 100}%`;
            if (this.currentTrack) {
                this.audio.src = this.currentTrack.audioUrl;
                this.audio.currentTime = data.time;
                this.updateUI();
            }
        }
    }
    showToast(m) { const t = document.getElementById('globalToast'); if (t) {
        t.textContent = m;
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 3000);
    } }
    /** ADMIN LOGIC **/
    initAdminDashboard() {
        var _a;
        const list = document.getElementById('adminSongList');
        if (!list)
            return;
        this.fetchAdminSongs();
        this.setupAdminUpload();
        this.setupAdminEditDelete();
        this.setupBatchSelection();
        (_a = document.getElementById('refreshLibraryBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.fetchAdminSongs());
    }
    setupBatchSelection() {
        var _a, _b;
        const toggle = document.getElementById('toggleSelectBtn');
        toggle === null || toggle === void 0 ? void 0 : toggle.addEventListener('click', () => {
            this.isAdminSelecting = !this.isAdminSelecting;
            toggle.textContent = this.isAdminSelecting ? 'Cancel' : 'Select';
            document.querySelectorAll('.admin-song-row').forEach(row => row.classList.toggle('selecting', this.isAdminSelecting));
            if (!this.isAdminSelecting) {
                this.selectedSongIds.clear();
                this.updateBatchUI();
            }
        });
        (_a = document.getElementById('batchDeleteBtn')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => this.handleBatchDelete());
        (_b = document.getElementById('adminSongList')) === null || _b === void 0 ? void 0 : _b.addEventListener('change', (e) => {
            const target = e.target;
            if (target.classList.contains('batch-checkbox')) {
                const id = target.getAttribute('data-id');
                if (target.checked)
                    this.selectedSongIds.add(id);
                else
                    this.selectedSongIds.delete(id);
                this.updateBatchUI();
            }
        });
    }
    updateBatchUI() {
        const btn = document.getElementById('batchDeleteBtn');
        const count = document.getElementById('selectedCount');
        if (btn && count) {
            count.textContent = this.selectedSongIds.size.toString();
            btn.style.display = this.selectedSongIds.size > 0 ? 'block' : 'none';
        }
    }
    handleBatchDelete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!confirm(`Delete ${this.selectedSongIds.size} songs?`))
                return;
            const t = localStorage.getItem('audioflow_token');
            try {
                const res = yield fetch('/api/admin/songs/batch', {
                    method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
                    body: JSON.stringify({ ids: Array.from(this.selectedSongIds) })
                });
                if ((yield res.json()).status === 'success') {
                    this.isAdminSelecting = false;
                    this.selectedSongIds.clear();
                    this.updateBatchUI();
                    this.fetchAdminSongs();
                }
            }
            catch (e) { }
        });
    }
    fetchAdminSongs() {
        return __awaiter(this, void 0, void 0, function* () {
            const t = localStorage.getItem('audioflow_token');
            try {
                const res = yield fetch('/api/admin/songs', { headers: { 'Authorization': `Bearer ${t}` } });
                const json = yield res.json();
                if (json.status === 'success')
                    this.renderAdminSongList(json.data.songs);
            }
            catch (e) { }
        });
    }
    renderAdminSongList(songs) {
        const container = document.getElementById('adminSongList');
        if (songs.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); padding: 40px; text-align: center;">No songs found.</p>';
            return;
        }
        container.innerHTML = songs.map(s => `
            <div class="admin-song-row ${this.isAdminSelecting ? 'selecting' : ''}">
                <input type="checkbox" class="batch-checkbox" data-id="${s._id}" ${this.selectedSongIds.has(s._id) ? 'checked' : ''}>
                <img src="${s.coverUrl || s.albumArt}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                <div style="font-weight: bold; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.title}</div>
                <div style="color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.artist}</div>
                <div style="color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.album}</div>
                <div style="color: var(--text-muted);">${s.duration}</div>
                <div style="color: #535353; font-size: 12px;">${new Date(s.createdAt).toLocaleDateString()}</div>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="edit-song-btn" data-song='${JSON.stringify(s)}' style="background: none; border: none; color: var(--spotify-green); cursor: pointer; font-weight: bold;">Edit</button>
                    <button class="delete-song-btn" data-id="${s._id}" style="background: none; border: none; color: #ff4444; cursor: pointer; font-weight: bold;">Delete</button>
                </div>
            </div>
        `).join('');
    }
    setupAdminUpload() {
        const drop = document.getElementById('dropArea');
        const input = document.getElementById('audioFileInput');
        const form = document.getElementById('adminUploadForm');
        drop === null || drop === void 0 ? void 0 : drop.addEventListener('click', () => input.click());
        drop === null || drop === void 0 ? void 0 : drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragover'); });
        drop === null || drop === void 0 ? void 0 : drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
        drop === null || drop === void 0 ? void 0 : drop.addEventListener('drop', (e) => {
            var _a;
            e.preventDefault();
            drop.classList.remove('dragover');
            if ((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files.length) {
                input.files = e.dataTransfer.files;
                this.analyzeAudioFile(e.dataTransfer.files[0]);
            }
        });
        input === null || input === void 0 ? void 0 : input.addEventListener('change', () => { var _a; if ((_a = input.files) === null || _a === void 0 ? void 0 : _a.length)
            this.analyzeAudioFile(input.files[0]); });
        form === null || form === void 0 ? void 0 : form.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () { e.preventDefault(); this.handleAdminUpload(new FormData(form)); }));
    }
    analyzeAudioFile(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = localStorage.getItem('audioflow_token');
            document.getElementById('dropContent').style.display = 'none';
            document.getElementById('parsingLoader').style.display = 'flex';
            const fd = new FormData();
            fd.append('audioFile', file);
            try {
                const res = yield fetch('/api/admin/analyze', { method: 'POST', headers: { 'Authorization': `Bearer ${t}` }, body: fd });
                const json = yield res.json();
                if (json.status === 'success') {
                    const { metadata, tempFilePath } = json.data;
                    document.getElementById('formTitle').value = metadata.title || '';
                    document.getElementById('formArtist').value = metadata.artist || '';
                    document.getElementById('formAlbum').value = metadata.album || '';
                    document.getElementById('formGenre').value = (metadata.genre && metadata.genre[0]) || '';
                    document.getElementById('formYear').value = metadata.year || '';
                    document.getElementById('formTrackNumber').value = metadata.trackNumber || '';
                    document.getElementById('songDuration').value = metadata.duration || '';
                    document.getElementById('tempFilePath').value = tempFilePath;
                    if (metadata.embeddedArtPath) {
                        document.getElementById('tempArtPath').value = metadata.embeddedArtPath;
                        const c = document.getElementById('formCoverPreview');
                        c.src = metadata.embeddedArtPath;
                        c.style.display = 'block';
                        document.getElementById('coverPlaceholder').style.display = 'none';
                    }
                    document.getElementById('filePreview').textContent = `File Loaded: ${file.name}`;
                    document.getElementById('filePreview').style.display = 'block';
                }
            }
            catch (e) { }
            finally {
                document.getElementById('parsingLoader').style.display = 'none';
                document.getElementById('dropContent').style.display = 'block';
            }
        });
    }
    handleAdminUpload(fd) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = localStorage.getItem('audioflow_token');
            const barContainer = document.getElementById('uploadProgress');
            const bar = document.getElementById('uploadProgressBar');
            document.getElementById('uploadBtn').setAttribute('disabled', 'true');
            if (barContainer)
                barContainer.style.display = 'block';
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/admin/upload-song');
            xhr.setRequestHeader('Authorization', `Bearer ${t}`);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && bar) {
                    const percent = (e.loaded / e.total) * 100;
                    bar.style.width = `${percent}%`;
                }
            };
            xhr.onload = () => {
                const json = JSON.parse(xhr.responseText);
                if (json.status === 'success') {
                    this.showToast('Uploaded!');
                    this.fetchAdminSongs();
                    document.getElementById('adminUploadForm').reset();
                    document.getElementById('filePreview').style.display = 'none';
                    document.getElementById('formCoverPreview').style.display = 'none';
                    document.getElementById('coverPlaceholder').style.display = 'block';
                }
                else {
                    this.showToast(json.message || 'Upload failed');
                }
                document.getElementById('uploadBtn').removeAttribute('disabled');
                if (barContainer)
                    barContainer.style.display = 'none';
            };
            xhr.onerror = () => {
                this.showToast('Network error during upload');
                document.getElementById('uploadBtn').removeAttribute('disabled');
                if (barContainer)
                    barContainer.style.display = 'none';
            };
            xhr.send(fd);
        });
    }
    setupAdminEditDelete() {
        var _a, _b;
        document.addEventListener('click', (e) => {
            const target = e.target;
            const editBtn = target.closest('.edit-song-btn');
            if (editBtn) {
                this.showEditModal(JSON.parse(editBtn.getAttribute('data-song') || '{}'));
                return;
            }
            const deleteBtn = target.closest('.delete-song-btn');
            if (deleteBtn) {
                const id = deleteBtn.getAttribute('data-id');
                if (id)
                    this.showDeleteModal(id);
                return;
            }
        });
        (_a = document.getElementById('editSongForm')) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', (e) => { e.preventDefault(); this.handleAdminUpdate(new FormData(e.currentTarget)); });
        (_b = document.getElementById('confirmDeleteBtn')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', (e) => { const id = e.currentTarget.getAttribute('data-id'); if (id)
            this.handleAdminDelete(id); });
    }
    showEditModal(s) {
        var _a;
        const modal = document.getElementById('editSongModal');
        modal.style.display = 'flex';
        document.getElementById('editSongId').value = s._id;
        document.getElementById('editTitle').value = s.title;
        document.getElementById('editArtist').value = s.artist;
        document.getElementById('editAlbum').value = s.album;
        document.getElementById('editGenre').value = s.genre;
        document.getElementById('editYear').value = ((_a = s.year) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        document.getElementById('editCoverPreview').src = s.coverUrl || s.albumArt || '';
    }
    handleAdminUpdate(fd) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = document.getElementById('editSongId').value;
            const t = localStorage.getItem('audioflow_token');
            try {
                const res = yield fetch(`/api/admin/song/${id}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${t}` }, body: fd });
                if ((yield res.json()).status === 'success') {
                    this.showToast('Updated');
                    document.getElementById('editSongModal').style.display = 'none';
                    this.fetchAdminSongs();
                }
            }
            catch (e) { }
        });
    }
    showDeleteModal(id) {
        const modal = document.getElementById('deleteSongModal');
        modal.style.display = 'flex';
        document.getElementById('confirmDeleteBtn').setAttribute('data-id', id);
        document.getElementById('deleteLoader').style.display = 'none';
        document.getElementById('confirmDeleteBtn').removeAttribute('disabled');
    }
    handleAdminDelete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = localStorage.getItem('audioflow_token');
            const btn = document.getElementById('confirmDeleteBtn');
            const loader = document.getElementById('deleteLoader');
            btn.setAttribute('disabled', 'true');
            loader.style.display = 'block';
            try {
                const res = yield fetch(`/api/admin/song/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } });
                if ((yield res.json()).status === 'success') {
                    this.showToast('Deleted');
                    document.getElementById('deleteSongModal').style.display = 'none';
                    this.fetchAdminSongs();
                }
            }
            catch (e) {
                this.showToast('Delete failed');
            }
            finally {
                btn.removeAttribute('disabled');
                loader.style.display = 'none';
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', () => { window.player = new AudioPlayer(); });
