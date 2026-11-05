import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * The app is portrait everywhere except "Get in frame" and "Counting", which lock to either
 * landscape direction so the phone can be propped up either way (redesign spec section 6.4).
 */
export function lockPortrait() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

export function lockLandscape() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
}
