import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
         collection, getDocs, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

if (!window.LISAF_CONFIG?.firebase) {
  console.error("Missing js/config.js — copy js/config.example.js to js/config.js");
}
const firebaseConfig = window.LISAF_CONFIG.firebase;
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
window._backend = "firebase";
window._db=db; window._doc=doc; window._getDoc=getDoc; window._setDoc=setDoc;
window._addDoc=addDoc; window._updateDoc=updateDoc; window._deleteDoc=deleteDoc;
window._collection=collection; window._getDocs=getDocs; window._query=query;
window._orderBy=orderBy; window._serverTimestamp=serverTimestamp;
window.dispatchEvent(new Event('firebaseReady'));
