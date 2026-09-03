import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBFN7rnYeZs22EGYOINP70wJoRTCazs9BA",
    authDomain: "gamingverse-26e57.firebaseapp.com",
    projectId: "gamingverse-26e57",
    storageBucket: "gamingverse-26e57.firebasestorage.app",
    messagingSenderId: "421816109452",
    appId: "1:421816109452:web:38f01f5e8ab71aa78faea9",
    measurementId: "G-8K70Z5DWQ0"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);