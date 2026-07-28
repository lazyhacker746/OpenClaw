"""Thin compatibility adapter for the existing AI pitch engine."""

from ai_engine import generate_pitch as _legacy_generate_pitch


def generate_pitch(
    shop_name,
    reviews,
    sadapay_link,
    mode,
    faults=None,
    use_ai=True,
    max_retries=2,
):
    """Delegate to the unchanged July 15-compatible prompt implementation."""
    return _legacy_generate_pitch(
        shop_name,
        reviews,
        sadapay_link,
        mode,
        faults,
        use_ai,
        max_retries,
    )
