import { WebSocketServer } from 'ws';

// Configuración
const PORT = 3000;
const HEARTBEAT_INTERVAL = 30000; // 30 segundos

// Creamos el servidor
const wss = new WebSocketServer({ port: PORT });

console.log(`🌉 Puente Artisan-TraceBlend robusto corriendo en puerto ${PORT}`);

// Función para detectar clientes muertos
function heartbeat() {
  this.isAlive = true;
}

// Intervalo para limpiar conexiones muertas
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      console.log('⚠️ Cliente inactivo desconectado por timeout');
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('connection', (ws) => {
  console.log('✅ Cliente conectado (Artisan o Web)');

  // Inicializar estado de vida
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('error', (err) => {
    console.error('❌ Error en conexión WebSocket:', err.message);
  });

  ws.on('close', () => {
    console.log('🔌 Cliente desconectado');
  });

  ws.on('message', (message) => {
    try {
      // Cuando llega un mensaje (de Artisan)...
      const data = message.toString();

      // ...lo retransmitimos a TODOS los conectados (Tu Web)
      // excepto al que lo envió (echo cancelation)
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === 1) { // 1 = OPEN
          client.send(data);
        }
      });
    } catch (e) {
      console.error('Error procesando mensaje:', e);
    }
  });
});

wss.on('close', () => {
  clearInterval(interval);
});