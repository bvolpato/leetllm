#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["pypdf>=6,<7", "pypdfium2>=5,<6", "reportlab>=4,<5"]
# ///
"""The index must find a term and its plural without finding a different word."""
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("merge_book", Path(__file__).resolve().parents[1] / "merge-book.py")
merge_book = importlib.util.module_from_spec(spec)
spec.loader.exec_module(merge_book)


class IndexPatternTest(unittest.TestCase):
    def test_trie_does_not_match_the_verb_tries(self):
        pattern = merge_book.index_term_pattern("Trie")
        self.assertIsNone(pattern.search("The client tries again."))
        self.assertIsNotNone(pattern.search("Store the keys in a trie."))

    def test_a_normal_term_finds_its_plural_and_ignores_case(self):
        pattern = merge_book.index_term_pattern("Gateway")
        self.assertIsNotNone(pattern.search("Two gateways sit in front."))

    def test_an_acronym_matches_exactly(self):
        pattern = merge_book.index_term_pattern("RAG")
        self.assertIsNotNone(pattern.search("A RAG system."))
        self.assertIsNone(pattern.search("An old rag."))

    def test_an_acronym_finds_its_plural(self):
        self.assertIsNotNone(merge_book.index_term_pattern("GPU").search("Four GPUs."))

    def test_a_mixed_case_name_does_not_match_the_ordinary_word(self):
        pattern = merge_book.index_term_pattern("ZeRO")
        self.assertIsNone(pattern.search("The count fell to zero."))
        self.assertIsNotNone(pattern.search("ZeRO splits the optimizer state."))

    def test_a_definition_phrase_survives_a_line_break(self):
        pattern = merge_book.index_phrase_pattern("A model card records")
        self.assertIsNotNone(pattern.search("A model\ncard records the use."))

    def test_a_word_inside_another_does_not_match(self):
        self.assertIsNone(merge_book.index_term_pattern("Token").search("a tokenizer"))


if __name__ == "__main__":
    unittest.main()
