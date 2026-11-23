export function selectionKey(range) {
  if (
    !range ||
    !Number.isInteger(range.start) ||
    !Number.isInteger(range.end) ||
    range.start < 0 ||
    range.start > range.end
  )
    return null;
  return range.start + ':' + range.end;
}
export function fresh(response, current) {
  const responseRange = selectionKey(response.selection);
  const currentRange = selectionKey(current.selection);
  return (
    responseRange !== null &&
    currentRange !== null &&
    responseRange === currentRange &&
    ['document', 'version', 'cursor', 'policy', 'epoch'].every(
      (key) => response[key] === current[key],
    )
  );
}
export function route(trigger, semantic = true, permitted = true) {
  return semantic && trigger === '.'
    ? 'LOCAL SEMANTIC'
    : permitted === true
      ? 'REMOTE FIM'
      : 'LOCAL FALLBACK';
}
export function promptParts(extra = false) {
  return [
    {
      id: 'framing',
      label: 'Framing',
      value: 200,
    },
    {
      id: 'prefix',
      label: 'Prefix',
      value: 4500,
    },
    {
      id: 'suffix',
      label: 'Preserved suffix',
      value: 1000,
    },
    {
      id: 'definitions',
      label: 'Permitted definitions',
      value: 1800,
    },
    ...(extra
      ? [
          {
            id: 'snippet',
            label: 'Additional snippet slice',
            value: 500,
          },
        ]
      : []),
  ];
}
