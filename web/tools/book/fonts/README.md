# Book fonts

The book embeds these fonts, so a build looks the same on every machine.

| Font | Use | License | Source |
|---|---|---|---|
| Source Serif 4 | Body text and titles | SIL Open Font License 1.1 (`OFL-SourceSerif4.txt`) | https://github.com/adobe-fonts/source-serif |
| Inter | Headings, captions, tables, and page furniture | SIL Open Font License 1.1 (`OFL-1.1.txt`). Copyright 2016 The Inter Project Authors. | https://github.com/rsms/inter |
| JetBrains Mono | Code | SIL Open Font License 1.1 (`OFL-1.1.txt`). Copyright 2020 The JetBrains Mono Project Authors. | https://github.com/JetBrains/JetBrainsMono |
| Noto Sans (subset) | Latin ligatures and modifier letters that the main fonts lack, as `BookFallbackSymbols-Regular.ttf` | SIL Open Font License 1.1 (`OFL-NotoSans.txt`) | https://github.com/notofonts/latin-greek-cyrillic |
| Noto Sans JP (subset) | Japanese and Chinese characters in tokenizer examples, as `BookFallbackCJK-Regular.ttf` | SIL Open Font License 1.1 (`OFL-NotoSansJP.txt`) | https://github.com/notofonts/noto-cjk |
| Noto Emoji (subset) | Emoji in tokenizer examples, as `BookFallbackEmoji-Regular.ttf` | SIL Open Font License 1.1 (`OFL-NotoEmoji.txt`) | https://github.com/googlefonts/noto-emoji |

The Source Serif 4 files are static instances cut from the variable fonts by `scripts/build-book-fonts.py`, because the print pipeline cannot embed a variable font as a normal TrueType subset.
