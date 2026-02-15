const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

let state = {
  o2: 20.9, co: 0, h2s: 0, lel: 0,
  th: { o2_low: 19.5, o2_high: 23.5, co_high: 50, h2s_high: 10, lel_high: 10 },
  updatedAt: Date.now(),
};

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
}

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "state", state }));
  ws.on("message", (buf) => {
    try {
      const data = JSON.parse(buf.toString());
      if (data.type === "set") {
        Object.assign(state, data.payload || {});
        state.updatedAt = Date.now();
        broadcast({ type: "state", state });
      }
      if (data.type === "setThresholds") {
        state.th = { ...state.th, ...(data.payload || {}) };
        state.updatedAt = Date.now();
        broadcast({ type: "state", state });
      }
      if (data.type === "pulse") broadcast({ type: "pulse", kind: "alarm" });
    } catch {}
  });
});

const PORT = 8080;
server.listen(PORT, "0.0.0.0", () => console.log(`OK: http://127.0.0.1:${PORT}`));
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => console.log(`OK: ${PORT}`));