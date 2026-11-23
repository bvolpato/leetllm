#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Select article and passage visibility for the website and PDF book."""

from __future__ import annotations

import re
from typing import Any, Literal

ContentAudience = Literal["website", "book"]
ContentEdition = Literal["reader", "reference"]
MARKER_PREFIX = re.compile(r"<!--\s*leetllm\s*:?\s*(?:audience|edition)", re.IGNORECASE)
MARKER = re.compile(r"^<!--\s*leetllm:\s*(audience|edition):([a-z]+):(start|end)\s*-->$")


def _require_audience(audience: ContentAudience) -> None:
    if audience not in ("website", "book"):
        raise ValueError(f"Unknown content audience: {audience}")


def is_visible_to_audience(metadata: dict[str, Any], audience: ContentAudience) -> bool:
    _require_audience(audience)
    visibility = metadata.get("visibility", {})
    if not isinstance(visibility, dict):
        raise ValueError("Invalid content visibility: visibility must be an object")
    for key, value in visibility.items():
        if key not in ("website", "book"):
            raise ValueError(f'Invalid content visibility: unknown audience "{key}"')
        if not isinstance(value, bool):
            raise ValueError(f"Invalid content visibility: visibility.{key} must be a boolean")

    if metadata.get("hidden") is True or visibility.get(audience) is False:
        return False
    if audience == "book":
        if metadata.get("book") is False or metadata.get("in_book") is False or metadata.get("exclude_from_book") is True:
            return False
        tags = metadata.get("tags")
        if isinstance(tags, list) and any(tag in ("no-book", "skip-book") for tag in tags):
            return False
    return True


def _code_ranges(content: str) -> list[tuple[int, int]]:
    blocks: list[tuple[int, int]] = []
    offset = 0
    fence: tuple[str, int] | None = None
    containers: list[tuple[str, int]] = []
    paragraph = False
    for match in re.finditer(r"[^\r\n]*(?:\r\n|\r|\n|$)", content):
        line = match[0]
        if not line:
            continue
        body = line.rstrip("\r\n").expandtabs(4)
        matched = 0
        for kind, indent in containers:
            if kind == "quote":
                prefix = re.match(r"^ {0,3}> ?", body)
                if not prefix:
                    break
                body = body[prefix.end():]
            elif not body.strip():
                body = ""
            else:
                if not body.startswith(" " * indent):
                    break
                body = body[indent:]
            matched += 1
        if matched != len(containers):
            containers = containers[:matched]
            fence = None
            paragraph = False

        # Consume only existing containers inside a fence. List markers in code
        # cannot be interpreted as new containers or closing fence delimiters.
        if fence:
            closing = re.match(r"^ {0,3}(`{3,}|~{3,}) *$", body)
            blocks.append((offset, offset + len(line)))
            if closing and closing[1][0] == fence[0] and len(closing[1]) >= fence[1]:
                fence = None
        else:
            while body:
                if re.match(r"^ {0,3}(?:(?:\* *){3,}|(?:- *){3,}|(?:_ *){3,})$", body):
                    break
                quote = re.match(r"^ {0,3}> ?", body)
                if quote:
                    containers.append(("quote", 0))
                    body = body[quote.end():]
                    paragraph = False
                    continue
                item = re.match(r"^( {0,3})([-+*]|\d{1,9}[.)])(?:( +)|$)", body)
                if not item or (paragraph and item[2][0].isdigit() and int(item[2][:-1]) != 1):
                    break
                spaces = len(item[3] or "")
                indent = len(item[1]) + len(item[2]) + (1 if spaces == 0 or spaces > 4 else spaces)
                containers.append(("list", indent))
                body = body[indent:]
                paragraph = False
            opening = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", body)
            if opening and (opening[1][0] != "`" or "`" not in opening[2]):
                blocks.append((offset, offset + len(line)))
                fence = (opening[1][0], len(opening[1]))
                paragraph = False
            elif re.match(r"^ {4}", body) and not paragraph:
                blocks.append((offset, offset + len(line)))
            else:
                paragraph = bool(body.strip()) and not any(
                    re.match(pattern, body) for pattern in (
                        r"^ {0,3}#{1,6}(?:[ \t]|$)",
                        r"^ {0,3}<!--.*-->\s*$",
                        r"^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$",
                    )
                )
        offset += len(line)

    ranges: list[tuple[int, int]] = []

    def add_inline_ranges(start: int, end: int) -> None:
        text = content[start:end]
        ticks = list(re.finditer(r"`+", text))
        index = 0
        while index < len(ticks):
            opening = ticks[index]
            preceding = re.search(r"\\+$", text[:opening.start()])
            if preceding and len(preceding[0]) % 2:
                index += 1
                continue
            for close in range(index + 1, len(ticks)):
                closing = ticks[close]
                if re.search(r"\r?\n[ \t]*\r?\n", text[opening.start():closing.start()]):
                    break
                if len(closing[0]) == len(opening[0]):
                    ranges.append((start + opening.start(), start + closing.end()))
                    index = close
                    break
            index += 1

    cursor = 0
    for start, end in blocks:
        add_inline_ranges(cursor, start)
        ranges.append((start, end))
        cursor = end
    add_inline_ranges(cursor, len(content))
    return ranges


