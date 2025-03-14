import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvto1S6L6w9csjscmHgv-g1Oao6Lrp1p4",
  authDomain: "shanks-c3983.firebaseapp.com",
  projectId: "shanks-c3983",
  storageBucket: "shanks-c3983.firebasestorage.app",
  messagingSenderId: "685113707619",
  appId: "1:685113707619:web:63394aa9cdf41c7a31bc56",
  
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);