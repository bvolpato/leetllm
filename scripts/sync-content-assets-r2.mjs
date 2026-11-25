#!/usr/bin/env node
/**
 * Incrementally sync public content media (originals + responsive WebP variants)
 * to Cloudflare R2 (`assets.leetllm.com`) via the R2 S3 API.
 *
 * Private, draft, and hidden content bundles (pub !== 1 in content-image-manifest.json)
 * are strictly excluded from R2 and remain local on Cloud Run disk.
 *
 * Usage:
 *   node scripts/sync-content-assets-r2.mjs [--dry-run] [--verify] [--concurrency=24] [--env-file=web/.env.local]
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareToken } from "../videos/lib/cloudflare-r2.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WEB_DIR = path.join(REPO_ROOT, "web");
const CONTENT_DIR = path.join(WEB_DIR, "src", "content");
const MANIFEST_PATH = path.join(WEB_DIR, "src", "generated", "content-image-manifest.json");
const CONFIG_PATH = path.join(REPO_ROOT, "scripts", "config", "r2-content-assets.json");

const RESPONSIVE_IMAGE_WIDTHS = [320, 640, 960, 1280, 1600];
const RESPONSIVE_ENCODER_VERSION = "2";
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";
const MAX_IMAGE_PIXELS = 12_000_000;
const EMPTY_SHA256 = crypto.createHash("sha256").update("").digest("hex");

function parseArgs(argv) {
  const options = {
    dryRun: false,
    verify: false,
    concurrency: 24,
    envFile: path.join(WEB_DIR, ".env.local"),
  };
  for (const arg of argv) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--verify") options.verify = true;
    else if (arg.startsWith("--concurrency=")) {
      const value = Number(arg.slice("--concurrency=".length));
      if (!Number.isInteger(value) || value < 1 || value > 64) {
        throw new Error(`Invalid --concurrency value: ${arg}`);
      }
      options.concurrency = value;
    } else if (arg.startsWith("--env-file=")) {
      options.envFile = path.resolve(arg.slice("--env-file=".length));
    } else if (arg === "-h" || arg === "--help") {
      console.log(
        "Usage: node scripts/sync-content-assets-r2.mjs [--dry-run] [--verify] [--concurrency=24] [--env-file=web/.env.local]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function contentTypeFor(relPath) {
  const ext = path.extname(relPath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".vtt") return "text/vtt; charset=utf-8";
  throw new Error(`Unsupported media extension for R2 sync: ${relPath}`);
}

function encodeS3Path(key) {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function encodeRfc3986(value) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function signS3Request({
  method,
  host,
  canonicalUri,
  queryParams = {},
  extraHeaders = {},
  payloadHash,
  accessKeyId,
  secretAccessKey,
}) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const canonicalQueryString = Object.keys(queryParams)
    .sort()
    .map((key) => `${encodeRfc3986(key)}=${encodeRfc3986(String(queryParams[key]))}`)
    .join("&");

  const headers = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...extraHeaders,
  };
  const lowerHeaders = {};
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = String(v).trim();
  }
  const sortedKeys = Object.keys(lowerHeaders).sort();
  const canonicalHeaders = sortedKeys.map((k) => `${k}:${lowerHeaders[k]}\n`).join("");
  const signedHeaders = sortedKeys.join(";");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const requestHeaders = { ...lowerHeaders, authorization };
  delete requestHeaders.host;

  const url = `https://${host}${canonicalUri}${canonicalQueryString ? `?${canonicalQueryString}` : ""}`;
  return { url, headers: requestHeaders };
}

async function resolveR2S3Credentials(accountId, envFile) {
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
    };
  }

  const token = await cloudflareToken(existsSync(envFile) ? envFile : undefined);
  for (const endpoint of [
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`,
    "https://api.cloudflare.com/client/v4/user/tokens/verify",
  ]) {
    const res = await fetch(endpoint, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) continue;
    const json = await res.json();
    if (json?.success && json?.result?.id) {
      return {
        accessKeyId: json.result.id,
        secretAccessKey: crypto.createHash("sha256").update(token).digest("hex"),
      };
    }
  }
  throw new Error(
    "Could not derive R2 S3 credentials from Cloudflare API token. Set R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY or a valid CLOUDFLARE_API_TOKEN/CLOUDFLARE_CACHE_PURGER.",
  );
}

function decodeXmlEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function listExistingR2Keys({ host, bucket, prefix, accessKeyId, secretAccessKey }) {
  const keys = new Set();
  let continuationToken = null;
  let pages = 0;

  while (true) {
    pages += 1;
    const queryParams = {
      "list-type": "2",
      "max-keys": "1000",
      prefix: `${prefix}/`,
    };
    if (continuationToken) {
      queryParams["continuation-token"] = continuationToken;
    }

    const { url, headers } = signS3Request({
      method: "GET",
      host,
      canonicalUri: `/${bucket}`,
      queryParams,
      payloadHash: EMPTY_SHA256,
      accessKeyId,
      secretAccessKey,
    });

    const response = await fetchWithRetries(url, { method: "GET", headers });
    const xml = await response.text();

    for (const match of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
      keys.add(decodeXmlEntities(match[1]));
    }

    const truncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
    if (!truncated) break;
    const nextMatch = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/);
    if (!nextMatch) break;
    continuationToken = decodeXmlEntities(nextMatch[1]);
  }

  return { keys, pages };
}

async function fetchWithRetries(url, init, { maxAttempts = 5, timeoutMs = 60_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.ok) return response;
      const body = await response.text().catch(() => "");
      const retryable = response.status === 429 || response.status >= 500;
      const error = new Error(`HTTP ${response.status}: ${body.slice(0, 300)}`);
      if (!retryable || attempt === maxAttempts) throw error;
      lastError = error;
      const retryAfter = Number(response.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(10_000, 300 * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) throw error;
      const delayMs = Math.min(10_000, 300 * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

async function putR2Object({
  host,
  bucket,
  key,
  body,
  contentType,
  accessKeyId,
  secretAccessKey,
}) {
  const payloadHash = crypto.createHash("sha256").update(body).digest("hex");
  const { url, headers } = signS3Request({
    method: "PUT",
    host,
    canonicalUri: `/${bucket}/${encodeS3Path(key)}`,
    extraHeaders: {
      "cache-control": IMMUTABLE_CACHE_CONTROL,
      "content-disposition": "inline",
      "content-type": contentType,
    },
    payloadHash,
    accessKeyId,
    secretAccessKey,
  });
  const response = await fetchWithRetries(url, { method: "PUT", headers, body });
  await response.arrayBuffer();
}

async function renderResponsiveWebp(sharpFn, sourceBuffer, width, isDiagram) {
  const source = sharpFn(sourceBuffer, {
    failOn: "error",
    limitInputPixels: MAX_IMAGE_PIXELS,
    pages: 1,
    animated: false,
  });
  const resized = source
    .clone()
    .resize({ width, fit: "inside", withoutEnlargement: true, kernel: "lanczos3" });

  let { data } = await resized
    .clone()
    .webp(isDiagram ? { lossless: true, effort: 4 } : { quality: 90, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  if (isDiagram && data.length > sourceBuffer.length) {
    const lossy = await resized
      .clone()
      .webp({ quality: 95, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    if (lossy.data.length < data.length) {
      data = lossy.data;
    }
  }
  return data;
}

async function runPool(items, concurrency, worker) {
  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        await worker(items[index], index);
      }
    }),
  );
}

async function verifySampleAssets(domain, prefix, manifest) {
  const entries = Object.entries(manifest).filter(([, entry]) => entry.pub === 1);
  const samplePng = entries.find(([rel, entry]) => entry.rw === 1 && entry.w >= 640 && rel.endsWith(".png"));
  const sampleMp4 = entries.find(([rel]) => rel.endsWith(".mp4"));
  const sampleGif = entries.find(([rel]) => rel.endsWith(".gif"));

  const urls = [];
  if (samplePng) {
    const [rel, entry] = samplePng;
    urls.push({
      label: "PNG original",
      url: `https://${domain}/${prefix}/${entry.v}/${rel}`,
      expectedType: "image/png",
    });
    urls.push({
      label: "WebP responsive 640w",
      url: `https://${domain}/${prefix}/${entry.v}-w640-cv${RESPONSIVE_ENCODER_VERSION}/${rel}.webp`,
      expectedType: "image/webp",
    });
  }
  if (sampleMp4) {
    const [rel, entry] = sampleMp4;
    urls.push({
      label: "MP4 animation",
      url: `https://${domain}/${prefix}/${entry.v}/${rel}`,
      expectedType: "video/mp4",
    });
  }
  if (sampleGif) {
    const [rel, entry] = sampleGif;
    urls.push({
      label: "GIF animation",
      url: `https://${domain}/${prefix}/${entry.v}/${rel}`,
      expectedType: "image/gif",
    });
  }

  for (const item of urls) {
    let lastStatus = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(item.url, {
        headers: { Origin: "https://leetllm.com" },
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      await res.arrayBuffer();
      if (res.status !== 200) {
        throw new Error(`Verification failed for ${item.url}: HTTP ${res.status}`);
      }
      const ct = res.headers.get("content-type")?.split(";")[0];
      if (ct !== item.expectedType) {
        throw new Error(`Verification MIME mismatch for ${item.url}: got ${ct}, expected ${item.expectedType}`);
      }
      const cc = res.headers.get("cache-control");
      if (cc !== IMMUTABLE_CACHE_CONTROL) {
        throw new Error(`Verification Cache-Control mismatch for ${item.url}: ${cc}`);
      }
      lastStatus = res.headers.get("cf-cache-status");
    }
    console.log(`   ✅ Verified ${item.label}: ${item.url} (CF-Cache-Status=${lastStatus})`);
  }
}

async function main() {
  const startedAt = Date.now();
  const options = parseArgs(process.argv.slice(2));
  const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
  const { accountId, bucket, domain, prefix } = config;
  const host = `${accountId}.r2.cloudflarestorage.com`;

  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `Missing ${MANIFEST_PATH}. Run "pnpm --dir web content-images:build" first.`,
    );
  }

  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  const publicEntries = Object.entries(manifest).filter(([, entry]) => entry.pub === 1);
  const privateCount = Object.keys(manifest).length - publicEntries.length;

  const { accessKeyId, secretAccessKey } = await resolveR2S3Credentials(accountId, options.envFile);
  const { keys: existingKeys, pages } = await listExistingR2Keys({
    host,
    bucket,
    prefix,
    accessKeyId,
    secretAccessKey,
  });

  // Group missing work per source file so each PNG is read & decoded only once.
  const jobs = [];
  let totalExpectedObjects = 0;
  let missingOriginals = 0;
  let missingVariants = 0;

  for (const [rel, entry] of publicEntries) {
    const originalKey = `${prefix}/${entry.v}/${rel}`;
    totalExpectedObjects += 1;
    const needOriginal = !existingKeys.has(originalKey);
    if (needOriginal) missingOriginals += 1;

    const missingWidths = [];
    if (entry.rw === 1 && Number.isInteger(entry.w)) {
      for (const width of RESPONSIVE_IMAGE_WIDTHS) {
        if (width > entry.w) continue;
        totalExpectedObjects += 1;
        const variantKey = `${prefix}/${entry.v}-w${width}-cv${RESPONSIVE_ENCODER_VERSION}/${rel}.webp`;
        if (!existingKeys.has(variantKey)) {
          missingWidths.push({ width, key: variantKey });
          missingVariants += 1;
        }
      }
    }

    if (needOriginal || missingWidths.length > 0) {
      jobs.push({
        rel,
        entry,
        originalKey,
        needOriginal,
        missingWidths,
      });
    }
  }

  const totalMissing = missingOriginals + missingVariants;
  console.log(
    `☁️  R2 content-asset sync (${domain} / bucket=${bucket}): `
      + `${publicEntries.length} public assets (${privateCount} private excluded), `
      + `${totalExpectedObjects} total CDN objects, `
      + `${existingKeys.size} existing in R2 (${pages} list page(s)), `
      + `${totalMissing} to upload (${missingOriginals} originals, ${missingVariants} WebP variants)`,
  );

  if (options.dryRun) {
    console.log("   Dry run enabled; skipping uploads.");
    return;
  }

  if (jobs.length > 0) {
    let sharpFn = null;
    if (missingVariants > 0) {
      const webRequire = createRequire(path.join(WEB_DIR, "package.json"));
      sharpFn = webRequire("sharp");
    }

    let uploadedCount = 0;
    let uploadedBytes = 0;
    let lastReportAt = Date.now();
    const isDiagramPath = (rel) => rel.includes("/diagrams/");

    await runPool(jobs, options.concurrency, async (job) => {
      const fullPath = path.join(CONTENT_DIR, job.rel);
      const buffer = await fs.readFile(fullPath);

      if (job.needOriginal) {
        await putR2Object({
          host,
          bucket,
          key: job.originalKey,
          body: buffer,
          contentType: contentTypeFor(job.rel),
          accessKeyId,
          secretAccessKey,
        });
        uploadedCount += 1;
        uploadedBytes += buffer.length;
      }

      if (job.missingWidths.length > 0) {
        const isDiagram = isDiagramPath(job.rel);
        for (const variant of job.missingWidths) {
          const webpBytes = await renderResponsiveWebp(sharpFn, buffer, variant.width, isDiagram);
          await putR2Object({
            host,
            bucket,
            key: variant.key,
            body: webpBytes,
            contentType: "image/webp",
            accessKeyId,
            secretAccessKey,
          });
          uploadedCount += 1;
          uploadedBytes += webpBytes.length;
        }
      }

      const now = Date.now();
      if (now - lastReportAt >= 5_000) {
        lastReportAt = now;
        const pct = ((uploadedCount / totalMissing) * 100).toFixed(1);
        const mb = (uploadedBytes / (1024 * 1024)).toFixed(1);
        console.log(`   ... uploaded ${uploadedCount}/${totalMissing} objects (${pct}%, ${mb} MiB)`);
      }
    });

    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    const totalMb = (uploadedBytes / (1024 * 1024)).toFixed(1);
    console.log(
      `   ✅ Uploaded ${uploadedCount} objects (${totalMb} MiB) to R2 in ${elapsedSec}s`,
    );
  } else {
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`   ✅ All ${totalExpectedObjects} public CDN objects already present in R2 (${elapsedSec}s)`);
  }

  if (options.verify) {
    await verifySampleAssets(domain, prefix, manifest);
  }
}

main().catch((error) => {
  console.error("❌ R2 content-asset sync failed:", error);
  process.exit(1);
});
