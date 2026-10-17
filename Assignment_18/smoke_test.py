"""
Smoke Test for TextAnalyticsProcessor.
Runs basic sanity checks to ensure the environment and modules function correctly.
"""

from text_processor import TextAnalyticsProcessor


def run_smoke_test() -> bool:
    print("Running smoke tests...")
    try:
        processor = TextAnalyticsProcessor()
        
        # Sanity check 1: Text analysis
        res_text = processor.analyze_text("Smoke test 123!")
        assert res_text["char_count"] > 0, "Text analysis failed basic char count."
        
        # Sanity check 2: Numeric metrics
        res_num = processor.compute_numeric_metrics([10.0, 20.0, 30.0])
        assert res_num["sum"] == 60.0, "Numeric sum calculation failed."
        
        print("All smoke tests passed successfully!")
        return True
    except Exception as e:
        print(f"Smoke test failed with error: {e}")
        return False


if __name__ == "__main__":
    success = run_smoke_test()
    exit(0 if success else 1)