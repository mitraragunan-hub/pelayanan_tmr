import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase Asli Anda
const firebaseConfig = {
  apiKey: "AIzaSyAQ4J0orZMgNYz1jPi-2-Io4_0hTXgnvBs",
  authDomain: "datalayanangratis.firebaseapp.com",
  projectId: "datalayanangratis",
  storageBucket: "datalayanangratis.firebasestorage.app",
  messagingSenderId: "269081913775",
  appId: "1:269081913775:web:f8b3c5ab0a6661bb94e75a"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
