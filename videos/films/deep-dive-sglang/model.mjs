import { common, phase, sum } from './arithmetic.mjs';
import { a, draft, other, payload, target, transferMs, z } from './fixtures.mjs';
import {
  cueBegun,
  cueComplete,
  cueProgress,
  motion,
  settled,
  sgBegun,
  sgProgress,
  tracks,
} from './construction.mjs';
export function insert(node, words) {
  if (!words.length) {
    node.terminal = true;
    return;
  }
  const edge = node.edges.find((e) => e.words[0] === words[0]);
  if (!edge) {
    node.edges.push({
      words,
      child: {
        terminal: true,
        edges: [],
      },
    });
    return;
  }
  const n = common(edge.words, words);
  if (n < edge.words.length) {
    const previous = {
      words: edge.words.slice(n),
      child: edge.child,
    };
    edge.words = edge.words.slice(0, n);
    edge.child = {
      terminal: false,
      edges: [previous],
    };
  }
  insert(edge.child, words.slice(n));
}
export function treePaths(node, prefix = []) {
  return [
    ...(node.terminal ? [prefix] : []),
    ...node.edges.flatMap((e) => treePaths(e.child, [...prefix, ...e.words])),
  ];
}
export function grammarState(b, q, cues) {
  const closing = b === 2 || (b === 1 && cueBegun(cues, 'grammar-close-object', q >= 0.4)),
    selected = b === 2 || (b === 1 && cueBegun(cues, 'grammar-select-category', q >= 0.4));
  const labels = closing ? ['}', ',', '42', 'bug'] : ['bug', 'feature', 'question', '42'],
    raw = closing ? [0.6, 0.2, 0.1, 0.1] : [0.45, 0.35, 0.15, 0.05],
    allowed = closing ? [true, false, false, false] : [true, true, true, false];
  const maskReady = b > 0 || cueBegun(cues, 'grammar-mask-number', true),
    masked = raw.map((p, i) => (maskReady && !allowed[i] ? 0 : p)),
    mass = sum(masked),
    probabilities = masked.map((p) => p / mass);
  const normalized = closing
    ? allowed.filter(Boolean).length
    : b === 0
      ? 0
      : Math.ceil(3 * cueProgress(cues, 'grammar-beat-2-focus-1', 1));
  return {
    closing,
    selected,
    labels,
    raw,
    allowed,
    masked,
    mass,
    probabilities,
    normalized,
    maskReady,
    complete: b === 2,
    accurate: false,
  };
}
export function speculativeState(b, q, cues) {
  const agreement = common(draft, target),
    prefix = Math.ceil(
      agreement * cueProgress(cues, 'speculate-agreed-prefix', Math.min(1, q / 0.5)),
    );
  const replacementReady =
    b > 1 || (b === 1 && cueComplete(cues, 'speculate-beat-2-focus-1', q >= 0.5));
  const compared = b === 0 ? 0 : replacementReady ? agreement + 1 : prefix,
    comparisons = Array.from(
      {
        length: compared,
      },
      (_, index) => ({
        index,
        draft: draft[index],
        target: target[index],
        agrees: draft[index] === target[index],
      }),
    );
  const mismatch = comparisons.find((row) => !row.agrees) ?? null,
    accepted = mismatch ? mismatch.index : comparisons.length,
    replacement = mismatch?.target ?? null;
  const committedFull = [...draft.slice(0, agreement), target[agreement]],
    commitCount =
      b === 2
        ? Math.ceil(committedFull.length * cueProgress(cues, 'speculate-commit-prefix', 1))
        : 0,
    committed = committedFull.slice(0, commitCount);
  const discarded =
    b === 2 && cueBegun(cues, 'speculate-beat-3-focus-1', true) ? draft.length - agreement : 0;
  return {
    agreement,
    compared,
    comparisons,
    mismatch,
    accepted,
    replacement,
    committed,
    discarded,
    discardedWords: discarded ? draft.slice(agreement) : [],
    cache: committed.slice(0, agreement).map((word, position) => ({
      position,
      word,
    })),
    pendingForward: committed.length > agreement ? committed[agreement] : null,
  };
}
export function handoffState(b, q, cues) {
  const end = 20 + transferMs,
    time =
      b === 0
        ? 20 * cueProgress(cues, 'disaggregate-create-kv', q)
        : b === 1
          ? 20 + transferMs * cueProgress(cues, 'disaggregate-beat-2-focus-2', q)
          : end;
  const transferred = Math.min(payload, (Math.max(0, time - 20) / transferMs) * payload),
    reserved =
      b > 1 || (b === 1 && cueBegun(cues, 'disaggregate-beat-2-focus-2', true)) ? payload : 0;
  const ready = reserved === payload && transferred >= payload - 1e-6,
    prefillComplete = time >= 20,
    decodeActive = b === 2 && ready && cueBegun(cues, 'disaggregate-open-decode-gate', true);
  return {
    payload,
    transferMs,
    time,
    end,
    transferred,
    reserved,
    ready,
    prefillComplete,
    decodeActive,
    request: 'R42',
  };
}
export function sampleModel(id, state) {
  if (!tracks[id])
    return {
      b: state.beat,
      q: phase(state.beatP),
    };
  const { b } = tracks[id].sample(state).snapshot,
    q = phase(b > state.beat ? 0 : state.beatP),
    base = {
      b,
      q,
    };
  if (id === 'radix') {
    const tree = {
        terminal: false,
        edges: [],
      },
      inserted = b > 1 || (b === 1 && cueBegun(state.cues, 'radix-beat-2-focus-2', true));
    insert(tree, a);
    if (inserted) insert(tree, z);
    const query = b === 2 ? other : z,
      matched = Math.max(...treePaths(tree).map((path) => common(path, query))),
      namespaceChanged = b === 2 && cueBegun(state.cues, 'radix-beat-3-focus-2', true);
    return {
      ...base,
      tree,
      query,
      matched,
      inserted,
      namespaceChanged,
      compatibleMatched: namespaceChanged ? 0 : matched,
    };
  }
  if (id === 'locks') {
    const released0 = b > 1 || (b === 1 && cueBegun(state.cues, 'locks-release-r0', true)),
      released1 = b === 2 && cueBegun(state.cues, 'locks-release-r1', true),
      owners = new Set([...(released0 ? [] : ['R0']), ...(released1 ? [] : ['R1'])]);
    return {
      ...base,
      owners,
      locations: [12, 13, 14, 15],
      evictable: owners.size === 0,
    };
  }
  if (id === 'overlap') {
    const overlap = b > 0,
      end = overlap ? 9 : 10;
    let time;
    if (b === 2) time = end;
    else if (!state.cues) time = overlap ? 1 + 8 * q : end * q;
    else if (b === 0)
      time = cueBegun(state.cues, 'overlap-beat-1-focus-2', false)
        ? 5 + 5 * cueProgress(state.cues, 'overlap-beat-1-focus-2', 0)
        : 5 * cueProgress(state.cues, 'overlap-beat-1-focus-1', 0);
    else if (cueBegun(state.cues, 'overlap-beat-2-focus-1', false))
      time = 5 + 4 * cueProgress(state.cues, 'overlap-beat-2-focus-1', 0);
    else if (cueBegun(state.cues, 'overlap-b-ready', false))
      time = 2 + 3 * cueProgress(state.cues, 'overlap-b-ready', 0);
    else time = 1 + cueProgress(state.cues, 'overlap-beat-2-focus-2', 0);
    return {
      ...base,
      overlap,
      end,
      time,
      intervals: [
        {
          id: 'planA',
          lane: 'host',
          start: 0,
          end: 1,
        },
        {
          id: 'gpuA',
          lane: 'gpu',
          start: 1,
          end: 5,
        },
        {
          id: 'planB',
          lane: 'host',
          start: overlap ? 1 : 5,
          end: overlap ? 2 : 6,
        },
        {
          id: 'gpuB',
          lane: 'gpu',
          start: overlap ? 5 : 6,
          end,
        },
      ],
    };
  }
  if (id === 'grammar')
    return {
      ...base,
      ...grammarState(b, q, state.cues),
    };
  if (id === 'speculate')
    return {
      ...base,
      ...speculativeState(b, q, state.cues),
    };
  if (id === 'disaggregate')
    return {
      ...base,
      ...handoffState(b, q, state.cues),
    };
  return {
    ...base,
  };
}
export function budgetStep({ decode, unmatched, budget }) {
  if (
    ![decode, unmatched, budget].every((v) => Number.isSafeInteger(v) && v >= 0) ||
    decode > budget
  )
    throw new RangeError('invalid scheduled-position budget');
  const prefill = Math.min(unmatched, budget - decode);
  return {
    decode,
    prefill,
    spent: decode + prefill,
    remaining: unmatched - prefill,
  };
}
export function prefixReuse(tokens, wanted, namespace, required, page = 1) {
  if (!Number.isSafeInteger(page) || page < 1)
    throw new RangeError('page must be a positive integer');
  const logical = common(tokens, wanted),
    aligned = Math.floor(logical / page) * page;
  return {
    logical,
    aligned,
    reusable: namespace === required ? aligned : 0,
  };
}
export function kvHandoff({
  reserved,
  received,
  currentAttempt,
  readyAttempt,
  model = true,
  layout = true,
  dtype = true,
  positions = true,
  readerReady = false,
}) {
  if (
    !Number.isSafeInteger(reserved) ||
    !Number.isSafeInteger(received) ||
    received < 0 ||
    received > reserved
  )
    throw new RangeError('invalid transfer byte inventory');
  const current = readyAttempt === currentAttempt,
    compatible = model && layout && dtype && positions;
  return {
    missing: reserved - received,
    current,
    compatible,
    canDecode: received === reserved && current && compatible && readerReady,
  };
}
export function freshHandoff(state) {
  const tokens = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const page = 4;
  const { reusable } = prefixReuse(tokens, tokens, 'A', 'B', page);
  const mib = 2 ** 20;
  const reserved = 96 * mib;
  const filled = motion(state, 'sg-fresh-fill', 1, 0.59, 0.84);
  const received = 64 * mib + Math.round((reserved - 64 * mib) * filled);
  const ready = settled(state, 'sg-fresh-ready', 2, 0.73);
  const inputs = { reserved, received, currentAttempt: 2, readerReady: ready };
  const current = kvHandoff({ ...inputs, readyAttempt: ready ? 2 : null });
  return {
    ...current,
    stale: kvHandoff({ ...inputs, readyAttempt: ready ? 1 : null }),
    receivedMiB: received / mib,
    missingMiB: current.missing / mib,
    ready,
    decode: current.canDecode && settled(state, 'sg-fresh-decode', 3, 0.19),
    reuseShown: settled(state, 'sg-fresh-zero', 1, 0.26),
    missingShown: settled(state, 'sg-fresh-missing', 1, 0.56),
    tokens,
    page,
    reusable,
  };
}
export function reclamationState(state) {
  const b = state.beat,
    readerDone = b === 1 && sgProgress(state, 'reader-complete', 0) >= 1,
    released = readerDone && sgBegun(state, 'owner-release'),
    reclaimed = released ? sgProgress(state, 'reclaim', 0) : 0;
  return {
    owners: b === 0 ? ['R0', 'R1'] : released ? [] : ['R1'],
    readerDone,
    evictable: released,
    reclaimed,
    readerProgress: b === 1 ? sgProgress(state, 'reader-complete', 0) : 0,
  };
}
export function speculativeCostState(state) {
  const later = state.beat > 1,
    failed = later || (state.beat === 1 && sgProgress(state, 'spec-zero', 0) >= 1),
    givens =
      later || (state.beat === 1 && sgProgress(state, 'speculative-economics-beat-1', 0) >= 1);
  return {
    givens,
    failed,
    advanced:
      !failed && sgBegun(state, 'spec-zero-input')
        ? null
        : failed
          ? 1
          : sgProgress(state, 'spec-cost', 0) >= 1
            ? 6
            : null,
    showCycle: later || sgProgress(state, 'spec-thirteen', 0) >= 1,
    showOrdinary: failed || sgProgress(state, 'spec-twentyfour', 0) >= 1,
  };
}
