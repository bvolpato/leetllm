import { digest } from './arithmetic.mjs';
export const REQUEST = {
  tenant: 'tenant7',
  request: 'release-17',
  release: 'r17',
  version: 3,
  traffic: 25,
};
export const values = {
  eval: {
    failures: 2,
    cases: 100,
  },
  health: {
    errors: 4,
    requests: 10000,
  },
  policy: {
    maxTraffic: 25,
  },
};
export const RECEIPTS = Object.keys(values).map((branch) => ({
  ...REQUEST,
  branch,
  time: 990,
  value: values[branch],
  digest: digest(values[branch]),
}));
