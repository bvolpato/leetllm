#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
Validate article metadata against the LeetLLM metadata schema.

Usage:
    uv run scripts/validate-metadata.py              # validate all articles
    uv run scripts/validate-metadata.py --article X  # validate a single article dir name

Exit codes:
    0 — all articles pass validation
    1 — one or more validation errors found
"""

import argparse
import json
import os
import re
import sys
from datetime import date
from pathlib import Path

from content_bundle import find_content_bundles_by_slug, iter_content_bundles, load_content_bundle
from content_audience import filter_content_for_audience, is_visible_to_audience

CONTENT_DIR = Path(__file__).resolve().parent.parent / "web" / "src" / "content"
SCHEMA_PATH = CONTENT_DIR / "metadata.schema.json"
BLOG_SCHEMA_PATH = CONTENT_DIR / "blog" / "metadata.schema.json"
DERIVED_METADATA_FIELDS = ("references", "timeEstimate", "isPremium")
NON_ARTICLE_SECTIONS = {"glossary", "practice"}


# ── Lightweight JSON-Schema–ish validator ────────────────────────────
# We intentionally avoid external dependencies (no pip install needed)
# so this runs anywhere Python 3.8+ is available.


def validate_type(value, expected, path):
    """Check a value matches the expected JSON-Schema type string."""
    mapping = {
        "string": str,
        "integer": int,
        "boolean": bool,
        "array": list,
        "object": dict,
    }
    if expected not in mapping:
        return []
    # In JSON, booleans are not integers — but Python isinstance(True, int) is True
    if expected == "integer" and isinstance(value, bool):
        return [f"{path}: expected integer, got boolean"]
    if not isinstance(value, mapping[expected]):
        return [f"{path}: expected {expected}, got {type(value).__name__}"]
    return []


def validate_schema(value, schema, path="$"):
    """Recursively validate a value against a JSON-Schema-like definition."""
    errors = []

    # Handle oneOf
    if "oneOf" in schema:
        branch_errors = []
        matched = False
        for branch in schema["oneOf"]:
            errs = validate_schema(value, branch, path)
            if not errs:
                matched = True
                break
            branch_errors.extend(errs)
        if not matched:
            errors.append(f"{path}: did not match any oneOf branch")
        return errors

    # Type check
    if "type" in schema:
        type_errors = validate_type(value, schema["type"], path)
        if type_errors:
            return type_errors  # Early exit — deeper checks need correct type

    # Enum
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: '{value}' not in enum {schema['enum']}")

    # String constraints
    if schema.get("type") == "string" and isinstance(value, str):
        if "minLength" in schema and len(value) < schema["minLength"]:
            errors.append(f"{path}: string too short ({len(value)} < {schema['minLength']})")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            errors.append(f"{path}: string too long ({len(value)} > {schema['maxLength']})")
        if "pattern" in schema and not re.match(schema["pattern"], value):
            errors.append(f"{path}: '{value}' does not match pattern /{schema['pattern']}/")

    # Number constraints
    if schema.get("type") == "integer" and isinstance(value, int):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {value} < minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: {value} > maximum {schema['maximum']}")

    # Array constraints
    if schema.get("type") == "array" and isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{path}: array too short ({len(value)} < {schema['minItems']})")
        if schema.get("uniqueItems"):
            normalized_items = [json.dumps(item, sort_keys=True) for item in value]
            if len(normalized_items) != len(set(normalized_items)):
                errors.append(f"{path}: array items must be unique")
        if "items" in schema:
            for i, item in enumerate(value):
                errors.extend(validate_schema(item, schema["items"], f"{path}[{i}]"))

    # Object constraints
    if schema.get("type") == "object" and isinstance(value, dict):
        # Required fields
        for req in schema.get("required", []):
            if req not in value:
                errors.append(f"{path}: missing required field '{req}'")
        # Property validation
        properties = schema.get("properties", {})
        additional = schema.get("additionalProperties", True)
        for key, val in value.items():
            if key in properties:
                errors.extend(validate_schema(val, properties[key], f"{path}.{key}"))
            elif additional is False:
                errors.append(f"{path}: unexpected field '{key}'")
            elif isinstance(additional, dict):
                # additionalProperties as a schema (for reference objects)
                errors.extend(validate_schema(val, additional, f"{path}.{key}"))

    return errors


# ── Article-specific checks beyond the schema ───────────────────────

def validate_blog_freshness(data: dict, today: date | None = None) -> list[str]:
    """Validate paired freshness dates and reject expired published posts."""
    verified_value = data.get("verifiedAt")
    refresh_value = data.get("refreshAfter")

    if (verified_value is None) != (refresh_value is None):
        return ["$.verifiedAt and $.refreshAfter must be provided together"]
    if verified_value is None:
        return []

    try:
        verified_at = date.fromisoformat(verified_value)
    except (TypeError, ValueError):
        return ["$.verifiedAt: expected date in YYYY-MM-DD format"]
    try:
        refresh_after = date.fromisoformat(refresh_value)
    except (TypeError, ValueError):
        return ["$.refreshAfter: expected date in YYYY-MM-DD format"]

    errors: list[str] = []
    if refresh_after <= verified_at:
        errors.append("$.refreshAfter must be later than $.verifiedAt")

    is_public = not data.get("draft") and not data.get("private")
    current_date = today or date.today()
    if is_public and refresh_after < current_date:
        errors.append(
            f"$.refreshAfter: published blog freshness expired on {refresh_after.isoformat()} "
            f"(current date {current_date.isoformat()})"
        )

    return errors

def validate_article(article_dir: Path, schema: dict, is_blog: bool = False):
    """Validate a single article's metadata with schema + semantic checks."""
    content_path = article_dir / "content.md"
    slug = article_dir.name
    errors = []

    # 1. Parse JSON
    try:
        bundle = load_content_bundle(article_dir)
    except (json.JSONDecodeError, ValueError) as e:
        return [str(e)]

    if bundle is None:
        return [f"Missing content bundle in {article_dir}"]

    data = bundle.metadata

    # 2. Schema validation
    errors.extend(validate_schema(data, schema))
    if is_blog:
        errors.extend(validate_blog_freshness(data))

    # 3. Semantic checks: slug == directory name
    #    For blog posts, the id can have a 'blog-' prefix so we only check slug
    if not is_blog and data.get("id") != slug:
        errors.append(f"$.id: '{data.get('id')}' does not match directory name '{slug}'")
    if data.get("slug") != slug:
        errors.append(f"$.slug: '{data.get('slug')}' does not match directory name '{slug}'")

    # 4. content.md must exist and be non-empty
    if not content_path.exists():
        errors.append(f"Missing content.md")
    elif content_path.stat().st_size == 0:
        errors.append(f"content.md is empty (0 bytes)")

    # 5. Derived fields should not be persisted in article metadata.
    for field in DERIVED_METADATA_FIELDS:
        if field in data:
            errors.append(f"$.{field}: derived from content; remove from metadata")

    # 6. content.md must NOT have a "Footnotes" heading (citations use [^key]
    #    superscripts that link to the References card — no separate section)
    if content_path.exists():
        try:
            filter_content_for_audience(bundle.source_body or bundle.body, "website", str(content_path))
            is_visible_to_audience(data, "website")
        except ValueError as exc:
            errors.append(str(exc))
        for line in bundle.body.splitlines():
            stripped = line.strip()
            if stripped in ("# Footnotes", "## Footnotes", "### Footnotes"):
                errors.append(
                    f"content.md has a '{stripped}' heading — remove it. "
                    f"Citations should use [^key] which link to the References card."
                )
                break

    return errors


