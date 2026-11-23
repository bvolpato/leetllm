---
title: Protected resource metadata
aliases: ["OAuth protected resource metadata", "RFC 9728"]
importance: 80
---
**Protected resource metadata** is a machine-readable description of an OAuth-protected API that tells clients which resource they are accessing and how to discover authorization services or supported access capabilities. RFC 9728 defines the metadata format and its well-known discovery location.

## Discovery happens before token acquisition

A protected resource can direct an unauthorized client to its metadata through a `WWW-Authenticate` challenge or a well-known URL. The metadata includes a canonical `resource` identifier and may list `authorization_servers`. A specific protocol profile can make fields mandatory even when the base RFC marks them optional.

For a resource served at `https://tools.example.com/team/mcp`, path-aware discovery can resolve to `https://tools.example.com/.well-known/oauth-protected-resource/team/mcp`. Discarding the resource path can accidentally bind a client to another tenant or another service on the same host.

## Example

An MCP client requests an incident-analysis tool and receives an HTTP 401 challenge containing a `resource_metadata` URL. It loads the JSON document, checks that `resource` matches the intended tool endpoint, and discovers the approved authorization-server issuer.

The client then requests a token for that exact resource and only the required read scope. The tool server rejects tokens issued for another audience, even when both services happen to share the same authorization server.

## Why it matters here

Agent and MCP authorization lessons depend on separating resource discovery from authorization-server discovery. Protected resource metadata prevents clients from guessing where to request tokens, supports multiple protected resources on one host, and helps preserve correct token audience and tenant boundaries.

## Related terms

- [OAuth](glossary://oauth)
- [PKCE](glossary://pkce)
- [MCP](glossary://mcp)
- [Tenant isolation](glossary://tenant-isolation)
