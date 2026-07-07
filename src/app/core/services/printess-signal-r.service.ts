import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class PrintessSignalRService {
  private hubConnection: signalR.HubConnection;
  private outputHandlerRegistered = false;
  private currentJobId: string | null = null;
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

    this.registerOutputHandler();
  }

  /** Ensures the hub connection is established before invoking server methods. */
  async ensureConnected(): Promise<void> {
    this.registerOutputHandler();
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }
    if (this.hubConnection.state === signalR.HubConnectionState.Disconnected) {
      await this.hubConnection.start();
      return;
    }
    // Connecting / Reconnecting — wait until it settles into Connected.
    await new Promise<void>((resolve, reject) => {
      const started = Date.now();
      const poll = () => {
        if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
          resolve();
        } else if (Date.now() - started > 10000) {
          reject(new Error('Timed out waiting for SignalR connection.'));
        } else {
          setTimeout(poll, 100);
        }
      };
      poll();
    });
  }

  /**
   * Subscribes this client to the isolated group for a specific render job. Output for that job is only
   * pushed to members of the group, so one customer's document is never broadcast to every connected client.
   */
  async joinJobGroup(jobId: string): Promise<void> {
    if (!jobId) {
      return;
    }
    await this.ensureConnected();
    await this.hubConnection.invoke('JoinJobGroup', jobId);
    this.currentJobId = jobId;
  }

  /** Leaves a job group (defaults to the current one) to avoid stale subscriptions / leaks. */
  async leaveJobGroup(jobId?: string): Promise<void> {
    const id = jobId ?? this.currentJobId;
    if (!id) {
      return;
    }
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('LeaveJobGroup', id);
      } catch (err) {
        console.error('Failed to leave job group', err);
      }
    }
    if (id === this.currentJobId) {
      this.currentJobId = null;
    }
  }

  private registerOutputHandler(): void {
    if (this.outputHandlerRegistered) {
      return;
    }
    this.outputHandlerRegistered = true;

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
      } finally {
        // The job is complete; leave its isolated group so we don't hold a stale subscription.
        this.leaveJobGroup(data.jobId);
      }
    });
  }

  stopConnection() {
    this.leaveJobGroup();
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
