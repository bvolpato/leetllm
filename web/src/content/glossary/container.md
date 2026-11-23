---
title: Container
importance: 90
---
A **container** is an isolated running process created from a container image. The image provides a layered filesystem and default execution configuration; the container adds a particular process, runtime user, network settings, environment, mounts, and writable layer. Many containers can start independently from the same image.

An image is the stored artifact. A container is a runtime instance, not another name for the artifact. `docker run --rm image` starts a container and removes that container when its process exits; it doesn't delete the image. Containers share the host operating-system kernel rather than creating a fully independent virtual machine.

## Separate build inputs from runtime inputs

Python, operating-system packages, application code, and a small stable fixture can live in image layers. Changing host data can arrive through a read-only bind mount. Persistent writable state can use a managed volume. Credentials should arrive through a runtime secret mechanism rather than being copied into an image or embedded in its build history.

## Example

```bash
docker build -t access-rag:local .
docker run --rm --read-only access-rag:local
```

The build creates the image. The second command runs a temporary container with a read-only root filesystem; separately mounted volumes can still be writable unless their mount options prohibit it. After the process exits, the image remains available for a later run.

## Why it matters here

An AI evaluation can depend on Python versions, installed system libraries, filesystem permissions, and runtime secrets. A carefully defined container makes those execution boundaries inspectable while leaving changing data and credentials outside the reusable artifact.

## Related terms

- [Container image](glossary://container-image)
- [Docker](glossary://docker)
- [Secrets management](glossary://secrets-management)
- [Reproducible environment](glossary://reproducible-environment)
