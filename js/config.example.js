/**
 * LISAF public site config template.
 * 1. Copy this file to js/config.js
 * 2. Fill in your values
 * 3. Keep secrets out of public chats; rotate anything that was ever committed
 *
 * NOTE (GitHub Pages / static hosting):
 * Anything loaded by the browser is visible in DevTools. Firebase web API keys
 * are designed to be public — protect data with Firestore Security Rules.
 * The admin password in this file is NOT true security; migrate to Firebase Auth soon.
 */
window.LISAF_CONFIG = {
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },

  // Admin panel login (temporary — use Firebase Auth for real protection)
  adminPassword: "CHANGE_ME_STRONG_PASSWORD",

  // Payment public keys only (never put secret keys in frontend code)
  flutterwavePublicKey: "YOUR_FLUTTERWAVE_PUBLIC_KEY",
  paystackPublicKey: "YOUR_PAYSTACK_PUBLIC_KEY",

  // Cloudinary unsigned upload preset (name is visible client-side by design)
  cloudinary: {
    cloudName: "YOUR_CLOUD_NAME",
    uploadPreset: "YOUR_UNSIGNED_PRESET"
  }
};
