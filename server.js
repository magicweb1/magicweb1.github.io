const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve HTML dari folder 'public'
app.use(express.static('public'));

// Endpoint GET /status untuk fallback
app.get('/status', (req, res) => {
  res.json({ online: true, cpu: serverStatus.cpu, memory: serverStatus.memory, uptime: serverStatus.uptime });
});

// Endpoint POST /status untuk support POST request
app.use(express.json());
app.post('/status', (req, res) => {
  res.json({ online: true, cpu: serverStatus.cpu, memory: serverStatus.memory, uptime: serverStatus.uptime });
});

let clients = [];
let serverStatus = { online: true, cpu: 0, memory: 0, uptime: 0 };

// Update status setiap 1 detik (cepat & ringan)
setInterval(() => {
  serverStatus.cpu = Math.random() * 100;
  serverStatus.memory = Math.random() * 80;
  serverStatus.uptime += 1;
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'statusUpdate', data: serverStatus }));
    }
  });
}, 1000);

wss.on('connection', (ws) => {
  clients.push(ws);
  ws.send(JSON.stringify({ type: 'welcome', data: serverStatus }));

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });
});

server.listen(8080, () => {
  console.log('Global Real-Time Gateway Live on ws://localhost:8080');
});