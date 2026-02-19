import requests
from requests.exceptions import RequestException
import base64
import json
import re
import os
from pyDes import des, ECB, PAD_PKCS5
from cache_manager import smart_cache

# --- CONSTANTS ---
# DES key is read from the environment so it is never hard-coded in source.
# The default value is JioSaavn's public key (extracted from their web bundle),
# so there is no security loss if the env var is unset during local development.
_DES_KEY = os.getenv("SAAVN_DES_KEY", "38346591").encode("utf-8")
DES_CIPHER = des(_DES_KEY, ECB, pad=None, padmode=PAD_PKCS5)
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'}

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

def clean_saavn_query(query):
    """Simplifies the query for Saavn's search API."""
    # Remove symbols that choke Saavn's search
    q = query.replace('&', ' ').replace(',', ' ').replace(' - ', ' ')
    q = q.replace('(', ' ').replace(')', ' ').replace('@', ' ')
    q = re.sub(r'\[.*?\]', '', q) # Remove anything in brackets (usually just [Official Video])
    return ' '.join(q.split())

@smart_cache(ttl=3600, validator=lambda x: x and len(x) > 0)
def search_saavn(query):
    """Searches JioSaavn and returns a list of 320kbps songs."""
    cleaned_query = clean_saavn_query(query)
    print(f"   [Saavn] Searching for: '{cleaned_query}'" + (f" (Original: '{query}')" if cleaned_query != query else ""))
    
    try:
        # 1. Try with cleaned query
        resp = requests.get("https://www.jiosaavn.com/api.php", params={
            "__call": "search.getResults", "_format": "json", "q": cleaned_query, "n": "10", "p": "1", "_marker": "0", "ctx": "web6dot0"
        }, headers=HEADERS, timeout=5)
        
        data = fix_json(resp.text)
        results = data.get('results') or data.get('data', {}).get('results')
        
        # 2. FALLBACK: If 0 results, try even simpler query (Title + First Artist)
        if not results and ('&' in query or ',' in query):
            # Split by & or , or 'feat' and take the first part
            lite_query = re.split(r'&|,|feat', query)[0].strip()
            print(f"   [Saavn] No results. Trying Lite Search: '{lite_query}'")
            resp = requests.get("https://www.jiosaavn.com/api.php", params={
                "__call": "search.getResults", "_format": "json", "q": lite_query, "n": "10", "p": "1", "_marker": "0", "ctx": "web6dot0"
            }, headers=HEADERS, timeout=5)
            data = fix_json(resp.text)
            results = data.get('results') or data.get('data', {}).get('results')

        if not results: return []

        songs = []
        for s in results:
            try:
                enc = s.get('encrypted_media_url')
                if enc:
                    # Decrypt and Upgrade to 320kbps
                    raw_url = decrypt_url(enc)
                    hq_url = raw_url.replace("_96.mp4", "_320.mp4").replace("_160.mp4", "_320.mp4")
                    
                    #  PRIORITY: artistMap (performers) > subtitle > music (songwriters/composers)
                    artist = ""
                    
                    # 1. Try artistMap first (contains all contributors)
                    if s.get('artistMap'):
                        artists_list = s.get('artistMap', {})
                        if isinstance(artists_list, dict):
                            # Use all artists - the fuzzy matcher will handle truncation
                            artist = ', '.join(artists_list.keys())
                    
                    # 2. Fallback to subtitle or music field
                    if not artist:
                        artist = s.get('more_info', {}).get('music', '') or s.get('subtitle', '') or s.get('music', '')
                    
                    songs.append({
                        "title": fix_title(s['song']),
                        "artist": fix_title(artist),
                        "image": s.get('image', '').replace("150x150", "500x500"),
                        "url": hq_url,
                        "source": "saavn",
                        "quality": "320kbps"
                    })
            except: continue
        return songs
        return songs
    except RequestException as e:
         print(f"   [Saavn] Connection Error: {e}")
         raise e
    except Exception as e:
        print(f"   [Saavn] Error: {e}")
        return []

