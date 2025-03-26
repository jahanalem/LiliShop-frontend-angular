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

      const url: string = data.url;
      const type: string = data.type;

      this.isLoading.set(false);
      try {
        if (type === 'pdf') {
          this.downloadFile(url, 'printess-output.pdf');
          alert('Your PDF is ready!');
        }
        else if (type === 'image') {
          this.downloadFile(url, 'printess-output.png');
          alert('Your image is ready!');
        }
        else if (type === 'zip') {
          this.downloadFile(url, 'printess-images.zip');
          alert('Your image ZIP is ready!');
        }
        else {
          alert(`Unknown file type or empty result! ${data.type, url}`);
        }
      } catch (err) {
        console.error('SignalR file download failed:', err);
        alert('Download failed!');
      }
    });
  }

  private downloadFile(url: string, fileName: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  listenForJobCompletion() {
    this.hubConnection.on('JobCompleted', (jobId, isSuccess, fileUrl, error) => {
      console.log('JobCompleted Event:', { jobId, isSuccess, fileUrl, error });

      if (isSuccess) {
        window.open(fileUrl, '_blank');
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
