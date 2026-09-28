/**
 * LISAF runtime config (loaded by all pages).
 * For GitHub Pages this file must be deployed — browser configs are visible.
 * Protect Firestore with Security Rules; plan Firebase Auth for admin.
 */
window.LISAF_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBq1WdhNxNgCiLIXumDMWT3RycOL7GxqYQ",
    authDomain: "liftandserveallfoundatio-6d136.firebaseapp.com",
    projectId: "liftandserveallfoundatio-6d136",
    storageBucket: "liftandserveallfoundatio-6d136.firebasestorage.app",
    messagingSenderId: "132864715952",
    appId: "1:132864715952:web:90d362cb57cd59f01a5f75"
  },

  adminPassword: "LISAFadmin2025",

  flutterwavePublicKey: "FLWPUBK-8d177ee5d3055222ca65502087dfcc53-X",
  paystackPublicKey: "YOUR_PAYSTACK_PUBLIC_KEY",

  cloudinary: {
    cloudName: "dedskziix",
    uploadPreset: "lisaf2025"
  }
};
