import { sources } from './fixtures.mjs';
export function verifyHandoff(wire, records = sources) {
  const bytes = Buffer.byteLength(wire, 'utf8');
  if (bytes > 200)
    return {
      bytes,
      size: false,
      schema: false,
      known: false,
      support: false,
      accepted: false,
    };
  let item;
  try {
    item = JSON.parse(wire);
  } catch {
    return {
      bytes,
      size: true,
      schema: false,
      known: false,
      support: false,
      accepted: false,
    };
  }
  const schema =
    item &&
    !Array.isArray(item) &&
    Object.keys(item).sort().join() === 'claim,source' &&
    typeof item.claim === 'string' &&
    typeof item.source === 'string';
  const known = Boolean(schema && Object.hasOwn(records, item.source));
  const support = Boolean(
    known &&
    ((item.claim === 'auth error' && records[item.source].status >= 400) ||
      (item.claim === 'trace succeeded' && records[item.source].status < 400)),
  );
  return {
    bytes,
    size: true,
    schema,
    known,
    support,
    accepted: Boolean(schema && known && support),
    item,
  };
}
export function uniqueContextJson(text) {
  let i = 0;
  const whitespace = () => {
    while (i < text.length && /[ \t\r\n]/.test(text[i])) i++;
  };
  const string = () => {
    if (text[i] !== '"') throw new Error('expected JSON string');
    const start = i++;
    for (; i < text.length; i++) {
      if (text[i] === '\\') {
        i++;
        continue;
      }
      if (text[i] === '"') {
        i++;
        return JSON.parse(text.slice(start, i));
      }
    }
    throw new Error('unfinished JSON string');
  };
  const value = () => {
    whitespace();
    if (text[i] === '"') return string();
    if (text[i] === '{') {
      i++;
      whitespace();
      const entries = [],
        keys = new Set();
      if (text[i] === '}') {
        i++;
        return {};
      }
      for (;;) {
        whitespace();
        const key = string();
        if (keys.has(key)) throw new Error('duplicate JSON key');
        keys.add(key);
        whitespace();
        if (text[i++] !== ':') throw new Error('expected colon');
        entries.push([key, value()]);
        whitespace();
        if (text[i] === '}') {
          i++;
          return Object.fromEntries(entries);
        }
        if (text[i++] !== ',') throw new Error('expected comma');
      }
    }
    if (text[i] === '[') {
      i++;
      whitespace();
      const result = [];
      if (text[i] === ']') {
        i++;
        return result;
      }
      for (;;) {
        result.push(value());
        whitespace();
        if (text[i] === ']') {
          i++;
          return result;
        }
        if (text[i++] !== ',') throw new Error('expected comma');
      }
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(
      text.slice(i),
    );
    if (!match) throw new Error('invalid JSON value');
    i += match[0].length;
    return JSON.parse(match[0]);
  };
  const result = value();
  whitespace();
  if (i !== text.length) throw new Error('trailing JSON');
  return result;
}
export function completeWorkerBoundary(
  wire,
  knownSources = new Set(['trace-17', 'runbook-v4-section-4']),
  limit = 1600,
) {
  if (!Number.isInteger(limit) || limit <= 0)
    throw new Error('byte limit must be positive integer');
  const bytes = wire instanceof Uint8Array ? wire.byteLength : null;
  const result = {
    bytes,
    limit,
    size: bytes !== null && bytes <= limit,
    decoded: false,
    schema: false,
    known: false,
    accepted: false,
    item: null,
  };
  if (!result.size) return result;
  try {
    const text = new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: true,
    }).decode(wire);
    result.decoded = true;
    result.item = uniqueContextJson(text);
  } catch (error) {
    return {
      ...result,
      reason: error.message,
    };
  }
  const item = result.item;
  result.schema = Boolean(
    item &&
    !Array.isArray(item) &&
    typeof item === 'object' &&
    Object.keys(item).sort().join() === 'claim,next_check,source_ids' &&
    ['claim', 'next_check'].every((k) => typeof item[k] === 'string' && item[k].trim()) &&
    Array.isArray(item.source_ids) &&
    item.source_ids.length &&
    item.source_ids.every((id) => typeof id === 'string'),
  );
  result.known = result.schema && item.source_ids.every((id) => knownSources.has(id));
  result.accepted = Boolean(result.schema && result.known);
  return result;
}