def is_article_bundle(article_dir: Path) -> bool:
    return article_dir.parent.name not in NON_ARTICLE_SECTIONS


def main():
    parser = argparse.ArgumentParser(description="Validate LeetLLM article metadata")
    parser.add_argument("--article", help="Validate a single article by directory name")
    args = parser.parse_args()

    # Load schemas
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)

    blog_schema = None
    if BLOG_SCHEMA_PATH.exists():
        with open(BLOG_SCHEMA_PATH) as f:
            blog_schema = json.load(f)

    # Find articles to validate
    if args.article:
        # Find the specific article across all sections
        matches = [bundle for bundle in find_content_bundles_by_slug(CONTENT_DIR, args.article) if is_article_bundle(bundle.article_dir)]
        if not matches:
            print(f"❌ Article '{args.article}' not found in any section")
            sys.exit(1)
        article_dirs = [m.article_dir for m in matches]
    else:
        article_dirs = [bundle.article_dir for bundle in iter_content_bundles(CONTENT_DIR) if is_article_bundle(bundle.article_dir)]

    total_errors = 0
    articles_with_errors = 0
    articles_ok = 0

    for article_dir in article_dirs:
        section = article_dir.parent.name
        slug = article_dir.name
        label = f"{section}/{slug}"

        # Use the blog schema for posts under the blog/ directory
        is_blog = section == "blog"
        active_schema = blog_schema if (is_blog and blog_schema) else schema
        errors = validate_article(article_dir, active_schema, is_blog=is_blog)

        if errors:
            articles_with_errors += 1
            total_errors += len(errors)
            print(f"  ❌ {label}")
            for err in errors:
                print(f"     {err}")
        else:
            articles_ok += 1

    # Summary
    print()
    if total_errors == 0:
        print(f"  ✅ All {articles_ok} article(s) pass schema validation")
    else:
        print(f"  ❌ {total_errors} error(s) in {articles_with_errors} article(s), {articles_ok} OK")

    sys.exit(1 if total_errors > 0 else 0)


if __name__ == "__main__":
    main()
