import os from "node:os";

export function getNumCpus() {
  return os.cpus().length;
}

// STATUS DUMP: testing to see if I can properly de-hydrate state and create my withPrefetch hook
// to use prefetch in loaders
