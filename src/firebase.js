// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDVK5U2FwfLF5ZQaoFUC5ppfrrJ4i68Ok",
  authDomain: "rentpar-7656b.firebaseapp.com",
  databaseURL: "https://rentpar-7656b-default-rtdb.firebaseio.com/",
  projectId: "rentpar-7656b",
  storageBucket: "rentpar-7656b.firebasestorage.app",
  messagingSenderId: "872808503090",
  appId: "1:872808503090:web:3dc2a08081681afee3a92b",
  measurementId: "G-0L18WSQZ80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export const db = getDatabase(app);
export {auth}