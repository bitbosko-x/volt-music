import requests
import re
import json

def extract_json_ld():
    url = "https://music.apple.com/us/playlist/top-100-india/pl.c0e98d2423e54c39b3df955c24df3cc5"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    print(f"Fetching {url}...")
    resp = requests.get(url, headers=headers, timeout=10)
    html = resp.text
    
    # regex for script tag content
    # Look for <script type="application/ld+json"> ... </script>
    # Non-greedy match for content
    match = re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
    
    if match:
        json_str = match.group(1).strip()
        print(f"Found JSON-LD string of length {len(json_str)}")
        try:
            data = json.loads(json_str)
            with open("apple_data.json", "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
            print("Saved to apple_data.json")
        except Exception as e:
            print(f"JSON Decode Error: {e}")
            with open("apple_data_raw.txt", "w", encoding="utf-8") as f:
                f.write(json_str)
    else:
        print("No JSON-LD script tag found.")

if __name__ == "__main__":
    extract_json_ld()
