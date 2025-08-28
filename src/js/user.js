import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import logger from './logger.js';
import { collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const apikey = "c4fe33f3-c3e2-40b6-8131-3fc8143ed52f";
const stationList = document.getElementById("station-list");

// Initialize map
const map = L.map("map", {
  maxBounds: [[-85, -180], [85, 180]],
  maxBoundsViscosity: 0,
}).setView([30.536404, 66.908499], 4.5);

L.tileLayer(
  "https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=2aUZ4ilYfbftR3lzBiUs",
  {
    attribution:
      '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>',
    minZoom: 2,
  }
).addTo(map);

// Get user location
navigator.geolocation.getCurrentPosition(
  async (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = Math.min(position.coords.accuracy || 100, 150);

    logger.log("User location accessed.");

    map.setView([lat, lng], 13);
    L.circleMarker([lat, lng], {
      radius: 8,
      color: "#3399FF",
      fillColor: "#3399FF",
      fillOpacity: 1,
    }).addTo(map);

    L.circle([lat, lng], {
      radius: accuracy,
      color: "#66b3ff",
      fillColor: "#cce6ff",
      fillOpacity: 0.3,
      weight: 1,
    }).addTo(map);

    const apiUrl = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&latitude=${lat}&longitude=${lng}&distance=200&distanceunit=KM&maxresults=100&key=${apikey}`;

    try {
      const response = await fetch(apiUrl);
      const stations = await response.json();

      logger.log(`Fetched ${stations.length} EV stations.`);

      stations.forEach((station) => {
        const sLat = station.AddressInfo?.Latitude || 0;
        const sLng = station.AddressInfo?.Longitude || 0;
        const sName = station.AddressInfo?.Title || "EV Charging Station";
        const sAddress = station.AddressInfo?.AddressLine1 || "Unknown Address";
        const sOperator = station.OperatorInfo?.Title || "Unknown Operator";
        const sUsage = station.UsageType?.Title || "Usage info not available";
        const sUID = station.AddressInfo?.ID?.toString() || "No UID";

        // Add marker to map
        L.marker([sLat, sLng])
          .addTo(map)
          .bindTooltip(`<b>${sName}</b><br>${sAddress}`, {
            permanent: true,
            direction: "top",
            offset: [0, -10],
            className: "ev-tooltip",
          });

        // Create station card
        const div = document.createElement("div");
        div.classList.add("station-card");
        div.innerHTML = `
          <h3>${sName}</h3>
          <p><strong>Address:</strong> ${sAddress}</p>
          <p><strong>Operator:</strong> ${sOperator}</p>
          <p><strong>Usage:</strong> ${sUsage}</p>`;

        div.addEventListener("click", async () => {
          document.getElementById("station-info").classList.remove("hidden");

          // Populate station info in side panel
          document.getElementById("info-name").textContent = sName;
          document.getElementById("info-address").textContent = sAddress;
          document.getElementById("info-operator").textContent = sOperator;
          document.getElementById("info-usage").textContent = sUsage;
          document.getElementById("info-coordinates").textContent = `${sLat.toFixed(3)}, ${sLng.toFixed(3)}`;
          document.getElementById("info-uid").textContent = sUID; // <-- Show UID

          // Copy to clipboard
          const copyBtn = document.getElementById("copy-uid-btn");
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(sUID)
              .then(() => alert("Station UID copied to clipboard!"))
              .catch(err => {
                logger.error("Failed to copy UID:", err);
                alert("Failed to copy UID.");
              });
          };

          // Directions link
          document.getElementById("directions-link").href =
            `https://www.google.com/maps/dir/?api=1&destination=${sLat},${sLng}`;

          map.setView([sLat, sLng], 15, {
            animate: true,
            pan: { duration: 0.5 },
          });

          logger.log(`Station clicked: ${sName}`);

          // Load slots
          const slotContainer = document.getElementById("slot-list");
          slotContainer.innerHTML = "<p>Loading slots...</p>";
          const stationDocId = sUID; // Use UID as document ID
          const slotsRef = collection(db, "slots", stationDocId, "timeSlots");
          const slotSnap = await getDocs(slotsRef);
          slotContainer.innerHTML = "";

          slotSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const slotDiv = document.createElement("div");
            slotDiv.className = "slot-item";
            const currentUser = auth.currentUser;
            const isBookedByUser = data.bookedBy === currentUser.uid;
            const isAvailable = data.status === "Available";

            slotDiv.innerHTML = `
              <p>${data.time}</p>
              <button data-id="${docSnap.id}" ${!isAvailable && !isBookedByUser ? "disabled" : ""}>
                ${isAvailable ? "Book Now" : isBookedByUser ? "Cancel Booking" : "Booked"}
              </button>
            `;

            // Booking / Cancel logic
            slotDiv.querySelector("button").addEventListener("click", async (e) => {
              const slotId = e.target.dataset.id;
              try {
                if (isBookedByUser) {
                  await updateDoc(doc(db, "slots", stationDocId, "timeSlots", slotId), {
                    status: "Available",
                    bookedBy: "",
                  });
                  e.target.textContent = "Book Now";
                  logger.log(`Booking canceled: ${slotId}`);
                } else {
                  await updateDoc(doc(db, "slots", stationDocId, "timeSlots", slotId), {
                    status: "booked",
                    bookedBy: currentUser.uid,
                  });
                  e.target.textContent = "Cancel Booking";
                  logger.log(`Slot booked: ${slotId}`);
                }
                alert("Slot updated successfully!");
              } catch (err) {
                logger.error("Slot update failed.", err);
                alert("Slot update failed. Please try again.");
              }
            });

            slotContainer.appendChild(slotDiv);
          });
        });

        stationList.appendChild(div);
      });
    } catch (err) {
      logger.error("Failed to fetch EV stations.");
      alert("Could not load charging stations.");
    }
  },
  (error) => {
    logger.error("Location access denied.");
    alert("Please allow location access to view nearby stations.");
  }
);

// Auth state monitoring
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      document.getElementById("navbar-username").textContent = userData.name;
      logger.log(`User logged in: ${uid}`);
    } else {
      logger.warn("User document not found.");
    }
  } else {
    logger.warn("User not authenticated.");
    window.location.href = "auth.html";
  }
});

// Info close button
document.getElementById("close-info").addEventListener("click", () => {
  document.getElementById("station-info").classList.add("hidden");
  logger.log("Closed station info panel.");
});

// Toggle logout popup
document.getElementById("navbar-username").addEventListener("click", () => {
  document.querySelector(".logout-popup").classList.toggle("slide");
  logger.log("Toggled logout popup.");
});

// Logout
document.querySelector(".logout-btn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    logger.log("User logged out.");
    window.location.href = "auth.html";
  } catch (error) {
    logger.error("Logout failed.");
    alert("Logout failed. Please try again.");
  }
});
