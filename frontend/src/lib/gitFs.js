import LightningFS from '@isomorphic-git/lightning-fs';

/** Virtual path where each simulated repo lives inside LightningFS. */
export const REPO_DIR = '/repo';

/**
 * Create an in-browser filesystem backed by IndexedDB (one DB per `name`).
 * Pass the returned instance as `fs` to every isomorphic-git call.
 */
export function createGitFs(name = `gitit-${Date.now()}`) {
  return new LightningFS(name);
}
