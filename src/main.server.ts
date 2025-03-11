import 'zone.js/node';
import './polyfills.server';
import { environment } from './environments/environment';
export { AppServerModule as default } from './app/app.module.server';

console.log('API URL:', environment.apiUrl);
