---
title: Server-sent events
aliases: ["SSE", "event stream"]
importance: 85
---
**Server-sent events (SSE)** deliver a sequence of text events from a server to a client over a long-lived HTTP response with the `text/event-stream` media type. The stream has explicit line and event boundaries, so transport chunks aren't necessarily complete events.

## Parse lines first, then dispatch events

An SSE event contains fields such as `event`, `data`, `id`, and `retry`. A blank line dispatches the accumulated event. Multiple `data:` lines are joined with newline characters. Lines starting with a colon are comments, and a single optional space immediately after a field's colon is removed.

The underlying network can split one UTF-8 character or line across chunks, or place multiple complete events in one chunk. Decode UTF-8 incrementally and recognize CRLF, lone LF, and lone CR as line endings. A parser keeps incomplete text between reads and dispatches only on a blank line when a `data` field has accumulated. End-of-stream alone does not dispatch an unfinished event; comment-only or `id`-only blocks do not produce a message.

## Example

A model endpoint sends `event: token`, then `data: hel`, then another `data: lo`, followed by a blank line. The resulting event data is `hel\nlo`; the protocol joins the two field values with their required separating newline.

If the bytes for `data:` arrive in different TCP reads, the parser must wait until the line completes. If the connection resumes using an event identifier, the client must also avoid replaying already-processed side effects.

## Why it matters here

Streaming model APIs, MCP transports, and practice exercises rely on correct event framing. Understanding SSE prevents lost tokens, malformed JSON, duplicated actions after reconnects, and parsers that accidentally assume every network chunk is one complete application event.

## Related terms

- [Parsing](glossary://parsing)
- [Idempotency](glossary://idempotency)
- [Backpressure](glossary://backpressure)
- [Token](glossary://token)
