---
title: Graph neural network
aliases: ["GNN", "graph neural networks"]
importance: 83
---
A **graph neural network (GNN)** is a neural model that learns from graph-structured data: nodes, their features, edges, and sometimes edge attributes. Instead of treating each node as an isolated row, many GNN architectures update a node's representation using information from neighboring nodes. The learned output can support node classification, link prediction, graph classification, or retrieval features.

## Graph indexes and GNNs have different roles

Storing a graph and following its existing edges require no learned parameters. A GraphRAG system can extract an `inference-api -> redis-cache` relationship, traverse that connection, and return the cited source text without training a graph model. Adding a GNN is a separate design decision that introduces node features, a learning objective, training data, inference cost, and representation freshness requirements.

Many GNNs use message passing, where each layer collects neighboring information and updates node embeddings. Some graph architectures use attention or other global interactions, so message passing describes an important family rather than every possible graph-learning design.


## Example

Suppose a service-dependency graph contains nodes for `inference-api`, `redis-cache`, and a database. Each node starts with measured features such as recent error rate, latency, and deployment age. A graph model can combine a service's own measurements with dependency features and learn to score which service is most likely affected by an incident.

If the cache error rate rises, one neighborhood update can move information from `redis-cache` into the `inference-api` representation. A second layer can incorporate evidence from dependencies two edges away. The resulting score estimates affected services from graph features; source citations still need their own provenance path.

## Why it matters here

GraphRAG and knowledge-graph lessons discuss relationships that can be traversed directly. Distinguishing stored graph structure from learned graph representations prevents readers from assuming that every graph-backed retrieval system trains a neural network.

## Related terms

- [Message-passing neural network](glossary://message-passing-neural-network)
- [GraphRAG](glossary://graphrag)
- [Embedding](glossary://embedding)
- [Breadth-first search](glossary://breadth-first-search)
- [Entity resolution](glossary://entity-resolution)
