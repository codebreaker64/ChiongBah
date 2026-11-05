/**
 * Extends app.json with values that change per build. CI sets these so every release has a
 * higher versionCode than the last (Android refuses to update to a lower one).
 *   APP_VERSION        e.g. 1.2.0, from the git tag v1.2.0
 *   ANDROID_VERSION_CODE  a whole number that only goes up
 */
module.exports = ({ config }) => ({
  ...config,
  version: process.env.APP_VERSION || config.version,
  android: {
    ...config.android,
    versionCode: process.env.ANDROID_VERSION_CODE ? Number(process.env.ANDROID_VERSION_CODE) : config.android.versionCode,
  },
});
