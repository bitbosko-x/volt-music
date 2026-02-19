import os
from flask import Flask, render_template_string, request, send_file
from markupsafe import escape
import hub  # Uses the new hub.py

app = Flask(__name__)

# ── Security Headers ──────────────────────────────────────────────────────────
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https:; "
        "media-src 'self' https: blob:; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'"
    )
    return response

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Volt Player</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #121212; color: white; margin: 0; padding: 20px 20px 120px 20px; }
        .container { max-width: 700px; margin: 0 auto; text-align: center; }
        
        /* Search */
        input { padding: 15px; width: 70%; border-radius: 30px; border: none; background: #333; color: white; outline: none; font-size: 16px; }
        button { padding: 15px 20px; border-radius: 30px; border: none; background: #1DB954; color: white; font-weight: bold; cursor: pointer; }
        
        /* Category Sections */
        .category-section { margin: 30px 0; text-align: left; }
        .category-header { font-size: 1.3em; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #333; display: flex; align-items: center; gap: 10px; }
        .category-count { font-size: 0.7em; color: #888; font-weight: normal; }
        
        /* List Items */
        .list-item { 
            display: flex; align-items: center; background: #1e1e1e; margin: 10px 0; padding: 10px; border-radius: 10px; 
            text-decoration: none; color: white; transition: 0.2s; 
        }
        .list-item:hover { background: #2a2a2a; transform: scale(1.02); }
        .thumb { width: 60px; height: 60px; border-radius: 5px; margin-right: 15px; object-fit: cover; }
        .thumb-large { width: 80px; height: 80px; }
        .info { flex: 1; text-align: left; }
        .info-secondary { color: #aaa; font-size: 0.9em; }
        
        /* Badges */
        .badge { padding: 3px 8px; border-radius: 4px; font-size: 0.7em; font-weight: bold; margin-left: auto; }
        .badge-song { background: #1DB954; }
        .badge-album { background: #ff6b6b; }
        .badge-artist { background: #4ecdc4; }
        
        /* Sticky Player Bar */
        #stickyPlayer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(to top, #1e1e1e 0%, #181818 100%);
            border-top: 1px solid #333;
            padding: 15px 20px;
            display: none;
            z-index: 1000;
            box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
        }
        #stickyPlayer.active { display: flex; }
        .player-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 20px;
            width: 100%;
        }
        .player-info {
            display: flex;
            align-items: center;
            gap: 15px;
            flex: 1;
            min-width: 0;
        }
        .player-thumb {
            width: 60px;
            height: 60px;
            border-radius: 5px;
            object-fit: cover;
        }
        .player-details {
            flex: 1;
            text-align: left;
            min-width: 0;
        }
        .player-title {
            font-weight: bold;
            font-size: 0.95em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .player-artist {
            color: #aaa;
            font-size: 0.85em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .player-controls {
            flex: 2;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .player-audio {
            width: 100%;
        }
        .player-quality {
            display: flex;
            gap: 10px;
            align-items: center;
            justify-content: flex-end;
        }
        .close-player {
            background: #ff4444;
            border: none;
            color: white;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
        }
        .close-player:hover { background: #ff6666; }
        
        /* Expanded Player Styles */
        #stickyPlayer.expanded {
            height: 100vh;
            flex-direction: column;
            justify-content: center;
            background: rgba(0,0,0,0.85); /* Darker overlay */
            backdrop-filter: blur(20px);
        }
        #stickyPlayer.expanded .player-content {
            flex-direction: column;
            height: 100%;
            justify-content: center;
            max-width: 800px;
        }
        #stickyPlayer.expanded .player-thumb {
            width: 250px;
            height: 250px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            margin-bottom: 30px;
        }
        #stickyPlayer.expanded .player-info {
            flex-direction: column;
            text-align: center;
            flex: initial;
            margin-bottom: 30px;
        }
        #stickyPlayer.expanded .player-details {
            text-align: center;
        }
        #stickyPlayer.expanded .player-title { font-size: 1.5em; margin-bottom: 10px; white-space: normal; }
        #stickyPlayer.expanded .player-artist { font-size: 1.2em; }
        
        /* Background Video */
        #bgVideo {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            object-fit: cover;
            z-index: -1;
            opacity: 0;
            transition: opacity 1s;
        }
        #stickyPlayer.expanded #bgVideo {
            opacity: 0.6; /* Dim video behind controls */
        }
        
        .expand-btn {
            background: none; border: none; color: white;
            font-size: 1.2em; cursor: pointer; padding: 10px;
            margin-left: 10px;
        }
        
        /* Original Player (hidden when sticky is active) */
        .player { background: #1e1e1e; padding: 20px; border-radius: 20px; margin-top: 20px; }
        img.cover { width: 100%; border-radius: 10px; margin-bottom: 15px; }
        .btn-dl { display: inline-block; margin-top: 15px; padding: 10px 20px; background: #333; color: white; text-decoration: none; border-radius: 20px; border: 1px solid #555; }
    </style>
    <script>
        // Persistent player state
        let currentTrack = null;
        
        // Load player state on page load
        function loadPlayerState() {
            const savedTrack = localStorage.getItem('currentTrack');
            const savedTime = localStorage.getItem('currentTime');
            const wasPlaying = localStorage.getItem('wasPlaying') === 'true';
            
            if (savedTrack) {
                currentTrack = JSON.parse(savedTrack);
                showStickyPlayer(currentTrack, parseFloat(savedTime) || 0, wasPlaying);
            }
        }
        
        // Call on DOM ready
        window.addEventListener('DOMContentLoaded', loadPlayerState);
        
        // IMPORTANT: Also reload on browser back/forward
        window.addEventListener('pageshow', function(event) {
            // Force reload player state when using back/forward buttons
            if (event.persisted || performance.navigation.type === 2) {
                setTimeout(loadPlayerState, 100); // Small delay to ensure DOM is ready
            }
        });
        
        // Prevent unload from clearing state
        window.addEventListener('beforeunload', function() {
            // Save current state before page unload
            const audio = document.getElementById('stickyAudio');
            if (audio && currentTrack) {
                localStorage.setItem('currentTime', audio.currentTime);
                localStorage.setItem('wasPlaying', !audio.paused);
            }
        });
        
        // Play song in sticky player
        function playSong(title, artist, img, streamUrl, source) {
            currentTrack = { title, artist, img, streamUrl, source };
            localStorage.setItem('currentTrack', JSON.stringify(currentTrack));
            showStickyPlayer(currentTrack, 0, true);
        }
        
        // Show sticky player
        function showStickyPlayer(track, startTime = 0, autoplay = false) {
            const player = document.getElementById('stickyPlayer');
            const audio = document.getElementById('stickyAudio');
            
            document.getElementById('playerThumb').src = track.img;
            document.getElementById('playerTitle').textContent = track.title;
            document.getElementById('playerArtist').textContent = track.artist;
            document.getElementById('playerSource').textContent = track.source;
            
            // Quality badge
            const qualityBadge = document.getElementById('qualityBadge');
            if (track.source === 'saavn') {
                qualityBadge.textContent = '320kbps HQ';
                qualityBadge.style.background = '#1DB954';
            } else {
                qualityBadge.textContent = '160kbps';
                qualityBadge.style.background = '#ff6b6b';
            }
            
            // Only change source if different
            if (audio.src !== track.streamUrl) {
                audio.src = track.streamUrl;
                
                // Reset Video if track changed
                const video = document.getElementById('bgVideo');
                if (video) {
                    video.pause();
                    video.src = "";
                }
            }
            audio.currentTime = startTime;
            
            if (autoplay) {
                audio.play().catch(e => console.log('Autoplay prevented:', e));
            }
            
            player.classList.add('active');
            
            // Auto-load video if expanded
            if (player.classList.contains('expanded')) {
                loadVideoPreview();
            }
            
            // Save state periodically (remove old listeners first)
            audio.removeEventListener('timeupdate', savePlaybackState);
            audio.addEventListener('timeupdate', savePlaybackState);
        }
        
        // Separate function for saving state
        function savePlaybackState() {
            const audio = document.getElementById('stickyAudio');
            if (currentTrack) {
                localStorage.setItem('currentTime', audio.currentTime);
                localStorage.setItem('wasPlaying', !audio.paused);
            }
        }
        
        // Expand Player / Video Logic
        function toggleExpand() {
            const player = document.getElementById('stickyPlayer');
            player.classList.toggle('expanded');
            
            if (player.classList.contains('expanded')) {
                loadVideoPreview();
            }
        }
        
        function loadVideoPreview() {
            const video = document.getElementById('bgVideo');
            // Check if already loaded for this track (we can store videoUrl in currentTrack)
            if (currentTrack.videoUrl) {
                if (video.src !== currentTrack.videoUrl) {
                    video.src = currentTrack.videoUrl;
                    video.play();
                }
                return;
            }
            
            // Fetch video
            console.log("Fetching video preview...");
            const query = `search_term=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist || '')}&title=${encodeURIComponent(currentTrack.title)}`;
            
            fetch(`/video_preview?${query}`)
                .then(r => r.json())
                .then(data => {
                    if (data.url) {
                        currentTrack.videoUrl = data.url; // Cache it
                        video.src = data.url;
                        video.play();
                    }
                })
                .catch(e => console.error("Video fetch failed:", e));
        }

        // Close player
        function closeStickyPlayer() {
            const player = document.getElementById('stickyPlayer');
            const audio = document.getElementById('stickyAudio');
            const video = document.getElementById('bgVideo');
            
            audio.pause();
            video.pause();
            video.src = ""; // Stop buffering
            
            player.classList.remove('active');
            player.classList.remove('expanded');
            
            localStorage.removeItem('currentTrack');
            localStorage.removeItem('currentTime');
            localStorage.removeItem('wasPlaying');
            currentTrack = null;
        }
    </script>
</head>
<body>
    <div class="container">
        <h1>⚡ Volt Hub</h1>
        <form action="/">
            <input type="text" name="q" placeholder="Search song..." value="{{ query or '' }}">
            <button type="submit">Go</button>
        </form>

        {% if results %}
            <!-- Songs Section -->
            {% if results.songs %}
            <div class="category-section">
                <h2 class="category-header">{% if not query %}🔥 Top 100 India{% else %}🎵 Songs{% endif %} <span class="category-count">({{ results.songs|length }})</span></h2>
                {% for song in results.songs %}
                <a class="list-item" href="#" onclick="playSong('{{ song.title | replace("'", "\\'"  ) }}', '{{ song.artist | replace("'", "\\'" ) }}', '{{ song.image }}', '{{ "/play?search_term=" + (song.search_term | urlencode) }}', 'loading'); fetch('{{ "/play?search_term=" + (song.search_term | urlencode) }}').then(r=>r.text()).then(html=>{const parser=new DOMParser();const doc=parser.parseFromString(html,'text/html');const audioSrc=doc.querySelector('audio source').src;const source=html.includes('saavn')?'saavn':'yt';playSong('{{ song.title | replace("'", "\\'" ) }}','{{ song.artist | replace("'", "\\'" ) }}','{{ song.image }}',audioSrc,source);}); return false;">
                    <img src="{{ song.image }}" class="thumb">
                    <div class="info">
                        <b>{{ song.title }}</b><br>
                        <span class="info-secondary">{{ song.artist }}</span>
                    </div>
                    <span class="badge badge-song">SONG</span>
                </a>
                {% endfor %}
            </div>
            {% endif %}
            
            <!-- Albums Section -->
            {% if results.albums %}
            <div class="category-section">
                <h2 class="category-header">💿 Albums <span class="category-count">({{ results.albums|length }})</span></h2>
                {% for album in results.albums %}
                <a class="list-item" href="/album/{{ album.album_id }}">
                    <img src="{{ album.image }}" class="thumb thumb-large">
                    <div class="info">
                        <b>{{ album.title }}</b><br>
                        <span class="info-secondary">{{ album.artist }}</span><br>
                        <span class="info-secondary" style="font-size:0.8em;">{{ album.track_count }} tracks</span>
                    </div>
                    <span class="badge badge-album">ALBUM</span>
                </a>
                {% endfor %}
            </div>
            {% endif %}
            
            <!-- Artists Section -->
            {% if results.artists %}
            <div class="category-section">
                <h2 class="category-header">👤 Artists <span class="category-count">({{ results.artists|length }})</span></h2>
                {% for artist in results.artists %}
                <a class="list-item" href="/artist/{{ artist.name | urlencode }}">
                    {% if artist.image %}
                    <img src="{{ artist.image }}" class="thumb thumb-large" style="border-radius: 50%;">
                    {% else %}
                    <div class="thumb thumb-large" style="border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; font-size: 2em;">🎤</div>
                    {% endif %}
                    <div class="info">
                        <b>{{ artist.name }}</b><br>
                        {% if artist.genre %}
                        <span class="info-secondary">{{ artist.genre }}</span>
                        {% endif %}
                    </div>
                    <span class="badge badge-artist">ARTIST</span>
                </a>
                {% endfor %}
            </div>
            {% endif %}
        {% endif %}

        {% if player %}
        <div class="player">
            <img src="{{ player.img }}" class="cover">
            <h2>{{ player.title }}</h2>
            <p style="color: #aaa; font-size: 1.1em; margin: 5px 0 15px 0;">{{ player.artist }}</p>
            <div style="color: #888; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span>Source: {{ player.source }}</span>
                {% if player.source == 'saavn' %}
                <span class="badge" style="background: #1DB954; color: white;">320kbps HQ</span>
                {% elif player.source == 'yt' %}
                <span class="badge" style="background: #ff6b6b; color: white;">160kbps</span>
                {% endif %}
            </div>
            
            <audio controls autoplay style="width: 100%;">
                <source src="{{ player.stream }}" type="audio/mp4">
            </audio>
            
            <br>
            <a href="/download?url={{ player.stream }}&source={{ player.source }}" class="btn-dl">⬇ Download Audio</a>
        </div>
        {% endif %}
        
        {% if error %}
        <h3 style="color: #ff4444;">{{ error }}</h3>
        {% endif %}
    </div>
    
    <!-- Sticky Player Bar -->
    <div id="stickyPlayer">
        <div class="player-content">
            <div class="player-info">
                <img id="playerThumb" class="player-thumb" src="" alt="">
                <div class="player-details">
                    <div class="player-title" id="playerTitle">-</div>
                    <div class="player-artist" id="playerArtist">-</div>
                </div>
            </div>
            <div class="player-controls">
                <audio id="stickyAudio" class="player-audio" controls></audio>
                <div class="player-quality">
                    <span style="color: #888; font-size: 0.85em;">Source: <span id="playerSource">-</span></span>
                    <span id="qualityBadge" class="badge" style="color: white;">-</span>
                    <button class="expand-btn" onclick="toggleExpand()">⤢</button>
                </div>
            </div>
            <button class="close-player" onclick="closeStickyPlayer()">✕</button>
        </div>
        <!-- Background Video Element -->
        <video id="bgVideo" loop muted playsinline></video>
    </div>
    
    {% if player %}
    <script>
        // Auto-play the song in sticky player
        playSong(
            '{{ player.title | replace("'", "\\'" ) }}',
            '{{ player.artist | replace("'", "\\'" ) }}',
            '{{ player.img }}',
            '{{ player.stream }}',
            '{{ player.source }}'
        );
        // Redirect back to home after a moment
        setTimeout(function() {   window.history.replaceState({}, '', '/');  }, 100);
    </script>
    {% endif %}
</body>
</html>
'''

@app.route('/')
def index():
    query = request.args.get('q')
    results = None
    
    if query:
        # Get categorized results from Apple Music (iTunes API)
        results = hub.search_hybrid(query, categorized=True)
    else:
        # Default Home Page: Top 100 India
        # Using the specific playlist URL provided by user
        TOP_INDIA_URL = "https://music.apple.com/us/playlist/top-100-india/pl.c0e98d2423e54c39b3df955c24df3cc5"
        
        # We start a background thread or just fetch it (optimized with lru_cache)
        # For now, synchronous fetch is fine as it's cached
        top_songs = metadata_engine.get_apple_music_playlist(TOP_INDIA_URL)
        
        if top_songs:
            # Structure it like 'results' so the template renders it
            results = {
                "songs": top_songs,
                "albums": [],
                "artists": []
            }
            
    return render_template_string(HTML_TEMPLATE, results=results, query=query)

@app.route('/play')
def play():
    # 1. Get the Clean Search Term (e.g., "Starboy The Weeknd")
    search_term = request.args.get('search_term')
    title = request.args.get('title')
    img = request.args.get('img')
    artist = request.args.get('artist', 'Unknown Artist')  # Get artist name

    # 2. Ask Hub to find the best audio file for this term
    # This replaces the old 'get_stream_url'
    stream_url, source = hub.get_audio_link(search_term, artist_name=artist)
    
    if not stream_url:
        return render_template_string(HTML_TEMPLATE, error="Could not find audio stream.")

    player_data = {
        "title": title,
        "artist": artist,
        "img": img,
        "stream": stream_url,
        "source": source
    }
    return render_template_string(HTML_TEMPLATE, player=player_data)

@app.route('/video_preview')
def video_preview():
    search_term = request.args.get('search_term')
    artist = request.args.get('artist')
    title = request.args.get('title')
    
    # Prefer title + artist if available
    query = search_term
    if title and artist:
        query = f"{title} {artist}"
        
    url = hub.get_video_preview(query, artist)
    
    if url:
        return {"url": url}
    return {"error": "No video found"}, 404

@app.route('/download')
def download():
    url = request.args.get('url')
    source = request.args.get('source')
    
    file_path = hub.download_song(url, source)
    
    if file_path:
        return send_file(file_path, as_attachment=True)
    return "Download Failed"

@app.route('/album/<album_id>')
def album_detail(album_id):
    import metadata_engine
    album_data = metadata_engine.get_album_tracks(album_id)
    
    if not album_data:
        return render_template_string(HTML_TEMPLATE, error="Album not found")
    
    # Create a results dict with only songs for the template
    results = {
        "songs": album_data['songs'],
        "albums": [],
        "artists": []
    }
    
    # Simple template override with album header
    # ── XSS Fix: escape all data from external APIs before injecting into HTML ──
    album_header = f"""
    <div style="text-align: center; margin: 20px 0;">
        <img src="{escape(album_data['artwork'])}" style="width: 200px; height: 200px; border-radius: 10px; margin-bottom: 15px;">
        <h1 style="margin: 10px 0;">{escape(album_data['album_name'])}</h1>
        <p style="color: #aaa; font-size: 1.1em;">{escape(album_data['artist_name'])}</p>
        <p style="color: #666; font-size: 0.9em;">{escape(str(album_data['genre']))} • {escape(str(album_data['track_count']))} tracks</p>
        <a href="/" style="color: #1DB954; text-decoration: none;">← Back to Search</a>
    </div>
    """

    return render_template_string(HTML_TEMPLATE.replace(
        '<h1>⚡ Volt Hub</h1>',
        album_header
    ), results=results, query="")

@app.route('/artist/<artist_name>')
def artist_detail(artist_name):
    import metadata_engine
    artist_data = metadata_engine.get_artist_songs(artist_name)
    
    if not artist_data:
        return render_template_string(HTML_TEMPLATE, error="Artist not found")
    
    # Create results dict with artist's songs
    results = {
        "songs": artist_data['songs'],
        "albums": [],
        "artists": []
    }
    
    # Artist header
    # ── XSS Fix: escape all data from external APIs before injecting into HTML ──
    artist_header = f"""
    <div style="text-align: center; margin: 20px 0;">
        <img src="{escape(artist_data['artist_image'])}" style="width: 200px; height: 200px; border-radius: 50%; margin-bottom: 15px; object-fit: cover;">
        <h1 style="margin: 10px 0;">{escape(artist_data['artist_name'])}</h1>
        <p style="color: #aaa; font-size: 1.1em;">{escape(str(artist_data['genre']))}</p>
        <p style="color: #666; font-size: 0.9em;">Top Songs</p>
        <a href="/" style="color: #1DB954; text-decoration: none;">← Back to Search</a>
    </div>
    """

    return render_template_string(HTML_TEMPLATE.replace(
        '<h1>⚡ Volt Hub</h1>',
        artist_header
    ), results=results, query="")

if __name__ == '__main__':
    # Enable threading for concurrent requests
    # threaded=True allows multiple requests to be handled simultaneously
    # processes=1 keeps it single-process (good for development)
    # Debug mode is controlled by FLASK_DEBUG env var — never True in production
    _debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=_debug, port=5000, use_reloader=False, threaded=True, processes=1)