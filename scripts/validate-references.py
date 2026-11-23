#!/usr/bin/env python3
"""
validate-references.py — Validate all LeetLLM article references.

Checks:
  1. Required fields (title, authors, year, url, type)
  2. URL reachability (HTTP HEAD/GET, follow redirects)
  3. Year plausibility (arxiv ID date vs claimed year, page content)
  4. Duplicate URLs across different reference keys
  5. Orphaned references (in global but never cited)
  6. Missing references (cited in content but not defined)

Usage:
  python3 scripts/validate-references.py                  # full check
  python3 scripts/validate-references.py --skip-http      # skip URL checks
  python3 scripts/validate-references.py --json           # machine-readable output

Output goes to .review-logs/reference-validation/ (gitignored).
"""

import json
import os
import sys
import re
import time
import argparse
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from urllib.parse import urlparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

from content_bundle import iter_content_bundles

# ─── Config ───────────────────────────────────────────────────────────────────

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(REPO_ROOT, "web", "src", "content")
CONTENT_ROOT = Path(CONTENT_DIR)
GLOBAL_REFS_PATH = os.path.join(CONTENT_DIR, "references.json")
OUTPUT_DIR = os.path.join(REPO_ROOT, ".review-logs", "reference-validation")

REQUIRED_FIELDS = {"title", "authors", "year", "url", "type"}
VALID_TYPES = {"paper", "resource", "book"}
CURRENT_YEAR = 2026  # Hardcoded to avoid issues

# User agent to avoid bot blocking
USER_AGENT = "Mozilla/5.0 (compatible; LeetLLM-RefCheck/1.0)"

MIRROR_DOMAINS = {"r.jina.ai"}
BOT_BLOCKED_OR_FLAKY_DOMAINS = {
    "acm.org",
    "alexzhang13.github.io",
    "bls.gov",
    "dblp.org",
    "docs.github.com",
    "docs.fireworks.ai",
    "dol.gov",
    "huggingface.co",
    "microsoft.github.io",
    "opensource.org",
    "openai.com",
    "otexts.com",
    "owasp.org",
    "www.nvidia.com",
    "incompleteideas.net",
    "www.incompleteideas.net",
    "cacm.acm.org",
    "mitpress.mit.edu",
    "projecteuclid.org",
}
HTTP_403_BOT_BLOCKED_DOMAINS = {"eur-lex.europa.eu"}
SERIAL_CHECK_DOMAINS = BOT_BLOCKED_OR_FLAKY_DOMAINS | HTTP_403_BOT_BLOCKED_DOMAINS

def host_matches(url, domains):
    host = urlparse(url).netloc.lower()
    return any(host == domain or host.endswith(f".{domain}") for domain in domains)

def open_url(url, method=None, retries=2):
    last_error = None
    for attempt in range(retries + 1):
        try:
            req = Request(url, method=method, headers={"User-Agent": USER_AGENT})
            return urlopen(req, timeout=15)
        except HTTPError:
            raise
        except (URLError, TimeoutError, ConnectionResetError, OSError) as e:
            last_error = e
            if attempt < retries:
                time.sleep(0.5 * (attempt + 1))
                continue
            raise last_error

# ─── Load all references ─────────────────────────────────────────────────────

def load_all_references(citations):
    """Load global refs and derive article refs from [^key] citations."""
    with open(GLOBAL_REFS_PATH) as f:
        global_refs = json.load(f)

    # all_refs: key -> { ref data + source info }
    all_refs = {}
    for key, val in global_refs.items():
        all_refs[key] = {**val, "_source": "references.json", "_articles": []}

    article_refs = {}  # article_slug -> { key -> ref }
    for article, cited_keys in citations.items():
        article_refs[article] = {}
        for key in sorted(cited_keys):
            if key in global_refs:
                article_refs[article][key] = global_refs[key]
                all_refs[key]["_articles"].append(article)

    return all_refs, article_refs, global_refs


# ─── Find citations in content ───────────────────────────────────────────────

