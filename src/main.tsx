import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { initCrazyGames } from './lib/crazyGames'
import { logClientError } from './lib/errorLogger'

// Init CrazyGames SDK as early as possible; game boots regardless of outcome
initCrazyGames().catch(() => {})

window.addEventListener('error', (e) => {
  if (!e.error) return;
  logClientError(e.error?.message ?? String(e.message), e.error?.stack ?? '', 'js');
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason?.message ?? String(e.reason ?? 'unhandled rejection');
  const stack = e.reason?.stack ?? '';
  logClientError(msg, stack, 'promise');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
