const { addReleaseSigning } = require('./withReleaseSigning');

// The relevant part of the app/build.gradle that `expo prebuild` generates for SDK 58.
const TEMPLATE = `
android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.debug
            minifyEnabled enableMinifyInReleaseBuilds
        }
    }
}`;

test('adds a release signing config and uses it when a keystore is given', () => {
  const out = addReleaseSigning(TEMPLATE);
  expect(out).toContain("def uploadStore = System.getenv('CHIONGBAH_UPLOAD_STORE_FILE')");
  expect(out).toContain("signingConfig System.getenv('CHIONGBAH_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug");
  // Debug builds keep the debug key.
  expect(out).toMatch(/debug \{\s*signingConfig signingConfigs\.debug\s*\}/);
});

test('running twice changes nothing', () => {
  const once = addReleaseSigning(TEMPLATE);
  expect(addReleaseSigning(once)).toBe(once);
});

test('fails loudly if the template changes shape', () => {
  expect(() => addReleaseSigning('android { }')).toThrow(/signingConfigs.debug not found/);
});
