#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///

"""Identify and snapshot the production inputs selected by gcloudignore."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

PLATFORM = "linux/amd64"
DIGEST = re.compile(r"sha256:[0-9a-f]{64}\Z")
CACHE_CONFIG = {
    "Dockerfile",
    "web/package.json",
    "web/pnpm-lock.yaml",
    "web/pnpm-workspace.yaml",
    "web/next.config.mjs",
    "web/tsconfig.json",
    "web/postcss.config.mjs",
    "web/.browserslistrc",
}


def fingerprint(
    root: Path, files: list[str], base_image: str, snapshot: Path | None = None
) -> tuple[str, str]:
    records = []
    root = root.resolve()
    for name in sorted(set(files)):
        path = root / name
        if Path(name).is_absolute() or ".." in Path(name).parts:
            raise ValueError(f"Build input is outside the source directory: {name}")
        if not path.resolve().is_relative_to(root):
            raise ValueError(f"Build input links outside the source directory: {name}")
        content_hash = hashlib.sha256()
        with path.open("rb") as source:
            info = path.stat()
            executable = bool(info.st_mode & 0o111)
            destination = None
            if snapshot is not None:
                target = snapshot / name
                target.parent.mkdir(parents=True, exist_ok=True)
                destination = target.open("wb")
            try:
                while chunk := source.read(1024 * 1024):
                    content_hash.update(chunk)
                    if destination is not None:
                        destination.write(chunk)
            finally:
                if destination is not None:
                    destination.close()
            if snapshot is not None:
                target.chmod(0o755 if executable else 0o644)
                os.utime(target, ns=(info.st_atime_ns, info.st_mtime_ns))
        records.append([name, executable, content_hash.hexdigest()])
    if not records:
        raise ValueError("The production build context is empty")

    def digest(selected: list) -> str:
        payload = ["leetllm-build-v1", PLATFORM, base_image, selected]
        return hashlib.sha256(
            json.dumps(payload, separators=(",", ":")).encode()
        ).hexdigest()

    dependencies = [
        record
        for record in records
        if record[0] in CACHE_CONFIG or record[0].startswith("web/patches/")
    ]
    return digest(records), digest(dependencies)


def resolve_base_image(root: Path, image: str | None = None) -> str:
    if image is None:
        match = re.search(
            r"^ARG NODE_IMAGE=(\S+)$", (root / "Dockerfile").read_text(), re.MULTILINE
        )
        if match is None:
            raise ValueError("Dockerfile must declare ARG NODE_IMAGE=<image>")
        image = match[1]
    if "@" in image:
        if not DIGEST.fullmatch(image.rsplit("@", 1)[1]):
            raise ValueError("The Node base image must have a valid SHA-256 digest")
        return image
    result = subprocess.run(
        [
            "docker",
            "buildx",
            "imagetools",
            "inspect",
            image,
            "--format",
            "{{json .Manifest.Digest}}",
        ],
        check=True,
        capture_output=True,
        text=True,
        timeout=90,
    )
    digest = json.loads(result.stdout)
    if not isinstance(digest, str) or not DIGEST.fullmatch(digest):
        raise ValueError("Could not resolve the Node base image to a SHA-256 digest")
    return f"{image}@{digest}"


def existing_image(repository: str, source_hash: str, project: str) -> str:
    result = subprocess.run(
        [
            "gcloud",
            "artifacts",
            "docker",
            "images",
            "describe",
            f"{repository}:input-{source_hash}",
            f"--project={project}",
            "--format=value(image_summary.digest)",
            "--verbosity=error",
        ],
        check=False,
        capture_output=True,
        text=True,
        timeout=90,
    )
    if result.returncode != 0:
        first_line = result.stderr.strip().partition("\n")[0]
        if (
            first_line
            == "ERROR: (gcloud.artifacts.docker.images.describe) Image not found."
            or first_line.startswith(
                (
                    "NOT_FOUND:",
                    "ERROR: (gcloud.artifacts.docker.images.describe) NOT_FOUND:",
                )
            )
        ):
            return "-"
        raise RuntimeError(f"Artifact Registry lookup failed: {result.stderr.strip()}")
    digest = result.stdout.strip()
    if not DIGEST.fullmatch(digest):
        raise ValueError("Artifact Registry returned an invalid image digest")
    return digest


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parents[1]
    )
    parser.add_argument("--snapshot-dir", type=Path)
    parser.add_argument("--base-image")
    parser.add_argument("--image-repository")
    parser.add_argument("--project", default=os.environ.get("GCLOUD_PROJECT", ""))
    parser.add_argument("--rebuild", action="store_true")
    args = parser.parse_args()
    root = args.root.resolve()
    if args.snapshot_dir is not None:
        args.snapshot_dir.mkdir(parents=True, exist_ok=True)
        if any(args.snapshot_dir.iterdir()):
            raise ValueError("The build snapshot directory must be empty")
    image = resolve_base_image(root, args.base_image)
    listing = subprocess.run(
        ["gcloud", "meta", "list-files-for-upload", ".", "--verbosity=error"],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
        timeout=90,
    )
    source_hash, cache_key = fingerprint(
        root, listing.stdout.splitlines(), image, args.snapshot_dir
    )
    digest = "-"
    if args.image_repository is not None and not args.rebuild:
        digest = existing_image(args.image_repository, source_hash, args.project)
    print(source_hash, cache_key, image, digest)


if __name__ == "__main__":
    main()
