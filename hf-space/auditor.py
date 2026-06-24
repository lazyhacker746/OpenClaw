import time
import requests


def analyze_website(url):
    faults = []
    if not url.startswith('http'):
        url = 'http://' + url

    try:
        start_time = time.time()
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        load_time = time.time() - start_time

        if not response.url.startswith('https'):
            faults.append("No SSL Certificate (Not Secure)")
        if load_time > 4.0:
            faults.append(f"Slow Load Time ({load_time:.1f}s)")
        if 'name="viewport"' not in response.text.lower():
            faults.append("Not Mobile Optimized")

        return faults
    except requests.exceptions.SSLError:
        return ["Invalid or Expired SSL Certificate"]
    except requests.exceptions.Timeout:
        return ["Extremely Slow (Timed out)"]
    except requests.exceptions.RequestException:
        return ["Website is Down or Unreachable"]