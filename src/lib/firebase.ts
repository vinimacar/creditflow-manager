import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgU7J-2M2bfa_dFsQ6Ps8DAYOM-ify8Hg",
  authDomain: "ecofin-c974e.firebaseapp.com",
  projectId: "ecofin-c974e",
  storageBucket: "ecofin-c974e.firebasestorage.app",
  messagingSenderId: "378572542594",
  appId: "1:378572542594:web:3afc0e864be3220dd79a9b",
  measurementId: "G-DSKYLR3HYY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Analytics (optional)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
