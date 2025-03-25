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

    this.hubConnection.on('PdfReady', (data) => {
      console.log('PDF is ready!', data);

      this.isLoading.set(false);

      const a = document.createElement('a');
      a.href = data.pdfUrl;
      a.download = 'printess-output.pdf';
      a.click();

      alert('Your PDF is ready!');
    });
  }

  listenForJobCompletion() {
    this.hubConnection.on('JobCompleted', (jobId, isSuccess, pdfUrl, error) => {
      console.log('JobCompleted Event:', { jobId, isSuccess, pdfUrl, error });

      if (isSuccess) {
        window.open(pdfUrl, '_blank');
      } else {
        alert(`Error: ${error}`);
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
