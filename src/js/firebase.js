
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyA_eFtjvk51NB15Ae1qvAr3k4Lad6ODv0w",
  authDomain: "ev-charging-slot-bookin-a5f6b.firebaseapp.com",
  projectId: "ev-charging-slot-bookin-a5f6b",
  storageBucket: "ev-charging-slot-bookin-a5f6b.firebasestorage.app",
  messagingSenderId: "1013887176973",
  appId: "1:1013887176973:web:d424da369e0a5f32542044"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };