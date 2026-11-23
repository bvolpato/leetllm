---
title: Event-time watermark
importance: 78
---

An event-time watermark summarizes how far a streaming system believes event-time processing has progressed. A watermark at 10:00 signals that events with earlier timestamps are expected to have mostly arrived under the pipeline's lateness policy. Windows can become eligible for emission when the watermark passes their end, but late events may still require updates, side outputs, or rejection.

## Watermarks estimate progress under a lateness policy

Watermarks are estimates derived from sources, partitions, and permitted lateness. A stalled partition can hold back a global watermark; an aggressive watermark can finalize windows before legitimate delayed events appear. A pipeline must document whether late data updates previous results, enters a correction stream, or is dropped. Monitoring watermark lag separately from ingestion lag distinguishes absent progress from slow arrival.

## Example

A five-minute aggregation window covers 09:55 through 10:00. A source's maximum observed event timestamp reaches 10:03 and its watermark policy subtracts a two-minute out-of-order delay, producing an approximate watermark of 10:01. The 09:55-10:00 window may now emit. A separate allowed-lateness policy controls how long window state remains available for corrections. Its duration may differ from the two-minute watermark delay. If a 09:59 event arrives afterward, the configured late-data policy determines whether the previously emitted feature is corrected, routed elsewhere, or discarded. [Apache Beam's guide](https://beam.apache.org/documentation/programming-guide/#watermarks-and-late-data) explains this distinction between progress, triggers, and late data.

## Why it matters here

Streaming feature pipelines require reproducible window boundaries, late-event accounting, and training-serving parity. Watermarks explain why apparently complete historical aggregates can change after a prediction and why feature freshness dashboards need progress and late-arrival signals.

## Related terms

- [Event time](glossary://event-time)
- [Feature freshness](glossary://feature-freshness)
- [Point-in-time join](glossary://point-in-time-join)
