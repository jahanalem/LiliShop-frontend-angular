import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PrintessSignalRService {
  private hubConnection: signalR.HubConnection;
  baseUrl = environment.apiUrl;

  isLoading = signal<boolean>(false);

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.baseUrl}printessHub`)
      .withAutomaticReconnect()
      .build();
  }

  startConnection() {
    this.hubConnection.start()
      .then(() => console.log('SignalR Connected!'))
      .catch(err => console.error('SignalR Connection Error:', err));

    this.hubConnection.on('PrintessOutputReady', (data) => {
      console.log('Received from SignalR:', data);
      this.isLoading.set(false);

      const base64      = data.file;
      const fileName    = data.fileName;
      const contentType = data.contentType;
      const type        = data.type;

      if (!base64 || !fileName || !contentType) {
        alert('Missing file data from server.');
        return;
      }

      try {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const blob      = new Blob([byteArray], { type: contentType });
        const url       = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        // Show success message
        const icons: any = { pdf: '📄', image: '🖼️', zip: '🗂️' };
        alert(`${icons[type] ?? '✅'} Your ${type.toUpperCase()} is ready!`);
      } catch (err) {
        console.error('Error decoding file:', err);
        alert('File download failed!');
      }
    });
  }

  stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => {
        console.log('SignalR Disconnected!');
      });
    }
  }

  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }
}
