#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "google-auth",
#     "requests",
# ]
# ///

import argparse
import json
import sys
import urllib.error
import urllib.request
from xml.etree import ElementTree

import google.auth
import google.auth.transport.requests


ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"


def get_urls_from_sitemap(sitemap_url: str) -> list[str]:
    req = urllib.request.Request(sitemap_url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            xml_data = response.read()
    except Exception as exc:
        print(f"Failed to fetch sitemap: {exc}")
        return []

    root = ElementTree.fromstring(xml_data)
    return [
        element.text
        for child in root
        for element in child
        if element.tag.endswith("loc") and element.text
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Notify Google Indexing API for URLs that are eligible under "
            "Google's policy: JobPosting pages or BroadcastEvent pages embedded "
            "in VideoObject."
        )
    )
    parser.add_argument("sitemap_url", help="Sitemap containing only eligible URLs")
    parser.add_argument("--limit", type=int, default=200, help="Maximum URLs to submit")
    parser.add_argument("--dry-run", action="store_true", help="Print URLs without submitting")
    parser.add_argument(
        "--confirm-eligible",
        action="store_true",
        help="Required. Confirms every URL is JobPosting or BroadcastEvent-in-VideoObject content.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    urls = get_urls_from_sitemap(args.sitemap_url)
    if not urls:
        print("   ❌ No URLs found or failed to parse sitemap.")
        return 1

    urls = urls[: args.limit]
    print(f"   📊 Found {len(urls)} URLs to submit")

    if not args.confirm_eligible:
        print("   ❌ Refusing to submit.")
        print("      Google Indexing API is only for JobPosting pages or BroadcastEvent pages embedded in VideoObject.")
        print("      Re-run with --confirm-eligible only when every sitemap URL matches that policy.")
        return 2

    if args.dry_run:
        for url in urls:
            print(url)
        return 0

    try:
        credentials, _project_id = google.auth.default(
            scopes=["https://www.googleapis.com/auth/indexing"]
        )
        credentials.refresh(google.auth.transport.requests.Request())
        token = credentials.token
    except Exception as exc:
        print(f"   ❌ Auth Error: {exc}")
        print("      Set GOOGLE_APPLICATION_CREDENTIALS to a Search Console owner service account.")
        return 1

    success_count = 0
    for url in urls:
        payload = json.dumps({"url": url, "type": "URL_UPDATED"}).encode("utf-8")
        req = urllib.request.Request(ENDPOINT, data=payload)
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {token}")

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                if response.status in (200, 202):
                    success_count += 1
        except urllib.error.HTTPError as exc:
            error_details = exc.read().decode("utf-8")
            if exc.code == 403:
                print("   ❌ 403 Forbidden. Is the service account an owner in Google Search Console?")
                print(f"      Details: {error_details}")
                break
            if exc.code == 429:
                print("   ⚠️ Hit Google Indexing API daily quota limit.")
                break
            print(f"   ❌ HTTP {exc.code} for {url}: {error_details}")
        except Exception as exc:
            print(f"   ❌ Failed to submit {url}: {exc}")

    print(f"   ✅ Successfully submitted {success_count} URLs to Google Indexing API")
    return 0


if __name__ == "__main__":
    sys.exit(main())