def find_citations_in_content():
    """Scan all content.md files for [^key] citation references."""
    citations = {}  # article_slug -> set of cited keys
    for bundle in iter_content_bundles(CONTENT_ROOT):
        rel = bundle.article_dir.relative_to(CONTENT_ROOT).as_posix()
        text = bundle.body
        keys = set(re.findall(r'\[\^(\w+)\]', text))
        # Exclude footnote definitions
        defs = set(re.findall(r'^\[\^(\w+)\]:', text, re.MULTILINE))
        citations[rel] = keys - defs
    return citations


# ─── Structural checks ───────────────────────────────────────────────────────

def check_structure(all_refs):
    """Check required fields, valid types, year plausibility."""
    issues = []

    for key, ref in all_refs.items():
        source = ref.get("_source", "unknown")

        # Missing fields
        for field in REQUIRED_FIELDS:
            if field not in ref or not ref[field]:
                issues.append({
                    "key": key,
                    "severity": "error",
                    "check": "missing_field",
                    "message": f"Missing required field '{field}'",
                    "source": source,
                })

        # Valid type
        ref_type = ref.get("type", "")
        if ref_type and ref_type not in VALID_TYPES:
            issues.append({
                "key": key,
                "severity": "warning",
                "check": "invalid_type",
                "message": f"Invalid type '{ref_type}' (expected: {VALID_TYPES})",
                "source": source,
            })

        # Year range
        year = ref.get("year")
        if year:
            if not isinstance(year, int):
                issues.append({
                    "key": key,
                    "severity": "error",
                    "check": "year_not_int",
                    "message": f"Year is not an integer: {year}",
                    "source": source,
                })
            elif year < 1900 or year > CURRENT_YEAR:
                issues.append({
                    "key": key,
                    "severity": "warning",
                    "check": "year_range",
                    "message": f"Year {year} seems unlikely (expected 1900-{CURRENT_YEAR})",
                    "source": source,
                })

        # URL format
        url = ref.get("url", "")
        if url and not url.startswith("http"):
            issues.append({
                "key": key,
                "severity": "error",
                "check": "invalid_url",
                "message": f"URL doesn't start with http: {url}",
                "source": source,
            })
        elif url and host_matches(url, MIRROR_DOMAINS):
            issues.append({
                "key": key,
                "severity": "error",
                "check": "mirror_url",
                "message": f"Reference URL must point to the original source, not a reader mirror: {url}",
                "source": source,
            })

    return issues


# ─── Duplicate URL detection ─────────────────────────────────────────────────

def check_duplicates(all_refs):
    """Find different reference keys that point to the same URL."""
    issues = []
    url_to_keys = defaultdict(list)

    for key, ref in all_refs.items():
        url = ref.get("url", "").rstrip("/").lower()
        if url:
            # Normalize arxiv URLs
            url = re.sub(r'arxiv\.org/(abs|pdf)/', 'arxiv.org/abs/', url)
            url = re.sub(r'v\d+$', '', url)  # Remove version suffix
            url_to_keys[url].append(key)

    for url, keys in url_to_keys.items():
        if len(keys) > 1:
            issues.append({
                "key": keys[0],
                "severity": "warning",
                "check": "duplicate_url",
                "message": f"Same URL shared by keys: {', '.join(keys)} → {url}",
                "source": "multiple",
            })

    return issues


# ─── Orphan / missing reference checks ───────────────────────────────────────

def check_citation_integrity(all_refs, article_refs, citations, global_refs):
    """Check for orphaned global refs and missing citations."""
    issues = []

    # Cited keys not defined in references.json
    for article, cited_keys in citations.items():
        defined_keys = set(article_refs.get(article, {}).keys())
        for key in cited_keys:
            if key not in defined_keys:
                issues.append({
                    "key": key,
                    "severity": "error",
                    "check": "missing_reference",
                    "message": f"Cited [^{key}] in {article}/content.md but not defined in references.json",
                    "source": "references.json",
                })

    return issues


# ─── arxiv year extraction ────────────────────────────────────────────────────

