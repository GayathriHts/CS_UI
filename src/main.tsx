import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Globally disable browser autocomplete/autofill on all input, textarea, select, and form elements.
// Chrome ignores autocomplete="off" for fields it detects as address/name/city/email,
// so we use a unique random string value that the browser cannot match to any known autofill token.
(() => {
  let counter = 0;
  const disableAutofill = (el: Element) => {
    if (el instanceof HTMLFormElement) {
      el.setAttribute('autocomplete', 'off');
    } else if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement
    ) {
      // A unique random value per element that Chrome/Edge/Safari won't recognize as an autofill hint
      el.setAttribute('autocomplete', `nofill-${++counter}`);
      // Block common password manager autofill
      el.setAttribute('data-lpignore', 'true');
      el.setAttribute('data-form-type', 'other');
    }
  };

  const processElement = (el: Element) => {
    disableAutofill(el);
    el.querySelectorAll('input, textarea, select, form').forEach(disableAutofill);
  };

  // Apply to any elements already in the DOM
  document.querySelectorAll('input, textarea, select, form').forEach(disableAutofill);

  // Watch for dynamically added elements (React renders)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof Element) {
          processElement(node);
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
})();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
