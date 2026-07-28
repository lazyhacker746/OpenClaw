import unittest

from app.api.schemas import LeadRequest


class SchemaCompatibilityTests(unittest.TestCase):
    def test_harmless_extra_request_fields_remain_accepted(self):
        request = LeadRequest(
            city="Taxila",
            category="Gym",
            target_leads=1,
            min_reviews=20,
            mode="1",
            use_ai=False,
            sadapay_link="none",
            user_id="user-1",
            harmless_future_field="accepted",
        )

        self.assertEqual(request.city, "Taxila")
        self.assertNotIn("harmless_future_field", request.model_dump())


if __name__ == "__main__":
    unittest.main()
