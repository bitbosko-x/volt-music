import yt_dlp
import re
from cache_manager import smart_cache

# Optimized yt-dlp options for speed
YDL_OPTS_BASE = {
    'quiet': True,
    'no_warnings': True,
    'nocheckcertificate': True,
    'ignoreerrors': True,
    'no_color': True,
    'logtostderr': False,
    'youtube_include_dash_manifest': False,
    'youtube_include_hls_manifest': False,
}

def smart_autocorrect(query):
    """Uses YouTube search to find the correct title (best effort)."""
    try:
        print(f"   [YouTube] Autocorrecting '{query}'...")
        opts = {**YDL_OPTS_BASE, 'extract_flat': True}
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(f"ytsearch1:{query}", download=False)
            if 'entries' in info and info['entries']:
                title = info['entries'][0]['title']
                clean = re.sub(r'\(.*?Lyrics.*?\)|\[.*?Video.*?\]|\(Official.*?\)', '', title, flags=re.IGNORECASE).strip()
                print(f"   [YouTube] Fixed -> '{clean}'")
                return clean
    except: pass
    return query

def search_youtube(query):
    """Returns a list of YouTube videos (Fallback)"""
    print(f"   [YouTube] Searching for: '{query}'")
    # Let exceptions propagate (caught by api.py)
    opts = {**YDL_OPTS_BASE, 'extract_flat': True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"ytsearch5:{query}", download=False)
        
    if 'entries' not in info: return []
    
    songs = []
    for vid in info['entries']:
        songs.append({
            "title": vid.get('title'),
            "artist": vid.get('uploader'),
            "image": f"https://img.youtube.com/vi/{vid.get('id')}/hqdefault.jpg",
            "url": vid.get('url') or f"https://www.youtube.com/watch?v={vid.get('id')}",
            "source": "yt",
            "quality": "160kbps"
        })
    return songs

def resolve_yt_stream(watch_url):
    """Resolves a Watch URL to a temporary audio stream URL using yt-dlp"""
    # Let exceptions propagate
    opts = {**YDL_OPTS_BASE, 'format': 'bestaudio/best', 'noplaylist': True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(watch_url, download=False)
        return info.get('url')

@smart_cache(ttl=600, validator=lambda x: x is not None)
def get_audio_link(search_term):
    """
    SINGLE-CALL Optimized search + resolve.
    """
    print(f"   [YouTube] Speed-matching: '{search_term}'")
    # Combining search and resolution in one call for major speedup
    opts = {
        **YDL_OPTS_BASE,
        'format': 'bestaudio/best',
        'noplaylist': True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        # We use ytsearch1 to get the actual stream info immediately
        info = ydl.extract_info(f"ytsearch1:{search_term}", download=False)
        
    if 'entries' in info and info['entries']:
        return info['entries'][0].get('url')
        
    return None

@smart_cache(ttl=7200, validator=lambda x: x is not None)
def get_video_url(search_term):
    """
    Finds a video stream URL (MP4) for background playback.
    """
    print(f"   [YouTube] Fetching Video: '{search_term}'")
    opts = {
        **YDL_OPTS_BASE,
        'format': 'best[ext=mp4]/best', # We want video!
        'noplaylist': True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"ytsearch1:{search_term}", download=False)
        
    if 'entries' in info and info['entries']:
        return info['entries'][0].get('url')
        
    return None