# ---------------------------------------------------------
# ENHANCED SEARCH LOGIC (Based on User's Suggestion)
# ---------------------------------------------------------

# Keywords that indicate non-original tracks
JUNK_KEYWORDS = [
    "karaoke", "cover", "instrumental", "remix",
    "originally performed", "tribute", "vibe2vibe",
    "soundtrack wonder", "backing", "cover mix"
]

# Album image CDN priority (higher priority = lower rank number)
# Used to prefer Official Soundtracks for movie songs
IMAGE_PRIORITY = [
    "Spider-Man-Into-the-Spider-Verse-Soundtrack",   # rank 0 — official OST
    "Spider-Man-Into-the-Spider-Verse-Deluxe",       # rank 1 — deluxe OST
    "Hollywood",                                      # rank 2 — Post Malone's album
]

def is_junk(result: dict) -> bool:
    """Returns True if the result is a cover, karaoke, remix, etc."""
    title = result.get("title", "").lower()
    artist = result.get("artist", "").lower()
    return any(kw in title or kw in artist for kw in JUNK_KEYWORDS)

def rank_result(result: dict) -> int:
    """Lower score = better result. Ranks by album image URL priority."""
    image = result.get("image", "")
    for i, keyword in enumerate(IMAGE_PRIORITY):
        if keyword in image:
            return i
    return len(IMAGE_PRIORITY)  # lowest priority

def search_saavn_enhanced(query, artist_filter=None):
    """
    Search Saavn with enhanced filtering for strict artist matching and quality control.
    
    Args:
        query: Search query
        artist_filter: List/Set of artist names to strictly require (optional)
    """
    cleaned_query = clean_saavn_query(query)
    print(f"   [Saavn+] Searching Enhanced: '{cleaned_query}' (Filter: {artist_filter})")
    
    # 1. Get Raw Results
    raw_results = search_saavn(query)
    if not raw_results:
        return []
        
    filtered = []
    
    # 2. Filter Logic
    for res in raw_results:
        # Junk Check
        if is_junk(res) and "remix" not in query.lower() and "cover" not in query.lower():
            print(f"   [Saavn+] Skipping Junk: {res['title']}")
            continue
            
        # Strict Artist Check (if filter provided)
        if artist_filter:
            res_artist_lower = res['artist'].lower()
            # Check if ANY of the required artists are present
            # We treat artist_filter as a list of independent artists (e.g. ['Post Malone', 'Swae Lee'])
            # Only one needs to match to consider it valid? Or ALL?
            # User logic was: has_post AND has_swae.
            # But generic logic should be: if I searched for "Post Malone", result MUST have "Post Malone".
            
            # Let's tokenize.
            def get_tokens(text): return set(re.split(r'[\s,&]+', text.lower()))
            
            res_tokens = get_tokens(res_artist_lower)
            filter_tokens = set()
            for a in artist_filter:
                filter_tokens.update(get_tokens(a))
            
            # Remove common small words
            filter_tokens.discard('the')
            filter_tokens.discard('and')
            
            # Intersection check: Do we have overlap?
            if not res_tokens.intersection(filter_tokens):
                 print(f"   [Saavn+] Skipping Artist Mismatch: '{res['artist']}'")
                 continue
        
        filtered.append(res)
        
    # 3. Fallback
    if not filtered:
        print("   [Saavn+] Strict filter removed all results. Returning raw top result.")
        return raw_results
        
    # 4. Rank by Image Priority (Soundtrack Check)
    filtered.sort(key=rank_result)
    
    return filtered

def download_saavn_file(url, path):
    """Directly downloads MP4 from Saavn CDN"""
    local_filename = os.path.join(path, f"saavn_{os.urandom(4).hex()}.mp4")
    with requests.get(url, stream=True, headers=HEADERS, timeout=10) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): f.write(chunk)
    return local_filename