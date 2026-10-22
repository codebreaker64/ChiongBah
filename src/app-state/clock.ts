/** The app's clock. Screens read time only through this, so tests can fix it. */
export function now(): Date {
  return new Date();
}
