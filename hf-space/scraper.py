import time
from playwright.sync_api import sync_playwright
from auditor import analyze_website
from ai_engine import generate_pitch


def format_whatsapp_link(phone_raw):
    if not phone_raw: return "No phone number"
    phone_digits = ''.join(filter(str.isdigit, phone_raw))
    if phone_digits.startswith('0') and len(phone_digits) == 11:
        phone_digits = '92' + phone_digits[1:]
    return f"https://wa.me/{phone_digits}"


def run_scraper(data):
    search_query = f"{data['category']} in {data['city']}"
    scraped_data = []
    processed_urls = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"\n🔍 Searching Google Maps for '{search_query}'...")
        page.goto(f"https://www.google.com/maps/search/{search_query.replace(' ', '+')}")
        time.sleep(5)

        no_new_data_counter = 0
        previous_count = 0

        while len(scraped_data) < data['target_leads']:
            listings = page.locator('a[href*="/maps/place/"]').all()
            current_count = len(listings)

            for listing in listings:
                if len(scraped_data) >= data['target_leads']: break

                href = listing.get_attribute('href')
                if not href or href in processed_urls: continue
                processed_urls.add(href)

                try:
                    listing.click()
                    time.sleep(3)

                    shop_name = page.locator('h1.DUwDvf').inner_text(timeout=2000)
                    website_element = page.locator('a[data-item-id="authority"]')
                    has_website, website_url = False, ""

                    if website_element.count() > 0:
                        website_url = website_element.get_attribute('href', timeout=2000) or ""
                        if not any(domain in website_url.lower() for domain in
                                   ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com']):
                            has_website = True

                    review_element = page.locator('div.F7nice').first
                    if review_element.count() > 0:
                        review_text = review_element.inner_text(timeout=2000)
                        review_digits = ''.join(
                            filter(str.isdigit, review_text.split('(')[-1])) if '(' in review_text else ''.join(
                            filter(str.isdigit, review_text))
                        review_count = int(review_digits) if review_digits else 0
                    else:
                        review_count = 0

                    is_target, faults = False, []

                    if review_count >= data['min_reviews']:
                        if data['mode'] == "1" and not has_website:
                            is_target = True
                        elif data['mode'] == "2" and has_website:
                            print(f"  -> Auditing website for {shop_name}...")
                            faults = analyze_website(website_url)
                            if faults:
                                is_target = True
                            else:
                                print(f"Skipping {shop_name} (Perfectly optimized)")

                    if is_target:
                        print(f"🎯 Target Found ({len(scraped_data) + 1}/{data['target_leads']}): {shop_name}")
                        wa_link = format_whatsapp_link(
                            page.locator('button[data-item-id*="phone:tel:"]').inner_text() if page.locator(
                                'button[data-item-id*="phone:tel:"]').count() > 0 else "")

                        real_reviews = []
                        if data['use_ai']:
                            try:
                                reviews_tab = page.locator('button[role="tab"]').filter(has_text="Reviews").first
                                if reviews_tab.count() > 0:
                                    reviews_tab.click()
                                    time.sleep(2)
                                    for el in page.locator('span.wiI7pd').all()[:3]:
                                        if el.inner_text().strip(): real_reviews.append(el.inner_text().strip())
                            except:
                                pass
                        if not real_reviews: real_reviews = [f"Highly rated {data['category']}."]

                        strength, weakness, pitch = generate_pitch(shop_name, real_reviews, data['sadapay_link'],
                                                                   data['mode'], faults, data['use_ai'])

                        scraped_data.append({
                            "Business Name": shop_name,
                            "WhatsApp Link": wa_link,
                            "Website Link": website_url if website_url else "N/A",
                            "Review Count": review_count,
                            "Website Faults": ", ".join(faults) if faults else "N/A",
                            "AI Strength": strength,
                            "AI Weakness": weakness,
                            "Pitch": pitch
                        })
                    else:
                        print(f"Skipping {shop_name}")

                except Exception:
                    continue

            if len(scraped_data) >= data['target_leads']: break

            if current_count == previous_count:
                no_new_data_counter += 1
                if no_new_data_counter >= 3:
                    print("\n⚠️ Reached the end of Google Maps results.")
                    break
            else:
                no_new_data_counter = 0

            previous_count = current_count
            print(f"\n⚙️ Scrolling...")
            page.hover('a[href*="/maps/place/"]')
            page.mouse.wheel(0, 10000)
            time.sleep(4)

        browser.close()
        return scraped_data