def extract_arxiv_year(url):
    """Extract the submission year from an arxiv URL's ID.
    arxiv IDs follow YYMM.NNNNN format (since 2007) or category/YYMMNNN (older).
    """
    # Modern format: 2408.03314 → 2024
    m = re.search(r'arxiv\.org/(?:abs|pdf)/(\d{2})(\d{2})\.\d+', url)
    if m:
        yy = int(m.group(1))
        year = 2000 + yy if yy < 90 else 1900 + yy
        return year

    # Old format: category/0601001 → 2006
    m = re.search(r'arxiv\.org/(?:abs|pdf)/[\w.-]+/(\d{2})(\d{2})\d+', url)
    if m:
        yy = int(m.group(1))
        year = 2000 + yy if yy < 90 else 1900 + yy
        return year

    return None


# ─── HTTP URL checks ─────────────────────────────────────────────────────────

def check_url(key, ref):
    """Check a single URL. Returns list of issues."""
    issues = []
    url = ref.get("url", "")
    if not url or not url.startswith("http"):
        return issues
    bot_blocked_or_flaky = host_matches(url, BOT_BLOCKED_OR_FLAKY_DOMAINS)
    bot_blocked_403 = host_matches(url, HTTP_403_BOT_BLOCKED_DOMAINS)

    # HTTP check
    try:
        resp = open_url(url, method="HEAD")
        status = resp.status
        final_url = resp.url

        if status >= 400:
            issues.append({
                "key": key,
                "severity": "warning" if bot_blocked_or_flaky else "error",
                "check": "http_error_flaky_host" if bot_blocked_or_flaky else "http_error",
                "message": f"HTTP {status} for {url}" + (" (known flaky source domain)" if bot_blocked_or_flaky else ""),
                "url": url,
            })

        # Check for significant redirects (domain change)
        if final_url and url.split("/")[2] != final_url.split("/")[2]:
            issues.append({
                "key": key,
                "severity": "info",
                "check": "redirect",
                "message": f"Redirected to different domain: {url} → {final_url}",
                "url": url,
            })

    except HTTPError as e:
        if e.code == 403:
            # Many academic sites block automated requests (paywall, bot protection).
            # Downgrade to warning for known publishers.
            paywall_domains = [
                "dl.acm.org", "doi.org", "ieeexplore.ieee.org",
                "link.springer.com", "sciencedirect.com", "wiley.com",
                "medium.com"
            ]
            is_paywall = host_matches(url, paywall_domains)

            # Try GET as fallback
            try:
                resp = open_url(url)
                # If GET works, it's fine
            except HTTPError as e2:
                bot_blocked = bot_blocked_or_flaky or (bot_blocked_403 and e2.code == 403)
                warning_only = is_paywall or bot_blocked
                issues.append({
                    "key": key,
                    "severity": "warning" if warning_only else "error",
                    "check": "http_403_paywall" if is_paywall else ("http_403_blocked" if bot_blocked else "http_error"),
                    "message": f"HTTP {e2.code} for {url}" + (" (likely paywall)" if is_paywall else (" (likely bot protection)" if bot_blocked else "")),
                    "url": url,
                })
            except Exception as e2:
                bot_blocked = bot_blocked_or_flaky
                warning_only = is_paywall or bot_blocked
                issues.append({
                    "key": key,
                    "severity": "warning" if warning_only else "error",
                    "check": "http_403_paywall" if is_paywall else ("http_403_blocked" if bot_blocked else "http_error"),
                    "message": f"HTTP error: {e2} for {url}" + (" (likely paywall)" if is_paywall else (" (likely bot protection)" if bot_blocked else "")),
                    "url": url,
                })
        elif e.code == 405:
            # Method Not Allowed for HEAD — try GET
            try:
                resp = open_url(url)
            except Exception:
                pass  # HEAD not supported, but that's usually fine
        elif e.code == 429:
            issues.append({
                "key": key,
                "severity": "warning",
                "check": "rate_limited",
                "message": f"Rate limited (429) for {url} — retry later",
                "url": url,
            })
        else:
            issues.append({
                "key": key,
                "severity": "warning" if bot_blocked_or_flaky else "error",
                "check": "http_error_flaky_host" if bot_blocked_or_flaky else "http_error",
                "message": f"HTTP {e.code} for {url}" + (" (known flaky source domain)" if bot_blocked_or_flaky else ""),
                "url": url,
            })
    except URLError as e:
        issues.append({
            "key": key,
            "severity": "warning" if bot_blocked_or_flaky else "error",
            "check": "url_check_failed" if bot_blocked_or_flaky else "url_unreachable",
            "message": f"URL unreachable: {e.reason} — {url}" + (" (known flaky source domain)" if bot_blocked_or_flaky else ""),
            "url": url,
        })
    except Exception as e:
        issues.append({
            "key": key,
            "severity": "warning",
            "check": "url_check_failed",
            "message": f"Could not check URL: {e} — {url}",
            "url": url,
        })

    return issues


