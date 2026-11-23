#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools>=4.50,<5", "skia-pathops>=0.8"]
# ///
"""Cut the static fonts the book embeds from the variable fonts.

The print pipeline needs static fonts. Chromium's PDF backend cannot embed a
variable font as a normal TrueType subset, which would turn its text into
vector outlines or Type 3 glyphs.

Run: uv run scripts/build-book-fonts.py --serif SourceSerif4.ttf SourceSerif4-Italic.ttf
     uv run scripts/build-book-fonts.py --symbols NotoSans.ttf --cjk NotoSansJP.ttf --emoji NotoEmoji.ttf
All inputs are the variable TTFs from the google/fonts repository.

The fallback fonts hold only the few characters that the body fonts lack, such as
the Japanese in the tokenization chapter. Add a character to its set when a
chapter starts to use it. Otherwise that character uses a system font, and the
build no longer looks the same on every machine.
"""

import argparse
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import OverlapMode, instantiateVariableFont

OUT = Path(__file__).resolve().parent.parent / "web" / "tools" / "book" / "fonts"

# Text cuts use the 10.5 point optical size, which is sturdy enough for print.
# Display cuts use a large optical size, with finer hairlines for chapter titles.
INSTANCES = [
    ("SourceSerif4-Regular", "roman", 10.5, 400),
    ("SourceSerif4-Semibold", "roman", 10.5, 600),
    ("SourceSerif4-Italic", "italic", 10.5, 400),
    ("SourceSerif4-SemiboldItalic", "italic", 10.5, 600),
    ("SourceSerif4Display-Light", "roman", 48, 300),
    ("SourceSerif4Display-Regular", "roman", 48, 400),
    ("SourceSerif4Display-LightItalic", "italic", 48, 300),
]


# Kana plus the ideographs and greetings that tokenizer examples tend to use.
CJK_TEXT = "".join(chr(code) for code in (*range(0x3040, 0x30A0), *range(0x30A0, 0x3100))) + "\u3001\u3002関数名日本語中文世界你好学習言葉人工知能"
# Latin ligatures and modifier letters, such as the transpose mark in plain-text math.
SYMBOLS_TEXT = "".join(chr(code) for code in (*range(0xFB00, 0xFB07), *range(0x1D2C, 0x1D6B), *range(0x1D9B, 0x1DC0)))
EMOJI_TEXT = "\u2728\u2705\u274C\u26A0\u2B50\U0001F600\U0001F680\U0001F44D\U0001F525\U0001F916"


def cut_fallback(path: str, name: str, text: str) -> None:
    source = TTFont(path)
    axes = {axis.axisTag: (400 if axis.axisTag == "wght" else axis.defaultValue) for axis in source["fvar"].axes}
    font = instantiateVariableFont(source, axes, overlap=OverlapMode.REMOVE_AND_IGNORE_ERRORS)
    options = Options()
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    # The source names describe its default instance, which this cut is not.
    font["name"].setName(name, 6, 3, 1, 0x409)
    font["name"].setName(name, 4, 3, 1, 0x409)
    font.save(OUT / f"{name}.ttf")
    print(f"{name}.ttf {(OUT / f'{name}.ttf').stat().st_size // 1024} KB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--serif", nargs=2, metavar=("ROMAN", "ITALIC"))
    parser.add_argument("--symbols")
    parser.add_argument("--cjk")
    parser.add_argument("--emoji")
    args = parser.parse_args()
    if not (args.serif or args.symbols or args.cjk or args.emoji):
        parser.error("name at least one of --serif, --symbols, --cjk, or --emoji")
    OUT.mkdir(parents=True, exist_ok=True)
    if args.symbols:
        cut_fallback(args.symbols, "BookFallbackSymbols-Regular", SYMBOLS_TEXT)
    if args.cjk:
        cut_fallback(args.cjk, "BookFallbackCJK-Regular", CJK_TEXT)
    if args.emoji:
        cut_fallback(args.emoji, "BookFallbackEmoji-Regular", EMOJI_TEXT)
    for name, style, optical, weight in INSTANCES if args.serif else ():
        source = TTFont(args.serif[0] if style == "roman" else args.serif[1])
        font = instantiateVariableFont(source, {"opsz": optical, "wght": weight}, overlap=OverlapMode.REMOVE_AND_IGNORE_ERRORS)
        font.save(OUT / f"{name}.ttf")
        print(f"{name}.ttf {(OUT / f'{name}.ttf').stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
