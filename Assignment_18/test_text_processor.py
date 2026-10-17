import unittest
import math
from text_processor import TextAnalyticsProcessor


class TestTextAnalyticsProcessor(unittest.TestCase):
    """Test suite for TextAnalyticsProcessor covering standard and extreme edge cases."""

    def setUp(self) -> None:
        """Set up test fixtures before each test method."""
        self.processor = TextAnalyticsProcessor(precision=2)

    def test_standard_ascii_text(self):
        """Test basic English string analysis."""
        result = self.processor.analyze_text("Hello world python")
        self.assertEqual(result["char_count"], 18)
        self.assertEqual(result["word_count"], 3)
        self.assertGreater(result["diversity_ratio"], 0.0)

    def test_multilingual_unicode_characters(self):
        """Test handling of non-ASCII characters (Chinese, Arabic)."""
        multi_text = "你好 世界 مرحبا بالعالم مهارات"  # 5 distinct words separated by spaces
        result = self.processor.analyze_text(multi_text)
        
        self.assertGreater(result["char_count"], 0)
        self.assertGreater(result["unique_chars"], 0)
        self.assertEqual(result["word_count"], 5)  

    def test_extremely_long_string_input(self):
        """Test performance and correctness with a very long string input (1 million characters)."""
        long_string = "a" * 1_000_000 + " b" * 100_000
        result = self.processor.analyze_text(long_string)
        
        self.assertEqual(result["char_count"], len(long_string))
        self.assertGreater(result["word_count"], 0)

    def test_numeric_metrics_with_infinities(self):
        """Test floating-point positive and negative infinity handling."""
        extreme_values = [float('inf'), 100.5, -50.2, float('-inf')]
        metrics = self.processor.compute_numeric_metrics(extreme_values)
        
        # Sum of positive and negative infinity results in NaN or inf depending on ordering, 
        # let's verify that it safely computes without crashing.
        self.assertIn("sum", metrics)
        self.assertIn("average", metrics)
        self.assertTrue(math.isnan(metrics["sum"]) or math.isinf(metrics["sum"]))

    def test_numeric_metrics_with_nan(self):
        """Test handling of NaN (Not a Number) values in lists."""
        values = [1.0, 2.0, float('nan'), 4.0]
        metrics = self.processor.compute_numeric_metrics(values)
        self.assertIsInstance(metrics, dict)

    def test_invalid_input_type(self):
        """Test that non-string inputs raise ValueError during text analysis."""
        with self.assertRaises(ValueError):
            self.processor.analyze_text(12345)  # type: ignore


if __name__ == "__main__":
    unittest.main()