#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Generate stable sitemap lastmod dates and content slug aliases."""

from __future__ import annotations

import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from content_bundle import iter_content_bundles


REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_ROOT = REPO_ROOT / "web" / "src" / "content"
OUTPUT_PATH = REPO_ROOT / "web" / "src" / "generated" / "content-lastmod.json"
ALIASES_OUTPUT_PATH = REPO_ROOT / "web" / "src" / "generated" / "content-aliases.json"
FRONTMATTER_RE = re.compile(r"^---\r?\n([\s\S]*?)\r?\n---\r?\n?")
DERIVED_FRONTMATTER_FIELDS = {"references", "timeEstimate", "isPremium"}


def git_output(args: list[str]) -> str:
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
    ).stdout.strip()


def git_output_optional(args: list[str]) -> str | None:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def parse_git_date(value: str) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value).astimezone(timezone.utc)


def iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def public_source_files(article_dir: Path) -> list[Path]:
    paths: list[Path] = []
    for path in article_dir.rglob("*"):
        if not path.is_file():
            continue
        if "_generated" in path.parts:
            continue
        if path.name == "_research.md":
            continue
        if path.name == "social_banner.txt":
            continue
        paths.append(path)
    return sorted(paths)


def is_dirty(path: Path) -> bool:
    rel = path.relative_to(REPO_ROOT).as_posix()
    return bool(git_output(["status", "--porcelain", "--", rel]))


def committed_file_text(path: Path) -> str | None:
    rel = path.relative_to(REPO_ROOT).as_posix()
    return git_output_optional(["show", f"HEAD:{rel}"])


def public_content_fingerprint(path: Path, source: str) -> str:
    if path.name != "content.md":
        return source

    match = FRONTMATTER_RE.match(source)
    if not match:
        return source.strip()

    try:
        metadata = json.loads(match.group(1))
    except json.JSONDecodeError:
        return source.strip()

    if isinstance(metadata, dict):
        metadata = {
            key: value
            for key, value in metadata.items()
            if key not in DERIVED_FRONTMATTER_FIELDS
        }

    body = source[match.end():].strip()
    return json.dumps(metadata, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n" + body


def is_substantively_dirty(path: Path) -> bool:
    if not is_dirty(path):
        return False

    # Git already established that these bytes differ. Only content.md needs
    # derived-frontmatter normalization; images and other binary public assets
    # must never be decoded as UTF-8 through `git show`.
    if path.name != "content.md":
        return True

    committed = committed_file_text(path)
    if committed is None:
        return True

    current = path.read_text(encoding="utf-8")
    return public_content_fingerprint(path, current) != public_content_fingerprint(path, committed)


def last_git_commit_date(path: Path) -> datetime | None:
    rel = path.relative_to(REPO_ROOT).as_posix()
    return parse_git_date(git_output(["log", "-1", "--format=%cI", "--", rel]))


def file_mtime(path: Path) -> datetime:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)


def load_committed_manifest() -> dict[str, str]:
    raw = git_output_optional(["show", "HEAD:web/src/generated/content-lastmod.json"])
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    items = data.get("items")
    if not isinstance(items, dict):
        return {}
    return {key: value for key, value in items.items() if isinstance(key, str) and isinstance(value, str)}


def article_lastmod(article_dir: Path, slug: str, baseline: dict[str, str]) -> datetime:
    paths = public_source_files(article_dir)
    if not paths:
        return file_mtime(article_dir / "content.md")

    dirty_paths = [path for path in paths if is_substantively_dirty(path)]
    if dirty_paths:
        return max(file_mtime(path) for path in dirty_paths)

    baseline_date = parse_git_date(baseline.get(slug, ""))
    if baseline_date:
        return baseline_date

    dates = [last_git_commit_date(path) or file_mtime(path) for path in paths]
    return max(dates)


