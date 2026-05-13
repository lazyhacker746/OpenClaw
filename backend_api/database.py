import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load the secret keys from the .env file
load_dotenv()

# Initialize the Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    raise ValueError("CRITICAL ERROR: Supabase credentials missing in .env file.")

supabase: Client = create_client(url, key)


def save_leads_to_db(city: str, category: str, leads: list, user_id: str):
    saved_count = 0
    for lead in leads:
        whatsapp = lead.get('WhatsApp Link', '')
        if not whatsapp or whatsapp == 'N/A':
            continue

        try:
            master_data = {
                "city": city.upper(),
                "category": category.upper(),
                "business_name": lead.get('Business Name', 'Unknown'),
                "review_count": lead.get('Review Count', 0),
                "website_status": lead.get('Website Faults', 'N/A'),
                "whatsapp_link": whatsapp,
                "ai_strength": lead.get('AI Strength', 'N/A'),
                "ai_weakness": lead.get('AI Weakness', 'N/A'),
                "pitch": lead.get('Pitch', '')
            }

            master_response = supabase.table("master_leads").upsert(master_data, on_conflict="whatsapp_link").execute()
            lead_id = master_response.data[0]['id']

            link_data = {
                "user_id": user_id,
                "lead_id": lead_id
            }
            supabase.table("user_unlocked_leads").upsert(link_data, on_conflict="user_id, lead_id").execute()
            saved_count += 1

        except Exception as e:
            print(f"[-] DB Link Error: {e}")
            continue

    print(f"[+] DATABASE: Successfully routed {saved_count} leads to User {user_id}'s Vault.")
    return saved_count


def get_user_vault(user_id: str):
    """
    Fetches leads from Supabase and formats the keys.
    Extracts the actual unlock date for calendar filtering.
    """
    try:
        # 👇 NEW: Added 'unlocked_at' to the select query!
        response = supabase.table('user_unlocked_leads') \
            .select('unlocked_at, master_leads(*)') \
            .eq('user_id', user_id) \
            .order('unlocked_at', desc=True) \
            .execute()
            
        formatted_leads = []
        for item in response.data:
            db_lead = item.get('master_leads') or {}
            
            # 👇 NEW: Grab the timestamp and split it to keep just the YYYY-MM-DD part
            raw_date = item.get('unlocked_at')
            clean_date = raw_date.split('T')[0] if raw_date else "Recent"
            
            formatted_leads.append({
                "Business Name": db_lead.get("business_name") or "Unknown",
                "WhatsApp Link": db_lead.get("whatsapp_link") or "N/A",
                "Website Link": "N/A", 
                "Review Count": db_lead.get("review_count") or 0,
                "Website Faults": db_lead.get("website_status") or "N/A",
                "AI Strength": db_lead.get("ai_strength") or "N/A",  
                "AI Weakness": db_lead.get("ai_weakness") or "N/A",  
                "Pitch": db_lead.get("pitch") or "No pitch generated.",
                "City": db_lead.get("city") or "Unknown",
                "Category": db_lead.get("category") or "Unknown",
                "date_scraped": clean_date # 👈 Passes the real date to React!
            })
                
        return formatted_leads
        
    except Exception as e:
        print(f"[-] Vault Retrieval Error: {e}")
        return []
    """
    Fetches leads from Supabase and formats the keys 
    back to exactly what the React frontend expects.
    """
    try:
        response = supabase.table('user_unlocked_leads') \
            .select('master_leads(*)') \
            .eq('user_id', user_id) \
            .order('unlocked_at', desc=True) \
            .execute()
            
        formatted_leads = []
        for item in response.data:
            db_lead = item.get('master_leads') or {}
            
            # Using 'or' guarantees that if Supabase sends a blank 'null', 
            # Python forces it into a safe string, preventing React from crashing!
            formatted_leads.append({
                "Business Name": db_lead.get("business_name") or "Unknown",
                "WhatsApp Link": db_lead.get("whatsapp_link") or "N/A",
                "Website Link": "N/A", 
                "Review Count": db_lead.get("review_count") or 0,
                "Website Faults": db_lead.get("website_status") or "N/A",
                "AI Strength": "N/A",  
                "AI Weakness": "N/A",  
                "Pitch": "AI Pitch not saved to cloud yet.",
                "City": db_lead.get("city") or "Unknown",
                "Category": db_lead.get("category") or "Unknown",
                "AI Strength": db_lead.get("ai_strength") or "N/A",  
                "AI Weakness": db_lead.get("ai_weakness") or "N/A",  
                "Pitch": db_lead.get("pitch") or "No pitch generated.",
                "City": db_lead.get("city") or "Unknown",
            })
                
        return formatted_leads
        
    except Exception as e:
        print(f"[-] Vault Retrieval Error: {e}")
        return []
    try:
        response = supabase.table('user_unlocked_leads') \
            .select('master_leads(*)') \
            .eq('user_id', user_id) \
            .order('unlocked_at', desc=True) \
            .execute()
            
        formatted_leads = []
        for item in response.data:
            db_lead = item.get('master_leads')
            if db_lead:
                formatted_leads.append({
                    "Business Name": db_lead.get("business_name", "Unknown"),
                    "WhatsApp Link": db_lead.get("whatsapp_link", "N/A"),
                    "Website Link": "N/A", 
                    "Review Count": db_lead.get("review_count", 0),
                    "Website Faults": db_lead.get("website_status", "N/A"),
                    "AI Strength": "N/A",  
                    "AI Weakness": "N/A",  
                    "Pitch": "AI Pitch not saved to cloud yet." 
                })
                
        return formatted_leads
        
    except Exception as e:
        print(f"[-] Vault Retrieval Error: {e}")
        return []

def delete_user_lead(user_id: str, whatsapp_link: str):
    """
    Severs the link between a user and a lead. 
    Does not delete the global lead, just removes it from the user's vault.
    """
    try:
        # Step 1: Look up the global Lead ID using their unique WhatsApp Link
        lead_response = supabase.table('master_leads').select('id').eq('whatsapp_link', whatsapp_link).execute()
        
        if not lead_response.data:
            return False
            
        lead_id = lead_response.data[0]['id']

        # Step 2: Delete the mapping link
        supabase.table('user_unlocked_leads') \
            .delete() \
            .match({'user_id': user_id, 'lead_id': lead_id}) \
            .execute()
            
        return True
    except Exception as e:
        print(f"[-] Delete Lead Error: {e}")
        return False
    """
    Severs the link between a user and a lead. 
    Does not delete the global lead, just removes it from the user's vault.
    """
    try:
        # Step 1: Look up the global Lead ID using their unique WhatsApp Link
        lead_response = supabase.table('master_leads').select('id').eq('whatsapp_link', whatsapp_link).execute()
        
        if not lead_response.data:
            return False
            
        lead_id = lead_response.data[0]['id']

        # Step 2: Delete the mapping link
        supabase.table('user_unlocked_leads') \
            .delete() \
            .match({'user_id': user_id, 'lead_id': lead_id}) \
            .execute()
            
        return True
    except Exception as e:
        print(f"[-] Delete Lead Error: {e}")
        return False