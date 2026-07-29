import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from app.services.exports import CsvExportService


class CsvExportServiceTests(unittest.TestCase):
    def test_export_uses_configured_directory_and_sanitized_filename(self):
        with TemporaryDirectory() as directory:
            service = CsvExportService(Path(directory))
            destination = service.export(
                [{"Business Name": "Example"}],
                category="Coffee / Cafes",
                city="Wah Cantt",
            )

            self.assertIsNotNone(destination)
            self.assertEqual(
                destination.name,
                "ServerBackup_Coffee_Cafes_Wah_Cantt.csv",
            )
            self.assertTrue(destination.exists())

    def test_export_failure_is_best_effort_and_never_raises(self):
        with TemporaryDirectory() as directory:
            service = CsvExportService(Path(directory))
            with patch(
                "app.services.exports.pd.DataFrame.to_csv",
                side_effect=OSError("read-only"),
            ):
                result = service.export(
                    [{"Business Name": "Example"}],
                    category="Gym",
                    city="Taxila",
                )

        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
