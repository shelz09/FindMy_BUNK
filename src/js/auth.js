// auth.js
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// UI Selectors
const userbtn = document.querySelector(".user");
const adminbtn = document.querySelector(".admin");
const showpasswordBtn = document.querySelector(".showpassword");
const hidepasswordBtn = document.querySelector(".hidepassword");
const UserName = document.querySelector(".userName"); // For signup
const UserEmail = document.querySelector(".userEmail");
const passwordInput = document.querySelector(".passwordInput");
const LoginBtn = document.querySelector(".login-btn");
const SignupBtn = document.querySelector(".signup-btn");

let selectedRole = "user";

// Role Switch Buttons
userbtn.addEventListener("click", () => {
  selectedRole = "user";
  userbtn.classList.add("active");
  adminbtn.classList.remove("active");
});

adminbtn.addEventListener("click", () => {
  selectedRole = "admin";
  adminbtn.classList.add("active");
  userbtn.classList.remove("active");
});

// Password Toggle
showpasswordBtn.addEventListener("click", () => {
  showpasswordBtn.classList.add("hide");
  hidepasswordBtn.classList.remove("hide");
  passwordInput.type = "text";
});

hidepasswordBtn.addEventListener("click", () => {
  hidepasswordBtn.classList.add("hide");
  showpasswordBtn.classList.remove("hide");
  passwordInput.type = "password";
});

// Login Functionality
LoginBtn.addEventListener("click", () => {
  const email = UserEmail.value;
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const uid = userCredential.user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role === selectedRole) {
          const redirectPage = selectedRole === "admin" ? "admin_dashboard.html" : "user_dashboard.html";
          window.location.href = redirectPage;
        } else {
          alert(`Role mismatch! You are registered as ${userData.role}.`);
        }
      } else {
        alert("User data not found. Please sign up first.");
      }
    })
    .catch((error) => {
      if (error.code === "auth/wrong-password") {
        alert("Incorrect password. Please try again.");
      } else if (error.code === "auth/user-not-found") {
        alert("No account found with this email. Please sign up first.");
      } else {
        alert("Login failed: " + error.message);
      }
      console.error(error);
    });
});

// Signup Functionality
SignupBtn.addEventListener("click", () => {
  const name = UserName.value;
  const email = UserEmail.value;
  const password = passwordInput.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        role: selectedRole,
        createdAt: new Date()
      });

      alert("Signup successful!");
      const redirectPage = selectedRole === "admin" ? "admin_dashboard.html" : "user_dashboard.html";
      window.location.href = redirectPage;
    })
    .catch((error) => {
      if (error.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please log in instead.");
      } else {
        alert("Signup failed: " + error.message);
      }
      console.error(error);
    });
});
