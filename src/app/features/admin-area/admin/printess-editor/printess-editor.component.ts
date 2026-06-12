
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PrintessSignalRService } from 'src/app/core/services/printess-signal-r.service';
import { environment } from 'src/environments/environment';

interface TemplateDto {
  name        : string;
  thumbnailUrl: string;
}

const PRINTESS_EDITOR_ORIGIN = 'https://editor.printess.com';
const PRINTESS_EMBED_URL     = `${PRINTESS_EDITOR_ORIGIN}/printess-editor/embed.html`;

@Component({
  selector: 'app-printess-editor',
  templateUrl: './printess-editor.component.html',
  styleUrl: './printess-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatFormFieldModule, MatSelectModule, MatButtonToggleModule, MatButtonModule, MatIconModule]
})
export class PrintessEditorComponent implements OnInit, OnDestroy {
  // The Printess shop token is a credential and must never be hardcoded in
  // the bundle; it is fetched from the backend, which holds the real secret.
  shopToken        = signal<string | null>(null);
  baseUrl          = environment.apiUrl;
  iframeId         = 'printess';
  isPollingLoading = signal<boolean>(false);
  saveToken        = signal<string | null>(null);
  useCallback      = signal<boolean>(false);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                // Default to polling
  templates        = signal<TemplateDto[]>([]);
  templateName     = signal<string>('');
  outputType       = signal<'pdf' | 'image'>('pdf');

  private iframeMessageListener: ((event: MessageEvent) => void) | null = null;

  printessSignalR = inject(PrintessSignalRService);
  http            = inject(HttpClient);

  constructor() { }

  ngOnInit(): void {
    this.loadShopToken();
    this.loadTemplateList();
    if (!this.printessSignalR.isConnected()) {
      this.printessSignalR.startConnection();
    }
  }
  ngOnDestroy(): void {
    this.printessSignalR.stopConnection();
    if (this.iframeMessageListener) {
      window.removeEventListener('message', this.iframeMessageListener);
      this.iframeMessageListener = null;
    }
  }

  private loadShopToken(): void {
    this.http.get<{ token: string }>(`${this.baseUrl}printessEditor/shop-token`)
      .subscribe({
        next: (data) => {
          this.shopToken.set(data.token);
          this.loadPrintess();
        },
        error: (err) => {
          console.error('Failed to load the Printess shop token from the backend.', err);
        }
      });
  }

  ngAfterViewInit(): void {
    this.loadPrintess();
  }

  get isCallbackLoading() {
    return this.printessSignalR.isLoading();
  }

  loadTemplateList(): void {
    this.http.get<TemplateDto[]>(`${this.baseUrl}printessEditor/templates`)
      .subscribe({
        next: (data) => {
          this.templates.set(data);
          if (data.length > 0) {
            this.templateName.set(data[0].name);
            this.reloadEditor();
          }
        },
        error: (err) => {
          console.error('Failed to load templates', err);
        }
      });
  }

  onTemplateChange(name: string): void {
    this.templateName.set(name);
    this.useCallback.update(() => false);
    this.saveToken.update(() => null);
    this.loadPrintess();
  }

  reloadEditor(): void {
    const iframe = document.getElementById(this.iframeId) as HTMLIFrameElement;
    if (!iframe) {
      return;
    }
    this.attachEditor(iframe);
  }

  /**
   * Points the iframe at the Printess editor and sends the attach command once
   * it has loaded. The token is only ever posted to the Printess origin —
   * never "*" — so it cannot leak if the iframe gets navigated elsewhere.
   */
  private attachEditor(iframe: HTMLIFrameElement): void {
    const token = this.shopToken();
    if (!token) {
      return;
    }

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({
        cmd: "attach",
        properties: {
          templateName   : this.templateName(),
          templateVersion: "draft",
          token
        }
      }, PRINTESS_EDITOR_ORIGIN);
    };

    iframe.src = PRINTESS_EMBED_URL;
  }

  isButtonDisabled(): boolean {
    return this.useCallback()
      ? this.isCallbackLoading || !this.saveToken()
      : this.isPollingLoading();
  }

  loadPrintess(): void {
    const iframe = document.getElementById(this.iframeId) as HTMLIFrameElement;

    if (!iframe) {
      return;
    }

    if (!this.iframeMessageListener) {
      // Only accept messages that actually come from the Printess editor;
      // any page in any tab can post to this window otherwise.
      this.iframeMessageListener = (event: MessageEvent) => {
        if (event.origin !== PRINTESS_EDITOR_ORIGIN) {
          return;
        }
        switch (event.data?.cmd) {
          case "back":
            alert("Back to the catalog.");
            break;
          case "basket":
            this.saveToken.set(event.data.token);
            break;
        }
      };
      window.addEventListener("message", this.iframeMessageListener);
    }

    this.attachEditor(iframe);

    // Optional: forward viewport info to iframe https://www.printess.com/kb.html#api-reference/iframe-ui.html:forwarding-the-visual-viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener("scroll", () => {
        iframe.contentWindow?.postMessage({
          cmd      : "viewportScroll",
          height   : window.visualViewport?.height,
          offsetTop: window.visualViewport?.offsetTop
        }, PRINTESS_EDITOR_ORIGIN);
      });
    }
  }

  downloadDocument(): void {
    this.isPollingLoading.set(true);

    const requestPayload = {
      templateName: this.templateName(),
      saveToken   : this.saveToken(),
      outputFormat: this.outputType()
    };

    this.http.post(`${this.baseUrl}printessEditor/render-document`, requestPayload, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe(resp => {
      const contentType = resp.headers.get('content-type') ?? '';
      console.log('Content-Type:', contentType);

      // Detect file type
      const isPdf   = contentType.includes('application/pdf');
      const isImage = contentType.startsWith('image/');
      const isZip   = contentType === 'application/zip';

      if (resp.status === 200 && (isPdf || isImage || isZip)) {
        console.log('File download was triggered successfully by backend.');
      } else {
        alert('No valid file received from backend.');
      }

      this.isPollingLoading.set(false);
    }, err => {
      console.error('Error:', err);
      alert('Download failed: ' + err.message);
      this.isPollingLoading.set(false);
    });
  }

  startCallbackJob(): void {
    if (!this.templateName()) {
      alert('Please choose a template!');
      return;
    }

    if (!this.saveToken()) {
      alert('Your design is not saved. Please click the "Add to Basket" button in the editor!');
      return;
    }

    this.printessSignalR.isLoading.set(true);

    const requestPayload = {
      templateName: this.templateName(),
      saveToken   : this.saveToken(),
      outputFormat: this.outputType()     // can be 'pdf' or 'png'
    };

    this.http.post(`${this.baseUrl}printessEditor/start-callback-job`, requestPayload).subscribe({
      next: () => {
        // SignalR will handle loading indicator reset once the job is completed
      },
      error: (err) => {
        this.printessSignalR.isLoading.set(false);
        alert('Failed to start job: ' + err.message);
      }
    });
  }
}
