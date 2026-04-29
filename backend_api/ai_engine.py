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
        prompt = f"Analyze these reviews for {shop_name}:\n{reviews_text}\n1. Identify biggest strength.\n2. Identify weakness (lack of website).\n3. Write a friendly sales pitch in Roman Urdu offering web development. End with: 'Agar aap ready hain, toh let's start: {sadapay_link}'\nOutput strictly as JSON: {{'strength': '...', 'weakness': '...', 'pitch': '...'}}"
    else:
        fault_bullet_points = "\n".join([f"- {f}" for f in faults])
        prompt = f"Analyze these reviews for {shop_name}:\n{reviews_text}\nAlso note these website faults: {fault_bullet_points}\n1. Identify biggest strength.\n2. Identify weakness (the website faults).\n3. Write a friendly sales pitch in Roman Urdu offering website redesign to fix these faults. End with: 'Agar aap ready hain, toh let's start: {sadapay_link}'\nOutput strictly as JSON: {{'strength': '...', 'weakness': '...', 'pitch': '...'}}"

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