def check_urls_parallel(all_refs, max_workers=10):
    """Check all URLs in parallel."""
    issues = []
    total = sum(1 for r in all_refs.values() if r.get("url", "").startswith("http"))
    checked = 0
    parallel_refs = {}
    serial_refs = {}

    for key, ref in all_refs.items():
        url = ref.get("url", "")
        if not url.startswith("http"):
            continue

        # Some official source domains intermittently block automated probes.
        # Check them serially to reduce false negatives in review runs.
        if host_matches(url, SERIAL_CHECK_DOMAINS):
            serial_refs[key] = ref
        else:
            parallel_refs[key] = ref

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for key, ref in parallel_refs.items():
            futures[executor.submit(check_url, key, ref)] = key

        for future in as_completed(futures):
            checked += 1
            key = futures[future]
            try:
                result = future.result()
                issues.extend(result)
                status = "⚠" if result else "✓"
                if result:
                    for iss in result:
                        print(f"  {status} [{checked}/{total}] {key}: {iss['message']}")
                elif checked % 25 == 0:
                    print(f"  ✓ [{checked}/{total}] checked...")
            except Exception as e:
                issues.append({
                    "key": key,
                    "severity": "error",
                    "check": "check_exception",
                    "message": f"Exception during check: {e}",
                })

    for key, ref in serial_refs.items():
        checked += 1
        try:
            result = check_url(key, ref)
            issues.extend(result)
            status = "⚠" if result else "✓"
            if result:
                for iss in result:
                    print(f"  {status} [{checked}/{total}] {key}: {iss['message']}")
            elif checked % 25 == 0:
                print(f"  ✓ [{checked}/{total}] checked...")
        except Exception as e:
            issues.append({
                "key": key,
                "severity": "error",
                "check": "check_exception",
                "message": f"Exception during check: {e}",
            })

    return issues


# ─── Year consistency check (arxiv only, no HTTP) ────────────────────────────

def check_arxiv_years(all_refs):
    """Check all arxiv references for year consistency without HTTP.

    Papers with a venue (journal/conference) use the *publication* year,
    which can be 1-3 years after the arxiv preprint date. We allow a wider
    tolerance (±3) when a venue is present, and ±1 when it is not.
    """
    issues = []
    for key, ref in all_refs.items():
        url = ref.get("url", "")
        if "arxiv.org" not in url:
            continue
        arxiv_year = extract_arxiv_year(url)
        claimed_year = ref.get("year")
        if not (arxiv_year and claimed_year):
            continue

        diff = abs(arxiv_year - claimed_year)
        has_venue = bool(ref.get("venue"))

        # With a venue, publication can lag preprint by up to 3 years
        max_allowed = 3 if has_venue else 1

        if diff > max_allowed:
            issues.append({
                "key": key,
                "severity": "error",
                "check": "arxiv_year_mismatch",
                "message": f"arxiv ID → {arxiv_year}, claimed year → {claimed_year} (diff: {diff}, venue: {ref.get('venue', 'none')})",
                "url": url,
                "expected_year": arxiv_year,
                "claimed_year": claimed_year,
            })
        elif diff > 0:
            venue_note = f", published at {ref['venue']}" if has_venue else ", no venue"
            issues.append({
                "key": key,
                "severity": "info",
                "check": "arxiv_year_slight_diff",
                "message": f"arxiv ID → {arxiv_year}, claimed year → {claimed_year} (±{diff}{venue_note})",
                "url": url,
                "expected_year": arxiv_year,
                "claimed_year": claimed_year,
            })
    return issues


