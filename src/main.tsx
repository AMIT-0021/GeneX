import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Mobile canvas roundRect polyfill for older iOS Safari & Android WebViews
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | number[]
  ) {
    let r = 8;
    if (typeof radii === 'number') {
      r = radii;
    } else if (Array.isArray(radii) && radii.length > 0) {
      r = radii[0];
    }
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

function mount() {
  try {
    const container = document.getElementById('root');
    if (container) {
      const root = createRoot(container);
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>
      );
    }
  } catch (err) {
    console.error('Fatal mount error:', err);
    const container = document.getElementById('root');
    if (container) {
      container.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;background:#FAFAF8;color:#0F172A;">
          <div style="max-width:360px;width:100%;background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:24px;text-align:center;box-shadow:0 10px 25px rgba(0,0,0,0.06);">
            <div style="font-weight:700;font-size:18px;color:#DC2626;margin-bottom:8px;">Initialization Notice</div>
            <p style="font-size:13px;color:#475569;margin-bottom:16px;line-height:1.5;">${String(err)}</p>
            <button onclick="localStorage.clear();sessionStorage.clear();window.location.reload(true)" style="background:#5C8A6B;color:#fff;border:none;border-radius:10px;padding:12px 20px;font-weight:600;font-size:14px;cursor:pointer;width:100%;">Clear Storage & Reload</button>
          </div>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}

// Register PWA Service Worker for offline capability
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA service worker registration failed:', err);
    });
  });
}
