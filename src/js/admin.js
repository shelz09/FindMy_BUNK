import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { collection, addDoc, doc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const addSlotBtn = document.getElementById("add-slot");
const slotListAdmin = document.getElementById("slot-list-admin");
const logoutBtn = document.getElementById("logout-btn");



// Add a new slot
addSlotBtn.addEventListener("click", async () => {
  const stationId = document.getElementById("station-id").value.trim();
  const slotTime = document.getElementById("slot-time").value.trim();

  if (!stationId || !slotTime) {
    alert("Please fill Station ID and Slot Time.");
    return;
  }

  try {
    await addDoc(collection(db, "slots", stationId, "timeSlots"), {
      time: slotTime,
      status: "Available",
      bookedBy: "",
    });
    alert("Slot added successfully!");
    loadSlots(stationId);
  } catch (err) {
    console.error("Failed to add slot:", err);
  }
});

// Load slots for a station
async function loadSlots(stationId) {
  slotListAdmin.innerHTML = "Loading slots...";
  const slotsRef = collection(db, "slots", stationId, "timeSlots");
  const snapshot = await getDocs(slotsRef);
  slotListAdmin.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.innerHTML = `
      <p>${data.time} - ${data.status}</p>
      <button class="delete-slot" data-id="${docSnap.id}">Delete</button>
    `;
    div.querySelector(".delete-slot").addEventListener("click", async () => {
      await deleteDoc(doc(db, "slots", stationId, "timeSlots", docSnap.id));
      alert("Slot deleted.");
      loadSlots(stationId);
    });
    slotListAdmin.appendChild(div);
  });
}

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "auth.html";
});
