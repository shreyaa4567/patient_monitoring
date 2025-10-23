const broker = "wss://broker.hivemq.com:8884/mqtt";
const topic = "ecg/data";
let client, isConnected = false;

const statusEl = document.getElementById("status");
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const bpmValueEl = document.getElementById("bpmValue");
const lastValueEl = document.getElementById("lastValue");

const ctx = document.getElementById("ecgChart").getContext("2d");
const data = { labels: [], datasets: [{ label: "ECG", borderColor: "#b71c1c", borderWidth: 2, data: [], fill: false, tension: 0.1 }] };
const ecgChart = new Chart(ctx, { type: "line", data, options: { animation: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { min: 0, max: 1023 } } } });

let peakTimes = [], lastPeakTime = 0;

function estimateBPM(value) {
  const threshold = 600;
  const now = Date.now();
  if (value > threshold && now - lastPeakTime > 400) {
    peakTimes.push(now);
    lastPeakTime = now;
    peakTimes = peakTimes.filter(t => now - t < 10000);
    const bpm = Math.round((peakTimes.length * 60) / 10);
    bpmValueEl.innerText = bpm;
  }
}

connectBtn.addEventListener("click", () => {
  client = mqtt.connect(broker);
  statusEl.innerText = "Connecting...";
  client.on("connect", () => {
    isConnected = true;
    statusEl.innerText = "✅ Connected to HiveMQ";
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    client.subscribe(topic);
  });
  client.on("message", (t, message) => {
    const value = parseInt(message.toString());
    lastValueEl.innerText = value;
    estimateBPM(value);
    if (data.labels.length > 100) {
      data.labels.shift(); data.datasets[0].data.shift();
    }
    data.labels.push(""); data.datasets[0].data.push(value);
    ecgChart.update();
  });
  client.on("error", () => statusEl.innerText = "❌ Connection error");
});

disconnectBtn.addEventListener("click", () => {
  if (client && isConnected) {
    client.end();
    isConnected = false;
    statusEl.innerText = "Disconnected ❌";
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  }
});
