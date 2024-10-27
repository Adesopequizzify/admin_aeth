// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAhWFRpuUICbR5PMIfoJ8elHiKBXa5ZhIg",
  authDomain: "aether-io.firebaseapp.com",
  projectId: "aether-io",
  storageBucket: "aether-io.appspot.com",
  messagingSenderId: "502330983451",
  appId: "1:502330983451:web:aaa0cbfe053b91b788e4be",
  measurementId: "G-35MPTH2G2C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };