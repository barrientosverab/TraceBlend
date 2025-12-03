import { WebSocketServer } from 'ws';

// Creamos el servidor en el puerto 3000 (el que busca tu App)
const wss = new WebSocketServer({ port: 3000 });

console.log("🌉 Puente Artisan-TraceBlend corriendo en puerto 3000");

wss.on('connection', (ws) => {
  console.log('✅ Cliente conectado (Artisan o Web)');

  ws.on('message', (message) => {
    // Cuando llega un mensaje (de Artisan)...
    const data = message.toString();
    // console.log('Recibido:', data); // Descomenta si quieres ver los datos brutos

    // ...lo retransmitimos a TODOS los conectados (Tu Web)
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(data);
      }
    });
  });
});