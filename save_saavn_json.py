import saavn_engine
import json

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

# Known performing artist display names (lowercase for matching)
PERFORMING_ARTISTS = {"post malone", "swae lee"}

# Keywords that indicate non-original tracks
JUNK_KEYWORDS = [
    "karaoke", "cover", "instrumental", "remix",
    "originally performed", "tribute", "vibe2vibe",
    "soundtrack wonder", "backing", "cover mix"
]

# Album image CDN priority (higher priority = lower rank number)
IMAGE_PRIORITY = [
    "Spider-Man-Into-the-Spider-Verse-Soundtrack",   # rank 0 — official OST
    "Spider-Man-Into-the-Spider-Verse-Deluxe",       # rank 1 — deluxe OST
    "Hollywood",                                      # rank 2 — Post Malone's album
]


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def clean_artists(artist_string: str) -> str:
    """
    Saavn stuffs producer/songwriter credits into the artist field.
    This extracts only the actual performing artists.
    Falls back to the original string if no known artists are found.
    """
    parts = [a.strip() for a in artist_string.split(",")]
    performing = [a for a in parts if a.lower() in PERFORMING_ARTISTS]
    return ", ".join(performing) if performing else artist_string


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


def has_required_artists(result: dict) -> bool:
    """Checks if the result contains both Post Malone and Swae Lee credits."""
    artist = result.get("artist", "").lower()
    has_post = "austin post" in artist or "post malone" in artist
    has_swae = "khalif" in artist or "swae lee" in artist
    return has_post and has_swae


# ─────────────────────────────────────────────
# MAIN SEARCH FUNCTION
# ─────────────────────────────────────────────

def search_saavn_song(query: str, performing_artists: set = None) -> list:
    """
    Search Saavn for a song and return cleaned, filtered, ranked results.

    Args:
        query: Search query string. Avoid special characters like () : & for best results.
        performing_artists: Set of lowercase artist display names to keep in the artist field.

    Returns:
        List of cleaned result dicts, best match first.
    """
    global PERFORMING_ARTISTS
    if performing_artists:
        PERFORMING_ARTISTS = {a.lower() for a in performing_artists}

    print(f"[saavn] Searching: '{query}'")
    raw_results = saavn_engine.search_saavn(query)
    print(f"[saavn] Got {len(raw_results)} raw results")

    # Step 1: Filter — keep only originals with correct artists
    filtered = [
        r for r in raw_results
        if not is_junk(r) and has_required_artists(r)
    ]

    # Fallback: if filtering is too strict, use all non-junk results
    if not filtered:
        print("[saavn] Warning: strict filter returned nothing, relaxing to non-junk only")
        filtered = [r for r in raw_results if not is_junk(r)]

    # Fallback: if still nothing, return all raw results
    if not filtered:
        print("[saavn] Warning: no results after filtering, returning raw results")
        filtered = raw_results

    # Step 2: Rank by album image priority
    filtered.sort(key=rank_result)

    # Step 3: Clean artist field — remove producer/songwriter credits
    for result in filtered:
        result["artist"] = clean_artists(result["artist"])

    print(f"[saavn] Returning {len(filtered)} clean result(s)")
    return filtered


# ─────────────────────────────────────────────
# USAGE EXAMPLE
# ─────────────────────────────────────────────

def main():
    # NOTE: Avoid special characters like () : & in queries — they confuse Saavn's search
    query = "Sunflower Post Malone Swae Lee Spider Man"

    results = search_saavn_song(
        query=query,
        performing_artists={"Post Malone", "Swae Lee"}
    )

    # Save to file
    output_file = "saavn_result_clean.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4, ensure_ascii=False)

    print(f"\n✅ Best match:")
    print(f"   Title  : {results[0]['title']}")
    print(f"   Artist : {results[0]['artist']}")
    print(f"   Quality: {results[0]['quality']}")
    print(f"   URL    : {results[0]['url']}")
    print(f"\nAll results saved to: {output_file}")


if __name__ == "__main__":
    main()