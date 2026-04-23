let map, marker;

function isValidIP(ip) {
  return /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(ip);
}

async function checkIP(ipParam) {
  const ip = ipParam || document.getElementById("ipInput").value;
  const resultDiv = document.getElementById("result");
  const loader = document.getElementById("loader");

  if (!isValidIP(ip)) {
    alert("Invalid IP address");
    return;
  }

  loader.classList.remove("hidden");
  resultDiv.style.display = "none";

  try {
    // ✅ FIXED FREE HTTPS API (NO BLOCKING)
    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();

    if (!data.success) {
      throw new Error("Invalid IP");
    }

    const lat = data.latitude;
    const lon = data.longitude;
    const isp = data.connection?.isp || "Unknown";

    // 🔥 SIMPLE RISK ENGINE (your feature stays)
    let riskClass = "low";
    let riskText = "Low Risk";

    if (data.security?.proxy || data.security?.vpn) {
      riskClass = "high";
      riskText = "High Risk (VPN/Proxy detected)";
    } else if (isp.toLowerCase().includes("cloud")) {
      riskClass = "medium";
      riskText = "Medium Risk (Cloud provider)";
    }

    resultDiv.innerHTML = `
      <h3>${ip}</h3>
      <p><b>Location:</b> ${data.city}, ${data.country}</p>
      <p><b>ISP:</b> ${isp}</p>
      <p class="${riskClass}"><b>${riskText}</b></p>
    `;

    resultDiv.style.display = "block";
    loader.classList.add("hidden");

    // 🌍 MAP (FIXED)
    if (!map) {
      map = L.map('map').setView([lat, lon], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: "© OpenStreetMap"
      }).addTo(map);
    } else {
      map.setView([lat, lon], 6);
    }

    if (marker) marker.remove();
    marker = L.marker([lat, lon]).addTo(map)
      .bindPopup(`${ip}<br>${data.city}, ${data.country}`)
      .openPopup();

    saveHistory(ip);

  } catch (err) {
    loader.classList.add("hidden");
    console.error(err);
    alert("Error fetching data (API failed or invalid IP)");
  }
}

// 📜 HISTORY (UNCHANGED BUT CLEAN)
function saveHistory(ip) {
  let history = JSON.parse(localStorage.getItem("ipHistory")) || [];

  if (!history.includes(ip)) {
    history.unshift(ip);
    history = history.slice(0, 5);
    localStorage.setItem("ipHistory", JSON.stringify(history));
  }

  displayHistory();
}

function displayHistory() {
  const list = document.getElementById("historyList");
  const history = JSON.parse(localStorage.getItem("ipHistory")) || [];

  list.innerHTML = "";
  history.forEach(ip => {
    const li = document.createElement("li");
    li.textContent = ip;
    li.onclick = () => checkIP(ip);
    list.appendChild(li);
  });
}

displayHistory();
