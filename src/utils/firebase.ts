import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPrX1UpzWV2SI-WtBpkKsrcG-325uZLxs",
  authDomain: "sticks-1c62c.firebaseapp.com",
  projectId: "sticks-1c62c",
  storageBucket: "sticks-1c62c.firebasestorage.app",
  messagingSenderId: "191730439503",
  appId: "1:191730439503:web:9074aade3c24b0f858e13a",
  measurementId: "G-MN9F9KKX9R",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;
