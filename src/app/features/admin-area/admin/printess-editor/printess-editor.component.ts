import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { PrintessSignalRService } from 'src/app/core/services/printess-signal-r.service';
import { environment } from 'src/environments/environment';

interface TemplateDto {
  name        : string;
  thumbnailUrl: string;
}

@Component({
  selector: 'app-printess-editor',
  templateUrl: './printess-editor.component.html',
  styleUrl: './printess-editor.component.scss',
  imports: [CommonModule, HttpClientModule]
})
export class PrintessEditorComponent implements OnInit, OnDestroy {
  shopToken        = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InByaW50ZXNzLXNhYXMtYWxwaGEiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJkYmJlYzIzY2Q3ODA0OWNhOTg4M2I0NWQ2MjdiOTcxMyIsImp0aSI6IkJVWHl0b09RMjlwSURzc0dkRnMxMTZqV0tWSzhib29WIiwicm9sZSI6InNob3AiLCJuYmYiOjE3NDI0MTM3NDcsImV4cCI6MjA1Nzc3Mzc0NywiaWF0IjoxNzQyNDEzNzQ3LCJpc3MiOiJQcmludGVzcyBHbWJIICYgQ28uS0ciLCJhdWQiOiJwcmludGVzcy1zYWFzIn0.YjGEt6U_FtrHHnsE_fvGv-Usf2fKdgVhIGl2VpHLvJT1UkmxOuH0DtxvF7z10M9eSc9MAASfVqwEipwrJJCqG3tYOp_1ALBUFsDavq0QivSvDc_2CGKam8TcTfJ9W46zQO9B5-TA2vLhaAOy4O5kV7i6h1afhWwqbo1pPtk_zzgfU0QegN-0NGYD3PEQsuC3JnR7wEeWMzTxjye3FXnsq-lOiCC8dJcOQSSOYo_x7egb9_W_N-4ea30bKgtuLCFx__FWTQeX9YkpXdiwvqXMy9oEGG_xnk_KY_DFBTiwh8exI22AJ-0Fq_zdNb0R_ui6Ss2uL1pyIqlwWH_bfMZAyJa3Kx3YDjj_k88htt19EsDTUQ56Y3UW38g3NGplKlerab_0A59gHBp12cSXFtTkRdJs85rruLgYuhF2a_0Zh5AiUL5iPjSEreWUbNutMJMcagDwiCy9KcAZLd_Wgx-u-70YryfBW6iruQYqi6Q6J3JCN3H7md1NwATLvYGH7EgvwgQhhjQ6kXn91XhDapLmmzlCOX44JHRahT1p3jfvUHY3JRu82Qa6zYU6-w3DQJqrHWpEdbKVpvSxKFUfpI3WgzNZWzIEozceiAv75tWHdaEK67BnA0vzwCO6otV_GHkG2vIPLS5vngGXiizjsI7u8ybHh7PIQvgvqDwzjXd5wGc';
  baseUrl          = environment.apiUrl;
  iframeId         = 'printess';
  isPollingLoading = signal<boolean>(false);
  saveToken        = signal<string | null>(null);
  useCallback      = signal<boolean>(false);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                // Default to polling
  templates        = signal<TemplateDto[]>([]);
  templateName     = signal<string>('');
  outputType       = signal<'pdf' | 'image'>('pdf');
  _iframeMessageListenerAttached = false;

  printessSignalR = inject(PrintessSignalRService);
  http            = inject(HttpClient);

  constructor() { }

  ngOnInit(): void {
    this.loadTemplateList();
    if (!this.printessSignalR.isConnected()) {
      this.printessSignalR.startConnection();
    }
  }
  ngOnDestroy(): void {
    this.printessSignalR.stopConnection();
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

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({
        cmd: "attach",
        properties: {
          templateName   : this.templateName(),
          templateVersion: "draft",
          token          : this.shopToken
        }
      }, "*");
    };

    iframe.src = "https://editor.printess.com/printess-editor/embed.html";
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

    if (!this._iframeMessageListenerAttached) {
      window.addEventListener("message", (event) => {
        switch (event.data.cmd) {
          case "back":
            alert("Back to the catalog. Save-Token: " + event.data.token);
            break;
          case "basket":
            console.log('Received saveToken:', event.data.token);
            this.saveToken.set(event.data.token);
            break;
        }
      });
      this._iframeMessageListenerAttached = true;
    }

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({
        cmd: "attach",
        properties: {
          templateName   : this.templateName(),
          templateVersion: "draft",
          token          : this.shopToken
        }
      }, "*");
    };

    iframe.src = "https://editor.printess.com/printess-editor/embed.html";

    // Optional: forward viewport info to iframe https://www.printess.com/kb.html#api-reference/iframe-ui.html:forwarding-the-visual-viewport
    if (window.visualViewport) {
      window.visualViewport.addEventListener("scroll", () => {
        iframe.contentWindow?.postMessage({
          cmd      : "viewportScroll",
          height   : window.visualViewport?.height,
          offsetTop: window.visualViewport?.offsetTop
        }, "*");
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
