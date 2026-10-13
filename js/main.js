import { App } from './core/App.js';
const app = new App(document.getElementById('scene'), document.getElementById('ui'));
app.init().catch((e) => { console.error(e); const l = document.querySelector('.loader-text'); if (l) l.textContent = 'Error: ' + e.message; });
window.__app = app;
