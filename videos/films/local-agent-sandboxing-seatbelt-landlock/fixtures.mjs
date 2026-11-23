export const attempts = [
  {
    path: '/workspace/src/app.py',
    label: 'Source edit',
  },
  {
    path: '/workspace/src/../../home/dev/.ssh/key.pem',
    label: 'Parent traversal',
  },
  {
    path: '/workspace/.git/hooks/post-checkout',
    label: 'Hook write',
  },
  {
    path: '/workspace/src/key-link',
    label: 'Symbolic link',
  },
];
export const LINKS = Object.freeze({
  '/workspace/src/key-link': '/home/dev/.ssh/key.pem',
});

export const reportRequest = 'src/cache/../report.txt';
export const reportCommand = 'printf x >> ' + reportRequest;

// Recorded on macOS 26.7.1. Each checkout began with two empty regular files.
// WRITABLE was the absolute path to that checkout's src directory.
export const reportProfile =
  '(version 1)(allow default)(deny file-write*)(allow file-write-data (subpath (param "WRITABLE")))';
export const reportRuns = [
  { name: 'A', link: null, exit: 0, stderr: '', sourceBytes: 1, archiveBytes: 0 },
  {
    name: 'B',
    link: '../archive/daily',
    exit: 1,
    stderr: '/bin/sh: src/cache/../report.txt: Operation not permitted',
    sourceBytes: 0,
    archiveBytes: 0,
  },
];