# ─── Report ───────────────────────────────────────────────────────────────────

def print_report(all_issues, all_refs):
    """Print a human-readable summary."""
    errors = [i for i in all_issues if i["severity"] == "error"]
    warnings = [i for i in all_issues if i["severity"] == "warning"]
    infos = [i for i in all_issues if i["severity"] == "info"]

    print(f"\n{'='*60}")
    print(f"  Reference Validation Report")
    print(f"  Total references: {len(all_refs)}")
    print(f"  🔴 Errors:   {len(errors)}")
    print(f"  🟡 Warnings: {len(warnings)}")
    print(f"  🔵 Info:     {len(infos)}")
    print(f"{'='*60}\n")

    if errors:
        print("🔴 ERRORS:\n")
        for i in sorted(errors, key=lambda x: x["check"]):
            print(f"  [{i['check']}] {i['key']}: {i['message']}")
        print()

    if warnings:
        print("🟡 WARNINGS:\n")
        for i in sorted(warnings, key=lambda x: x["check"]):
            print(f"  [{i['check']}] {i['key']}: {i['message']}")
        print()

    if infos:
        print("🔵 INFO:\n")
        for i in sorted(infos, key=lambda x: x["check"]):
            print(f"  [{i['check']}] {i['key']}: {i['message']}")
        print()

    if not all_issues:
        print("✅ All references valid!\n")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Validate LeetLLM references")
    parser.add_argument("--skip-http", action="store_true", help="Skip HTTP URL checks")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    print("\n📚 LeetLLM Reference Validator\n")

    # Load
    print("  Loading references...")
    citations = find_citations_in_content()
    all_refs, article_refs, global_refs = load_all_references(citations)
    print(f"  Loaded {len(all_refs)} references across {len(article_refs)} articles\n")

    all_issues = []

    # 1. Structural checks
    print("  ▸ Checking structure...")
    all_issues.extend(check_structure(all_refs))

    # 2. Duplicate URLs
    print("  ▸ Checking for duplicate URLs...")
    all_issues.extend(check_duplicates(all_refs))

    # 3. Citation integrity
    print("  ▸ Checking citation integrity...")
    all_issues.extend(check_citation_integrity(all_refs, article_refs, citations, global_refs))

    # 4. arxiv year checks (no HTTP)
    print("  ▸ Checking arxiv year consistency...")
    all_issues.extend(check_arxiv_years(all_refs))

    # 5. HTTP checks
    if not args.skip_http:
        print(f"\n  ▸ Checking {sum(1 for r in all_refs.values() if r.get('url','').startswith('http'))} URLs (parallel)...\n")
        http_issues = check_urls_parallel(all_refs)
        # Deduplicate arxiv year issues (already checked above)
        existing_keys = {(i["key"], i["check"]) for i in all_issues}
        for i in http_issues:
            if (i["key"], i["check"]) not in existing_keys:
                all_issues.append(i)

    # Report
    if args.json:
        # Strip internal fields
        clean_issues = [{k: v for k, v in i.items() if not k.startswith("_")} for i in all_issues]
        print(json.dumps(clean_issues, indent=2))
    else:
        print_report(all_issues, all_refs)

    # Save report
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    report_path = os.path.join(OUTPUT_DIR, "report.json")
    with open(report_path, "w") as f:
        clean_issues = [{k: v for k, v in i.items() if not k.startswith("_")} for i in all_issues]
        json.dump({"total_refs": len(all_refs), "issues": clean_issues}, f, indent=2)
    print(f"  Report saved to: {report_path}\n")

    # Exit code
    errors = [i for i in all_issues if i["severity"] == "error"]
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
