import fs from 'node:fs/promises';

export const DEFAULT_CLOUDFLARE_TIMEOUT_MS = 180_000;
export const MAX_CLOUDFLARE_TIMEOUT_MS = 900_000;

function requestTimeout(value) {
  if (!Number.isSafeInteger(value) || value < 1_000 || value > MAX_CLOUDFLARE_TIMEOUT_MS)
    throw Error('Cloudflare request timeout must be an integer between 1000 and 900000 ms');
  return value;
}

export async function cloudflareToken(envFile) {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  if (envFile) {
    const text = await fs.readFile(envFile, 'utf8');
    const value = text
      .match(/^\s*(?:export\s+)?CLOUDFLARE_(?:API_TOKEN|CACHE_PURGER)\s*=\s*(.+)$/m)?.[1]
      ?.trim();
    if (value) return value.replace(/^(['"])(.*)\1$/, '$2');
  }
  throw Error('Set CLOUDFLARE_API_TOKEN or pass --env-file with a Cloudflare API token.');
}

export function cloudflareClient(
  token,
  { timeoutMs = DEFAULT_CLOUDFLARE_TIMEOUT_MS, fetcher = fetch } = {},
) {
  requestTimeout(timeoutMs);
  return async function request(
    resource,
    { method = 'GET', body, headers = {}, timeoutMs: overrideTimeout = timeoutMs } = {},
  ) {
    const deadline = requestTimeout(overrideTimeout);
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await fetcher(`https://api.cloudflare.com/client/v4/${resource}`, {
          method,
          redirect: 'error',
          signal: AbortSignal.timeout(deadline),
          headers: { authorization: `Bearer ${token}`, ...headers },
          body,
        });
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
        if (!response.ok || data?.success === false) {
          const error = Error(
            `Cloudflare ${method} ${resource}: HTTP ${response.status}; ${JSON.stringify(data?.errors ?? [])}`,
          );
          error.status = response.status;
          throw error;
        }
        return data?.result ?? data;
      } catch (error) {
        if (attempt >= 2 || (error.status && error.status !== 429 && error.status < 500)) {
          if (error.status) throw error;
          const codes = new Set();
          let cause = error;
          for (let depth = 0; cause && depth < 5; depth++, cause = cause.cause)
            if (typeof cause.code === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(cause.code))
              codes.add(cause.code);
          const detail = codes.size ? ` [transport: ${[...codes].join(' -> ')}]` : '';
          const message = String(error.message).replaceAll(token, '[redacted]');
          throw Error(`Cloudflare ${method} ${resource}: ${message}${detail}`, { cause: error });
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
      }
    }
  };
}

export async function configureVideoBucket(request, config) {
  const { accountId, zoneId, bucket, domain } = config;
  const base = `accounts/${accountId}/r2/buckets`;
  const json = (body) => ({
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
  const inventory = await request(base);
  if (!inventory.buckets.some((row) => row.name === bucket)) {
    await request(base, {
      method: 'POST',
      ...json({ name: bucket, locationHint: 'enam', storageClass: 'Standard' }),
    });
  }
  const domains = await request(`${base}/${bucket}/domains/custom`);
  const current = domains.domains.find((row) => row.domain === domain);
  if (!current) {
    await request(`${base}/${bucket}/domains/custom`, {
      method: 'POST',
      ...json({ domain, zoneId, enabled: true, minTLS: '1.2' }),
    });
  } else if (!current.enabled) {
    throw Error(
      `${domain} already exists but is disabled. Inspect its ownership before enabling it.`,
    );
  }
  await request(`${base}/${bucket}/cors`, {
    method: 'PUT',
    ...json({
      rules: [
        {
          id: 'public-video-playback',
          allowed: { origins: ['*'], methods: ['GET', 'HEAD'], headers: ['Range'] },
          exposeHeaders: [
            'Accept-Ranges',
            'Content-Range',
            'Content-Length',
            'ETag',
            'CF-Cache-Status',
          ],
          maxAgeSeconds: 86400,
        },
      ],
    }),
  });
  const resource = `zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`;
  const rule = {
    ref: 'leetllm_immutable_video_assets',
    description: 'Cache immutable LeetLLM video assets',
    enabled: true,
    expression: `(http.host eq "${domain}" and starts_with(http.request.uri.path, "/lessons/") and http.request.method in {"GET" "HEAD"})`,
    action: 'set_cache_settings',
    action_parameters: {
      cache: true,
      edge_ttl: { mode: 'respect_origin' },
      browser_ttl: { mode: 'respect_origin' },
    },
  };
  let ruleset;
  try {
    ruleset = await request(resource);
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  if (!ruleset) {
    await request(`zones/${zoneId}/rulesets`, {
      method: 'POST',
      ...json({
        name: 'LeetLLM Cache Rules',
        kind: 'zone',
        phase: 'http_request_cache_settings',
        rules: [rule],
      }),
    });
  } else {
    const existing = ruleset.rules.find((row) => row.ref === rule.ref);
    const target = `zones/${zoneId}/rulesets/${ruleset.id}/rules`;
    await request(existing ? `${target}/${existing.id}` : target, {
      method: existing ? 'PATCH' : 'POST',
      ...json(rule),
    });
  }
  return {
    bucket: await request(`${base}/${bucket}`),
    domains: await request(`${base}/${bucket}/domains/custom`),
  };
}
