/**
 * WebSocket Connection Manager for F.R.I.D.A.Y. Voice Engine
 */

class SocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectTimer = null;
    this.isConnected = false;
    this.url = 'ws://localhost:3001';
  }

  connect(url = 'ws://localhost:3001') {
    this.url = url;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS-Client] Connected to FRIDAY Voice Core');
        this.isConnected = true;
        this.emit('connection_change', true);

        // Heartbeat
        this.pingInterval = setInterval(() => {
          if (this.isConnected) {
            this.send({ type: 'PING' });
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.emit(payload.type, payload);
          this.emit('message', payload);
        } catch (e) {
          console.error('[WS-Client] Parse error:', e);
        }
      };

      this.ws.onclose = () => {
        console.warn('[WS-Client] Connection closed. Retrying in 3s...');
        this.isConnected = false;
        this.emit('connection_change', false);
        clearInterval(this.pingInterval);
        
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(this.url), 3000);
      };

      this.ws.onerror = (err) => {
        console.error('[WS-Client] Socket error:', err);
      };
    } catch (e) {
      console.error('[WS-Client] Initialization error:', e);
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WS-Client] Cannot send. Socket is not connected.');
    }
  }

  sendCommand(text, intent = null) {
    this.send({
      type: 'COMMAND',
      text,
      intent,
      timestamp: Date.now()
    });
  }

  sendBargeIn(reason = 'User interruption') {
    this.send({
      type: 'BARGE_IN',
      reason,
      timestamp: Date.now()
    });
  }

  updatePreferences(preferences) {
    this.send({
      type: 'SET_PREFERENCES',
      ...preferences
    });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, callbacks);
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(payload));
    }
  }
}

export const socketService = new SocketService();
