// firebase-config.js
const firebaseConfig = { 
    apiKey: "AIzaSyDj7Q2DJs6A3LEbSwywT0s_7GY7mgFBpC8", 
    authDomain: "omnistock-91499.firebaseapp.com", 
    databaseURL: "https://omnistock-91499-default-rtdb.europe-west1.firebasedatabase.app", 
    projectId: "omnistock-91499", 
    storageBucket: "omnistock-91499.firebasestorage.app", 
    messagingSenderId: "220713647884", 
    appId: "1:220713647884:web:c2fd803562af3be3e91329" 
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