def filter_content_for_audience(content: str, audience: ContentAudience, source: str = "<content>", edition: ContentEdition = "reference", preserve_offsets: bool = False) -> str:
    _require_audience(audience)
    if edition not in ("reader", "reference"):
        raise ValueError(f"Unknown content edition: {edition}")
    if not MARKER_PREFIX.search(content):
        return content
    ranges = _code_ranges(content)
    stack: list[tuple[str, str, int]] = []
    result: list[str] = []
    cursor = 0
    range_index = 0

    def visible() -> bool:
        return all(target == (audience if kind == "audience" else edition) for kind, target, _ in stack)

    def fail(line: int, message: str) -> None:
        raise ValueError(f"{source}:{line}: {message}")

    def append(start: int, end: int, include: bool) -> None:
        segment = content[start:end]
        if include:
            result.append(segment)
        elif preserve_offsets:
            result.append(re.sub(r"[^\r\n]", " ", segment))

    for match in MARKER_PREFIX.finditer(content):
        start = match.start()
        if start < cursor:
            continue
        while range_index < len(ranges) and ranges[range_index][1] <= start:
            range_index += 1
        if range_index < len(ranges) and ranges[range_index][0] <= start:
            continue

        line = len(re.split(r"\r\n|\r|\n", content[:start]))
        end = content.find("-->", start + 4)
        if end < 0:
            fail(line, "Unterminated audience marker")
        parsed = MARKER.fullmatch(content[start:end + 3])
        if not parsed or parsed[2] not in (("book", "website") if parsed[1] == "audience" else ("reader", "reference")):
            fail(line, "Invalid edition marker; expected edition:reader:start/end or edition:reference:start/end"
                 if parsed and parsed[1] == "edition" else "Invalid audience marker; expected audience:book:start/end or audience:website:start/end")
        append(cursor, start, visible())
        append(start, end + 3, False)

        kind, target, action = parsed.groups()
        if action == "start":
            stack.append((kind, target, line))
        else:
            if not stack:
                fail(line, f"Unexpected {kind}:{target}:end without a start marker")
            opening_kind, opening, opening_line = stack[-1]
            if opening_kind != kind or opening != target:
                fail(line, f"Mismatched {kind}:{target}:end; {opening_kind}:{opening}:start opened on line {opening_line}")
            stack.pop()
        cursor = end + 3

    if stack:
        kind, opening, line = stack[-1]
        fail(line, f"Unclosed {kind}:{opening}:start marker")
    append(cursor, len(content), visible())
    return "".join(result)
