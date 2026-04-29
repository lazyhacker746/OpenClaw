import json
import time
from openai import OpenAI

# Configured for Local Ollama
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"
)


def generate_pitch(shop_name, reviews, sadapay_link, mode, faults=None, use_ai=True, max_retries=2):
    if not use_ai:
        if mode == "1":
            return "Highly Rated", "No Online Catalog", f"Assalam o Alaikum {shop_name} team! Aapka business map par bohot highly rated hai, but aapka online catalog missing hai. Agar aap ready hain apne business ko digital karne ke liye, toh let's start: {sadapay_link}"
        else:
            fault_str = ", ".join(faults) if faults else "outdated design"
            return "Established Business", fault_str, f"Assalam o Alaikum {shop_name} team! Aapki website mein kuch technical issues hain ({fault_str}). Main inhein fix kar ke sales boost kar sakta hoon. Let's start: {sadapay_link}"

    reviews_text = "\n".join([f"- {r}" for r in reviews])

    if mode == "1":
        prompt = f"""
        You are a highly professional web developer in Pakistan sending a WhatsApp pitch. 
        Write a short, natural-sounding message in conversational Roman Urdu (a mix of Urdu and English).
        
        RULES FOR ROMAN URDU:
        - Keep it casual but professional. Use normal words like "bohat achi", "sales", "grow".
        - DO NOT use overly dramatic words like "Mere pyare", "atrangi", or "ehsas".
        - Keep it under 3-4 sentences.
        
        EXAMPLE OF GOOD TONE: 
        "Assalam o Alaikum [Name] team! Mashallah aapke reviews bohat zabardast hain. Lekin online catalog/website na hone ki wajah se aap digital customers loose kar rahay hain. Hum aapke liye ek professional website design kar sakte hain taake aapki sales aur boost hon."

        Now, write a custom pitch for {shop_name} using this specific feedback from their reviews: {reviews_text}
        
        End the message EXACTLY with: 'Agar aap ready hain, toh let's start: {sadapay_link}'
        Output strictly as JSON: {{'strength': '...', 'weakness': '...', 'pitch': '...'}}
        """
    else:
        fault_bullet_points = "\n".join([f"- {f}" for f in faults])
        prompt = f"""
        You are a highly professional web developer in Pakistan sending a WhatsApp pitch. 
        Write a short, natural-sounding message in conversational Roman Urdu (a mix of Urdu and English).
        
        RULES FOR ROMAN URDU:
        - Keep it casual but professional. 
        - DO NOT use overly dramatic words.
        
        EXAMPLE OF GOOD TONE: 
        "Assalam o Alaikum [Name] team! Mashallah aapka business bohat acha chal raha hai. Lekin main ne aapki website check ki aur usme kuch technical maslay hain. Hum isko redesign kar ke aapki digital presence ko behtar bana sakte hain."

        Now, write a custom pitch for {shop_name} mentioning these specific website faults: {fault_bullet_points}
        Also include a compliment based on their reviews: {reviews_text}
        
        End the message EXACTLY with: 'Agar aap ready hain, toh let's start: {sadapay_link}'
        Output strictly as JSON: {{'strength': '...', 'weakness': '...', 'pitch': '...'}}
        """
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="llama3",
                messages=[
                    {"role": "system",
                     "content": "You are a helpful sales assistant. Always reply in valid JSON format."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            return result.get('strength', 'N/A'), result.get('weakness', 'N/A'), result.get('pitch', 'N/A')

        except Exception as e:
            print(f"  [!] AI Error on attempt {attempt + 1}: {e}")
            time.sleep(2)

    return "N/A", "N/A", "Pitch generation failed."
