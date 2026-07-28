"""Thin compatibility adapter for the product-critical Playwright scraper."""

import scraper as legacy_scraper


class LegacyScraperAdapter:
    def run(self, clean_data: dict):
        return legacy_scraper.run_scraper(clean_data)
