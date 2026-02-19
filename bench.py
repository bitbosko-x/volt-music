import requests
import time
import threading

# SET THIS TO YOUR LOCAL IP/URL
URL = "http://localhost:5000/search?q=weeknd" 

def make_request(i):
    start = time.time()
    try:
        r = requests.get(URL)
        elapsed = time.time() - start
        print(f"Req {i}: Status {r.status_code} | Time: {elapsed:.2f}s")
    except Exception as e:
        print(f"Req {i}: Failed {e}")

print("--- Starting 20 Concurrent Requests ---")
start_all = time.time()

threads = []
for i in range(20):
    t = threading.Thread(target=make_request, args=(i,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

total_time = time.time() - start_all
print(f"\nTotal Time: {total_time:.2f}s")
print(f"Avg Time per Req: {total_time/20:.2f}s")
