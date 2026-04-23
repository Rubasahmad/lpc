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

  const API_KEY = "YOUR_ABUSEIPDB_API_KEY";

  try {
    const [abuseRes, locRes] = await Promise.all([
      fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
        headers: { Key: API_KEY, Accept: "application/json" }
      }),
      fetch(`http://ip-api.com/json/${ip}`)
    ]);

    const abuseData = await abuseRes.json();
    const locData = await locRes.json();

    const score = abuseData.data.abuseConfidenceScore;

    let riskClass = "low";
    let riskText = "Low Risk";

    if (score > 70) { riskClass = "high"; riskText = "High Risk"; }
    else if (score > 30) { riskClass = "medium"; riskText = "Medium Risk"; }

    resultDiv.innerHTML = `
      <h3>${ip}</h3>
      <p><b>Location:</b> ${locData.city}, ${locData.country}</p>
      <p><b>ISP:</b> ${abuseData.data.isp}</p>
      <p><b>Reports:</b> ${abuseData.data.totalReports}</p>
      <p><b>Score:</b> ${score}</p>
      <p class="${riskClass}"><b>${riskText}</b></p>
    `;

    resultDiv.style.display = "block";
    loader.classList.add("hidden");

    // MAP
    if (!map) {
      map = L.map('map').setView([locData.lat, locData.lon], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    } else {
      map.setView([locData.lat, locData.lon], 6);
    }

    if (marker) marker.remove();
    marker = L.marker([locData.lat, locData.lon]).addTo(map);

    saveHistory(ip);

  } catch (err) {
    loader.classList.add("hidden");
    alert("Error fetching data");
  }
}

// HISTORY
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