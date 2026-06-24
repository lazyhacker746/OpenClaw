import re


def validate_inputs(payload):
    errors = []

    city = str(payload.get("city", "")).strip()
    category = str(payload.get("category", "")).strip()
    target_leads = payload.get("target_leads", 10)
    min_reviews = payload.get("min_reviews", 50)
    mode = str(payload.get("mode", "1")).strip()
    use_ai = bool(payload.get("use_ai", True))
    sadapay_link = str(payload.get("sadapay_link", "")).strip()

    if not city or not re.match(r"^[a-zA-Z\s]+$", city):
        errors.append("City must contain only letters and spaces.")
    if not category or not re.match(r"^[a-zA-Z\s]+$", category):
        errors.append("Category must contain only letters and spaces.")

    try:
        target_leads = int(target_leads)
        if target_leads <= 0 or target_leads > 100:
            errors.append("Target leads must be between 1 and 100.")
    except ValueError:
        errors.append("Target leads must be a valid number.")

    try:
        min_reviews = int(min_reviews)
        if min_reviews < 0:
            errors.append("Minimum reviews cannot be negative.")
    except ValueError:
        errors.append("Minimum reviews must be a valid number.")

    if mode not in ["1", "2"]:
        errors.append("Mode must be '1' (No Website) or '2' (Website Redesign).")

    clean_data = {
        "city": city,
        "category": category,
        "target_leads": target_leads if not errors else 10,
        "min_reviews": min_reviews if not errors else 50,
        "mode": mode,
        "use_ai": use_ai,
        "sadapay_link": sadapay_link
    }

    return errors, clean_data