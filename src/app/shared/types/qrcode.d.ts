// Minimal ambient typing for the 'qrcode' package. We deliberately avoid @types/qrcode because it pulls in
// @types/node, whose global declarations (e.g. AbortSignal) conflict with the DOM lib in this project.
declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    [key: string]: unknown;
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
}
