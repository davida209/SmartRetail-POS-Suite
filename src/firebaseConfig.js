import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "aaaaaaaag",
  authDomain: "aaaaaa",
  projectId: "aaaaa9",
  storageBucket: "aaaaa",
  messagingSenderId: "aaaaa",
  appId: "1:10aaaaaa",
  measurementId: "aaaaaaaaa"
};

const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);
