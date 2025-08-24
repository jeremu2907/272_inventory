import re
import csv
import requests
from bs4 import BeautifulSoup

INPUT_FILE = "nsn_list.txt"
OUTPUT_FILE = "nsn_results.csv"
BASE_URL = "https://www.iso-group.com"

def normalize_nsn(raw: str) -> str | None:
    """
    Take a raw NSN string, strip non-digits, and format as xxxx-xx-xxx-xxxx.
    Return None if it doesn't look like a valid NSN.
    """
    digits = re.sub(r"\D", "", raw)
    if len(digits) != 13:
        return None
    return f"{digits[0:4]}-{digits[4:6]}-{digits[6:9]}-{digits[9:13]}"

def fetch_item_name(url: str) -> tuple[str, str] | None:
    """
    Given a full URL, fetch ISO-Group page and extract NSN + item name.
    Handles "cancelled -> replaced by" redirects if present.
    Returns (nsn, item_name).
    """
    # Force HTTPS
    url = url.replace("http://", "https://")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/127.0.0.0 Safari/537.36"
    }

    try:
        resp = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        resp.raise_for_status()
    except Exception as e:
        print(f"⚠️ Request failed for {url}: {e}")
        return None
    
    soup = BeautifulSoup(resp.text, "html.parser")
    span = soup.find("span", class_="title NSNTitle")
    if not span:
        return None
    smalls = span.find_all("small")
    if not smalls:
        return None
    
    last_small = smalls[-1]
    text = last_small.get_text(strip=True)
    
    # Extract NSN from URL
    nsn_match = re.search(r"(\d{4}-\d{2}-\d{3}-\d{4})", url)
    nsn = nsn_match.group(1) if nsn_match else "UNKNOWN"
    
    if "cancelled" in text.lower() and "replaced by" in text.lower():
        link = last_small.find("a")
        if link and link.get("href"):
            new_url = link["href"].replace("http://", "https://")
            print(f"🔄 {nsn} cancelled, following replacement link: {new_url}")
            return fetch_item_name(new_url)
        else:
            return (nsn, "CANCELLED (no replacement link)")
    
    return (nsn, text)


def process_file():
    results = []
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        for line in f:
            raw = line.strip()
            if not raw or raw.isalpha():  # skip lines with only letters
                continue
            nsn = normalize_nsn(raw)
            if not nsn:
                print(f"❌ Skipping invalid NSN: {raw}")
                continue
            
            url = f"{BASE_URL}/NSN/{nsn}"
            result = fetch_item_name(url)
            if result:
                nsn_out, item_name = result
                item_name = item_name.replace('"', '')
                nsn_out = nsn_out.replace('"', '')
                print(f"✔ {nsn_out} -> {item_name}")
                results.append((f'"{nsn_out}"', f'"{item_name}"'))

    # Write CSV
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["NSN", "Item Name"])
        writer.writerows(results)

if __name__ == "__main__":
    process_file()
