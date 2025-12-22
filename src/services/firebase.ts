import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBdAla3vH9KyPZLufH8bnIrA7W4qEs4ZBA",
  authDomain: "adhd-calendar-app.firebaseapp.com",
  projectId: "adhd-calendar-app",
  storageBucket: "adhd-calendar-app.firebasestorage.app",
  messagingSenderId: "226358576594",
  appId: "1:226358576594:web:47c154fd3bd270d6c3340b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
