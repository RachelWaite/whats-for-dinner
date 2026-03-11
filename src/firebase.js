import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeDmZpKp6rp2gZ0icquHrbxyOmNB6qfeU",
  authDomain: "whats-for-dinner-ab2c4.firebaseapp.com",
  projectId: "whats-for-dinner-ab2c4",
  storageBucket: "whats-for-dinner-ab2c4.firebasestorage.app",
  messagingSenderId: "848202993957",
  appId: "1:848202993957:web:a8d42fe2253b96d6bfcacc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);