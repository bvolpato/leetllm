# Same-host Crawler

One page can point back to pages you've already seen, or out to an unrelated site. Walk a small web graph in a predictable order while keeping the crawl within its specified host boundary.

Implement `crawl(start_url, get_links)`. The crawler starts from `start_url` and calls `get_links(url)` to discover outgoing links.

## Requirements

- Return URLs in deterministic <span data-glossary="breadth-first-search">breadth-first order</span>, preserving the order that `get_links(url)` returns links from each page.
- Don't visit the same URL twice.
- Resolve relative links against the current URL.
- Ignore malformed URLs, non-HTTP(S) URLs, and off-host URLs.
- Keep the implementation single-threaded for the base problem.
- **URL identity is the full resolved string.** Keep fragments and query strings; `#frag` and `?q=…` are part of the visit key and of the returned URLs (e.g. `https://a.test/leaf#frag` is distinct from `https://a.test/leaf`).
- Assume `start_url` is a valid HTTP(S) URL on the crawl host and always include it in the result. Validation applies to discovered links.
- Ignore links that cause `urljoin` or `urlparse` to raise `ValueError`, such as an unmatched IPv6 bracket. Also treat a candidate as **malformed** if the resolved string contains whitespace (e.g. `"not a url"`). Other junk may still parse as a path after `urljoin`; no stricter URL validator is required.
- Same **host** means an exact `netloc` string match. This includes any user information and explicit port; don't normalize casing or default ports. `http` and `https` on the same netloc are both allowed regardless of scheme.

## Example

```python
graph = {
    "https://docs.example.com/": ["/a", "/b", "https://other.example.com/x"],
    "https://docs.example.com/a": ["/c"],
    "https://docs.example.com/b": ["/c"],
}

def get_links(url):
    return graph.get(url, [])

assert crawl("https://docs.example.com/", get_links) == [
    "https://docs.example.com/",
    "https://docs.example.com/a",
    "https://docs.example.com/b",
    "https://docs.example.com/c",
]
```

## Constraints

- Assume `get_links` is synchronous.
- Its outgoing links are strings, the reachable graph is finite, and fetches succeed for this base problem.
- Use standard-library Python only.
- Treat the start URL host as the only allowed host.
- This exercise doesn't follow redirects or perform network security checks. A real crawler must revalidate every redirect and protect internal-network destinations before fetching.
