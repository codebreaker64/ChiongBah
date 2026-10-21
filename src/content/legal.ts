// In-app Help, Terms of Service and Privacy Policy text.
// Draft written to match what the app does today; have it reviewed before a public release.

export type DocSection = { heading: string; body: string[] };

export const LAST_UPDATED = '21 Oct 2026';

/** Set to a real address to show the "Email us" row on Help & Support. */
export const SUPPORT_EMAIL = 'kaijiefong.work@gmail.com';

export const HELP: DocSection[] = [
  {
    heading: 'How is my score worked out?',
    body: [
      'Your latest result for each station is scored against the IPPT tables for your age group, then the three station points are added up. The award follows the published thresholds for your status and vocation.',
      'Every score in Chiong Bah is a practice estimate. Only your official IPPT counts.',
    ],
  },
  {
    heading: 'How do I change my IPPT or ORD date?',
    body: ['Open Settings, edit the date and tap Save. Home and Goals update straight away.'],
  },
  {
    heading: 'How do I fix a wrong result?',
    body: ['Open Log, tap Delete under the result and confirm. Then add the correct one with Add result.'],
  },
  {
    heading: 'Where is my data kept?',
    body: ['Only on this phone. There is no account and nothing is sent to a server. Uninstalling the app deletes your data.'],
  },
  {
    heading: 'Is this an official app?',
    body: ['No. Chiong Bah is not affiliated with MINDEF, SAF, SPF or SCDF.'],
  },
];

export const TERMS: DocSection[] = [
  {
    heading: 'About these terms',
    body: ['By using Chiong Bah you agree to these terms. If you do not agree, please do not use the app.'],
  },
  {
    heading: 'Unofficial app',
    body: [
      'Chiong Bah is an independent training aid. It is not affiliated with, endorsed by or connected to MINDEF, SAF, SPF or SCDF.',
      'Scores, awards and goal gaps are practice estimates. They may differ from your official IPPT result, and official rules and tables take precedence.',
    ],
  },
  {
    heading: 'Health and safety',
    body: [
      'The app does not give medical advice. Consult a doctor before training if you have a medical condition, an injury or any doubt about your fitness.',
      'Stop exercising if you feel pain, dizziness or shortness of breath. You train at your own risk.',
    ],
  },
  {
    heading: 'Your use of the app',
    body: ['Use the app for personal, lawful purposes. Do not attempt to copy, modify or redistribute it except as the law allows.'],
  },
  {
    heading: 'No warranty',
    body: ['The app is provided "as is". We do our best to keep it accurate, but we do not promise that it is error-free or always available.'],
  },
  {
    heading: 'Liability',
    body: ['To the extent the law allows, we are not liable for any loss or injury arising from your use of the app or reliance on its estimates.'],
  },
  {
    heading: 'Changes and governing law',
    body: [
      'We may update these terms. The date at the top shows the latest version, and continuing to use the app means you accept it.',
      'These terms are governed by the laws of Singapore.',
    ],
  },
];

export const PRIVACY: DocSection[] = [
  {
    heading: 'Summary',
    body: ['Chiong Bah keeps your data on your phone. There is no account, no advertising and no analytics, and we do not sell or share your data.'],
  },
  {
    heading: 'What the app stores',
    body: [
      'Your profile: date of birth, NSF or reservist status, service, vocation, and your ORD/ROD and IPPT dates.',
      'Your results and your goal.',
      'This is stored in a database on your device and is used only to calculate your countdowns, scores and goals.',
    ],
  },
  {
    heading: 'Camera',
    body: ['If you use camera rep counting, video frames are processed on your phone to detect your pose. Video is not recorded, saved or uploaded.'],
  },
  {
    heading: 'Health Connect',
    body: ['If you connect Health Connect, the app reads only the exercise data you allow, to import runs. You can withdraw access at any time in Health Connect settings. Imported data stays on your phone.'],
  },
  {
    heading: 'Backups',
    body: ['If you export a backup, the file is saved where you choose. Who can see it then depends on where you put it.'],
  },
  {
    heading: 'Deleting your data',
    body: ['Delete individual results in Log, or uninstall the app to remove all of its data from your phone.'],
  },
  {
    heading: 'Children',
    body: ['The app is meant for people preparing for national service fitness tests and is not directed at children under 13.'],
  },
  {
    heading: 'Changes',
    body: ['We may update this policy. The date at the top shows the latest version.'],
  },
];