def main() -> int:
    items: dict[str, str] = {}
    learn_aliases: dict[str, str] = {}
    blog_aliases: dict[str, str] = {}
    blog_alias_claims: list[tuple[Path, str, str]] = []
    blog_slug_sources: dict[str, Path] = {}
    routable_canonical_blog_slugs: set[str] = set()
    baseline = load_committed_manifest()

    for bundle in iter_content_bundles(CONTENT_ROOT):
        article_dir = bundle.article_dir
        metadata = bundle.metadata
        slug = metadata.get("slug")
        if not isinstance(slug, str) or not slug:
            raise ValueError(f"{bundle.metadata_source}: missing slug")
        items[slug] = iso_utc(article_lastmod(article_dir, slug, baseline))

        if article_dir.parent.name == "blog":
            existing_slug_source = blog_slug_sources.get(slug)
            if existing_slug_source:
                raise ValueError(
                    f"{bundle.metadata_source}: slug {slug} is already owned by {existing_slug_source}"
                )
            blog_slug_sources[slug] = bundle.metadata_source

            redirect_to = metadata.get("redirectTo")
            if redirect_to is not None:
                if not isinstance(redirect_to, str) or not re.fullmatch(r"/blog/[a-z0-9-]+", redirect_to):
                    raise ValueError(f"{bundle.metadata_source}: redirectTo must be /blog/<slug>")
                target_slug = redirect_to.removeprefix("/blog/")
                if target_slug == slug:
                    raise ValueError(f"{bundle.metadata_source}: redirectTo points to itself")
                blog_alias_claims.append((bundle.metadata_source, slug, target_slug))

            aliases = metadata.get("aliases", [])
            if aliases is None:
                aliases = []
            if not isinstance(aliases, list) or not all(isinstance(alias, str) for alias in aliases):
                raise ValueError(f"{bundle.metadata_source}: aliases must be a string array")
            if aliases and (metadata.get("draft") or redirect_to is not None):
                raise ValueError(
                    f"{bundle.metadata_source}: aliases must belong to a non-draft canonical post"
                )
            for alias in aliases:
                if not re.fullmatch(r"[a-z0-9-]+", alias):
                    raise ValueError(f"{bundle.metadata_source}: invalid blog alias {alias}")
                if alias == slug:
                    raise ValueError(f"{bundle.metadata_source}: alias duplicates canonical slug {slug}")
                blog_alias_claims.append((bundle.metadata_source, alias, slug))

            if not metadata.get("draft") and redirect_to is None:
                routable_canonical_blog_slugs.add(slug)
            continue

        aliases = metadata.get("aliases", [])
        if aliases is None:
            aliases = []
        if not isinstance(aliases, list) or not all(isinstance(alias, str) for alias in aliases):
            raise ValueError(f"{bundle.metadata_source}: aliases must be a string array")
        for alias in aliases:
            if alias == slug:
                raise ValueError(f"{bundle.metadata_source}: alias duplicates canonical slug {slug}")
            existing = learn_aliases.get(alias)
            if existing and existing != slug:
                raise ValueError(f"{bundle.metadata_source}: alias {alias} already maps to {existing}")
            learn_aliases[alias] = slug

    for source, alias, target in blog_alias_claims:
        slug_source = blog_slug_sources.get(alias)
        if slug_source and slug_source != source:
            raise ValueError(
                f"{source}: blog alias {alias} conflicts with canonical slug owned by {slug_source}"
            )
        if alias in blog_aliases:
            raise ValueError(f"{source}: blog alias {alias} is declared more than once")
        blog_aliases[alias] = target

    missing_blog_targets = sorted(set(blog_aliases.values()) - routable_canonical_blog_slugs)
    if missing_blog_targets:
        raise ValueError(
            "Blog aliases and redirects must target non-draft canonical posts: "
            + ", ".join(missing_blog_targets)
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps({"items": dict(sorted(items.items()))}, indent=2) + "\n",
        encoding="utf-8",
    )
    ALIASES_OUTPUT_PATH.write_text(
        json.dumps(
            {
                "learn": dict(sorted(learn_aliases.items())),
                "blog": dict(sorted(blog_aliases.items())),
            },
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH.relative_to(REPO_ROOT)} with {len(items)} entries")
    print(
        f"Wrote {ALIASES_OUTPUT_PATH.relative_to(REPO_ROOT)} with "
        f"{len(learn_aliases)} learn aliases and {len(blog_aliases)} blog aliases/redirects"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
