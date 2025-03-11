// src/polyfills.server.ts

// Nur ausführen, wenn ErrorEvent nicht definiert ist
if (typeof ErrorEvent === 'undefined') {
  class NodeErrorEvent extends Error {
    error: any;
    constructor(message?: string, error?: any) {
      super(message);
      this.name = 'ErrorEvent';
      this.error = error;
    }
  }

  // Dem globalen Namespace hinzufügen
  (global as any).ErrorEvent = NodeErrorEvent;
}
