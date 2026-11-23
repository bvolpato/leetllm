#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Synthetic retrieval mechanics, not learned extraction or answer evaluation."""
from dataclasses import dataclass, replace
from hashlib import sha256
import re


@dataclass(frozen=True)
class TextUnit:
    text: str
    readers: frozenset[str]


@dataclass(frozen=True)
class Fact:
    source: str
    target: str
    relation: str
    chunk_id: int
    quote: str
    source_hash: str


def digest(text: str) -> str:
    return sha256(text.encode()).hexdigest()


units = {
    1842: TextUnit("inference-api depends on redis-cache. Release 2026.06.14 of inference-api ran in us-east-1. Cache evictions and increased p95 latency were observed during the release.", frozenset({"ops"})),
    2031: TextUnit("redis-cache in us-east-1 still uses the old maxmemory policy. The config migration is blocked by a compatibility test.", frozenset({"ops"})),
    3155: TextUnit("inference-api breached the inference latency SLO twelve minutes after deploy. Rollback restored latency.", frozenset({"ops"})),
}
# Test-author relationship annotations, not outputs of an executed extractor.
facts = [
    Fact("inference-api", "redis-cache", "depends_on", 1842,
         "inference-api depends on redis-cache.", digest(units[1842].text)),
    Fact("redis-cache", "old maxmemory policy", "uses_policy", 2031,
         "redis-cache in us-east-1 still uses the old maxmemory policy.", digest(units[2031].text)),
]


def lexical_top_two(query, corpus, group):
    terms = set(re.findall(r"[\w-]+", query.casefold()))
    scored = [(len(terms & set(re.findall(r"[\w-]+", unit.text.casefold()))), chunk_id)
              for chunk_id, unit in corpus.items() if group in unit.readers]
    return {chunk_id for score, chunk_id in sorted(scored, reverse=True)[:2] if score > 0}


def graph_context(query, seed, corpus, graph_facts, group, hops=2):
    """Follow outbound fixture edges after source-version and reader checks."""
    if type(hops) is not int or hops < 0:
        raise ValueError("hops must be a nonnegative integer")
    selected = lexical_top_two(query, corpus, group)
    visited, frontier = {seed}, {seed}
    for _ in range(hops):
        following = set()
        for fact in graph_facts:
            unit = corpus.get(fact.chunk_id)
            if fact.source not in frontier or unit is None or group not in unit.readers:
                continue
            if digest(unit.text) != fact.source_hash or not fact.quote or fact.quote not in unit.text:
                continue
            selected.add(fact.chunk_id)
            following.add(fact.target)
        frontier = following - visited
        visited.update(frontier)
    return selected


def admit_report(source_versions, corpus, group):
    """Authorize all source versions before admitting a derived report."""
    return bool(source_versions) and all(
        chunk_id in corpus and group in corpus[chunk_id].readers
        and digest(corpus[chunk_id].text) == version
        for chunk_id, version in source_versions.items()
    )


def run_checks():
    query = "inference-api latency SLO"
    expected = {1842, 2031, 3155}  # Annotated evidence set for this fixture only.
    baseline = lexical_top_two(query, units, "ops")
    expanded = graph_context(query, "inference-api", units, facts, "ops")
    assert baseline == {1842, 3155} and expanded == expected
    print("lexical top-two:", sorted(baseline), "evidence recall:", round(len(baseline & expected) / len(expected), 3))
    print("graph expansion:", sorted(expanded), "evidence recall:", len(expanded & expected) / len(expected))

    revoked = dict(units)
    revoked[2031] = replace(units[2031], readers=frozenset())
    changed = dict(units)
    changed[2031] = replace(units[2031], text="redis-cache now uses the new policy.")
    deleted = {key: value for key, value in units.items() if key != 2031}
    for corpus in (revoked, changed, deleted):
        assert 2031 not in graph_context(query, "inference-api", corpus, facts, "ops")
    assert graph_context(query, "inference-api", {}, facts, "ops") == set()
    assert graph_context(query, "inference-api", units, facts, "staff") == set()
    assert graph_context(query, "inference-api", units, facts, "ops", hops=0) == baseline
    assert graph_context(query, "inference-api", units, facts[:1], "ops") == baseline
    assert graph_context(query, "old maxmemory policy", units, facts, "ops") == baseline
    for invalid_hops in (-1, True, 1.5):
        try:
            graph_context(query, "inference-api", units, facts, "ops", invalid_hops)
        except ValueError:
            pass
        else:
            raise AssertionError("invalid hop count accepted")

    # A real quote and matching hash do not entail an invented relation.
    false_edge = replace(facts[1], source="inference-api", relation="will_cause",
                         target="future SLO breach")
    false_context = graph_context(query, "inference-api", units,
                                  [facts[0], false_edge], "ops", hops=1)
    assert 2031 in false_context
    assert "future SLO breach" not in units[2031].text
    print("false causal edge with genuine quote: source checks pass; claim remains unsupported")

    report_sources = {key: digest(units[key].text) for key in (1842, 2031)}
    assert admit_report(report_sources, units, "ops")
    for corpus in (revoked, changed, deleted):
        assert not admit_report(report_sources, corpus, "ops")
    assert not admit_report({}, units, "ops")
    assert not admit_report(report_sources, units, "staff")
    print("source mutation, deletion, revocation, direction, hop, and report-admission checks pass")


if __name__ == "__main__":
    run_checks()
