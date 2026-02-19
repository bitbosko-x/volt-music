import requests
import base64
import json
import re
import os
from pyDes import des, ECB, PAD_PKCS5
from pytubefix import YouTube, Search

# --- CONFIG ---
DES_CIPHER = des(b"38346591", ECB, pad=None, padmode=PAD_PKCS5)
TOKEN_PATH = os.path.join(os.getcwd(), 'tokens.json')

# --- HELPER FUNCTIONS ---
def decrypt_url(encrypted_url):
    try:
        enc_url = base64.b64decode(encrypted_url.strip())
        return DES_CIPHER.decrypt(enc_url, padmode=PAD_PKCS5).decode('utf-8')
    except: return None

def fix_json(text):
    try: return json.loads(text)
    except: return json.loads(re.sub(r'\(From "([^"]+)"\)', r"(From '\1')", text.strip()))

def fix_title(title):
    return title.replace("&quot;", '"').replace("&#039;", "'").replace("&amp;", "&")

# --- NEW: SMART AUTOCORRECT ---
def smart_fix_query(query):
    """
    Uses YouTube's superior search algorithm to fix typos.
    'Psot malone' -> 'Post Malone - What Don't Belong To Me'
    """
    try:
        print(f"DEBUG: Autocorrecting '{query}' via YouTube...")
        s = Search(query)
        if s.results:
            # Get the top result title (e.g., "Post Malone - What Don't Belong To Me (Lyrics)")
            best_match = s.results[0].title
            
            # Clean up "junk" words that confuse JioSaavn
            clean_match = re.sub(r'\(.*?Lyrics.*?\)|\[.*?Video.*?\]|\(Official.*?\)', '', best_match, flags=re.IGNORECASE).strip()
            
            print(f"DEBUG: Fixed Query -> '{clean_match}'")
            return clean_match
    except:
        pass
    return query  # Fallback to original if YouTube fails

# --- ENGINE 1: JIOSAAVN (Returns List) ---
def search_jio_list(query):
    try:
        # 1. AUTOCORRECT THE QUERY FIRST
        clean_query = smart_fix_query(query)
        
        print(f"DEBUG: Searching JioSaavn List for '{clean_query}'...")
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}
        
        resp = requests.get("https://www.jiosaavn.com/api.php", params={
            "__call": "search.getResults", "_format": "json", "q": clean_query, "n": "10", "p": "1", "_marker": "0", "ctx": "web6dot0"
        }, headers=headers)

        data = fix_json(resp.text)
        results = data.get('results') or data.get('data', {}).get('results')
        
        if not results: return []

        songs_list = []
        for song in results:
            try:
                enc_url = song.get('encrypted_media_url')
                if enc_url:
                    clean_url = decrypt_url(enc_url)
                    final_url = clean_url.replace("_96.mp4", "_320.mp4").replace("_160.mp4", "_320.mp4")
                    
                    # Better Artist String
                    artist_name = song.get('more_info', {}).get('music', '') or song.get('subtitle', '')
                    if not artist_name: artist_name = "Unknown Artist"

                    songs_list.append({
                        "title": fix_title(song['song']),
                        "artist": fix_title(artist_name),
                        "image": song.get('image', '').replace("150x150", "500x500"),
                        "url": final_url,
                        "source": "jio",
                        "quality": "320kbps"
                    })
            except: continue
            
        return songs_list
    except Exception as e:
        print(f"⚠ Jio List Error: {e}")
        return []

# --- ENGINE 2: YOUTUBE (Fallback List) ---
def search_yt_list(query):
    try:
        # Note: We use the ORIGINAL query here because YouTube understands typos fine
        print(f"DEBUG: Searching YouTube List for '{query}'...")
        s = Search(query)
        if not s.results: return []
        
        songs_list = []
        for vid in s.results[:5]:
            songs_list.append({
                "title": vid.title,
                "artist": vid.author,
                "image": vid.thumbnail_url,
                "url": vid.watch_url,
                "source": "yt",
                "quality": "160kbps"
            })
        return songs_list
    except Exception as e:
        print(f"⚠ YT List Error: {e}")
        return []

# --- RESOLVER ---
def resolve_yt_stream(watch_url):
    try:
        yt = YouTube(watch_url, client='ANDROID_MUSIC', use_oauth=True, allow_oauth_cache=True, token_file=TOKEN_PATH)
        stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
        return stream.url
    except: return None

# --- DOWNLOAD HANDLER ---
def download_file(url, source):
    path = os.path.join(os.getcwd(), 'downloads')
    os.makedirs(path, exist_ok=True)
    
    if source == 'jio':
        local_filename = os.path.join(path, f"song_{os.urandom(4).hex()}.mp4")
        with requests.get(url, stream=True, headers={'User-Agent': 'Mozilla/5.0'}) as r:
            r.raise_for_status()
            with open(local_filename, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192): f.write(chunk)
        return local_filename
    else:
        yt = YouTube(url, client='ANDROID_MUSIC', use_oauth=True, allow_oauth_cache=True, token_file=TOKEN_PATH)
        stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
        return stream.download(output_path=path)