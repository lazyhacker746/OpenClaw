import sqlite3
from datetime import datetime

DB_NAME = "openclaw_leads.db"


def init_db():
    """Creates the database and the table if they don't exist."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Create the table
    cursor.execute('''
                   CREATE TABLE IF NOT EXISTS leads
                   (
                       id
                       INTEGER
                       PRIMARY
                       KEY
                       AUTOINCREMENT,
                       date_scraped
                       TEXT,
                       city
                       TEXT,
                       category
                       TEXT,
                       business_name
                       TEXT,
                       review_count
                       INTEGER,
                       website_status
                       TEXT,
                       whatsapp_link
                       TEXT,
                       pitch
                       TEXT
                   )
                   ''')
    conn.commit()
    conn.close()
    print("[+] Database Initialized Successfully.")


def save_leads_to_db(city, category, leads_data):
    """Saves a batch of scraped leads into the database."""
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    date_scraped = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for lead in leads_data:
        cursor.execute('''
                       INSERT INTO leads (date_scraped, city, category, business_name, review_count, website_status,
                                          whatsapp_link, pitch)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                       ''', (
                           date_scraped,
                           city,
                           category,
                           lead.get('Business Name', 'Unknown'),
                           lead.get('Review Count', 0),
                           lead.get('Website Faults', 'No Website Found'),
                           lead.get('WhatsApp Link', ''),
                           lead.get('Pitch', '')
                       ))

    conn.commit()
    conn.close()
    print(f"[+] Saved {len(leads_data)} leads to database.")

def get_all_leads():
    """Fetches all historical leads from the database."""
    conn = sqlite3.connect(DB_NAME)
    # This row_factory line is magic: it turns database rows into Python dictionaries (JSON)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Grab everything, newest leads at the top
    cursor.execute('SELECT * FROM leads ORDER BY date_scraped DESC')
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]