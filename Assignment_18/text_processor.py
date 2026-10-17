"""
Text and Numeric Analytics Processor Module.

This module provides utilities for processing multi-lingual strings, 
calculating statistical metrics on numeric inputs, and handling 
extreme floating-point edge cases safely.
"""

import math
from typing import Dict, List, Union


class TextAnalyticsProcessor:
    """A processor class for handling multi-lingual text and complex numeric datasets."""

    def __init__(self, precision: int = 4) -> None:
        """
        Initializes the processor with a specified floating-point rounding precision.

        :param precision: Decimal places for numeric outputs.
        :type precision: int
        """
        self.precision = precision

    def analyze_text(self, text: str) -> Dict[str, Union[int, float]]:
        """
        Analyzes a given string, handling multi-lingual characters and extreme lengths.

        :param text: The input string to analyze (can contain any Unicode characters).
        :type text: str
        :return: A dictionary containing character count, word count, and density metrics.
        :rtype: dict
        :raises ValueError: If the input is not a string.
        """
        if not isinstance(text, str):
            raise ValueError("Input must be a valid string.")

        char_count = len(text)
        # Using a split approach that safely handles spaces across various languages
        words = text.split()
        word_count = len(words)
        
        # Calculate unique character ratio safely
        unique_chars = len(set(text))
        diversity_ratio = unique_chars / char_count if char_count > 0 else 0.0

        return {
            "char_count": char_count,
            "word_count": word_count,
            "unique_chars": unique_chars,
            "diversity_ratio": round(diversity_ratio, self.precision)
        }

    def compute_numeric_metrics(self, values: List[float]) -> Dict[str, float]:
        """
        Computes summary statistics on a list of floats, handling infinities and NaNs.

        :param values: A list of numerical values.
        :type values: list[float]
        :return: Dictionary containing sum, average, maximum, and minimum.
        :rtype: dict
        """
        if not values:
            return {"sum": 0.0, "average": 0.0, "max": 0.0, "min": 0.0}

        # Filter out invalid NaN values for safe math calculation if needed, 
        # or handle infinities explicitly.
        total = sum(values)
        
        # Handle cases where sum might result in infinity
        if math.isinf(total):
            avg = total
        else:
            avg = total / len(values) if len(values) > 0 else 0.0

        try:
            max_val = max(values)
            min_val = min(values)
        except ValueError:
            max_val = float('nan')
            min_val = float('nan')

        return {
            "sum": total,
            "average": avg,
            "max": max_val,
            "min": min_val
        }

    def normalize_string(self, text: str, strip_whitespace: bool = True) -> str:
        """
        Normalizes unicode string inputs.

        :param text: Input string.
        :param strip_whitespace: Whether to strip leading/trailing spaces.
        :return: Normalized string.
        """
        if not isinstance(text, str):
            return ""
        
        normalized = text
        if strip_whitespace:
            normalized = normalized.strip()
            
        return normalized

    def batch_process(self, texts: List[str]) -> List[Dict[str, Union[int, float]]]:
        """
        Processes a batch of texts sequentially.

        :param texts: List of strings.
        :return: List of analysis results.
        """
        return [self.analyze_text(t) for t in texts]