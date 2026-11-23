// Source snapshots and declared labels from the article's report mini-lab.
export const reportSources = {
  us: {
    id: 'policy-us-v3',
    text: 'Identity verification is required. Manager approval is required before privileged scopes are queued.',
  },
  eu: {
    id: 'policy-eu-v2',
    text: 'Identity verification is required for access restores in the EU region.',
  },
};
export const managerClaim = 'Manager approval is not required before privileged scopes are queued';
export const securityClaim = 'Security review is required before privileged scopes are queued';

export function reportWordCheck(claim, source) {
  const words = (value) => value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const evidence = new Set(words(source));
  const checked = new Set(words(claim).filter((word) => word.length > 3));
  return checked.size > 0 && [...checked].every((word) => evidence.has(word));
}
