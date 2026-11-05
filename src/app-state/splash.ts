/**
 * The animated splash runs once per cold start (redesign spec section 6.1). A warm start keeps the
 * JavaScript context, so this module-level flag is already set and the splash is skipped.
 */
let shown = false;

export const splash = {
  /** True the first time it is asked in this JavaScript context. */
  claim(): boolean {
    if (shown) return false;
    shown = true;
    return true;
  },
};
