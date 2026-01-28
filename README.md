# @sentineljs/cx-vite

Sentinel is a lightweight observability integration for **Vite + React** applications using **Coralogix RUM**.

It provides:

- Runtime error capture (browser)
- React Error Boundary helpers
- First-class support for **React 19 error hooks**
- A Vite plugin to upload **hidden sourcemaps** for Sentry-like stack traces
- Zero CI dependency (works locally or in CI)

---

## Installation

```bash
npm install @sentineljs/cx-vite
```

---

## Environment variables

### Frontend (public)

```bash
VITE_CX_RUM_PUBLIC_KEY=xxxx
VITE_CX_DOMAIN=EU2
VITE_APP_NAME=my-web-app
VITE_ENV_NAME=prod
VITE_APP_VERSION=1.2.3
```

### Build-time only (private)

```bash
CX_PRIVATE_KEY=yyyy
CX_APP=my-web-app
CX_ENV=prod
```

---

## Runtime setup (React + Vite)

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  initSentinel,
  captureException,
  ErrorBoundary,
} from "@sentineljs/cx-vite";

initSentinel({
  publicKey: import.meta.env.VITE_CX_RUM_PUBLIC_KEY,
  domain: import.meta.env.VITE_CX_DOMAIN,
  app: import.meta.env.VITE_APP_NAME,
  env: import.meta.env.VITE_ENV_NAME,
  version: import.meta.env.VITE_APP_VERSION,
});

const root = ReactDOM.createRoot(document.getElementById("root")!, {
  onUncaughtError(error, info) {
    captureException(error, {
      extra: {
        type: "react.onUncaughtError",
        componentStack: info.componentStack,
      },
    });
  },
  onRecoverableError(error, info) {
    captureException(error, {
      extra: {
        type: "react.onRecoverableError",
        componentStack: info.componentStack,
      },
    });
  },
});

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
```

---

## Capturing handled errors

```ts
import { captureException } from "@sentineljs/cx-vite";

try {
  await submitOrder();
} catch (e) {
  captureException(e, { extra: { feature: "checkout" } });
}
```

---

## Vite sourcemaps integration

```ts
import { coralogixSourcemapsPlugin } from "@sentineljs/cx-vite/vite";

export default {
  build: { sourcemap: "hidden" },
  plugins: [
    coralogixSourcemapsPlugin({
      enabled: true,
      privateKey: process.env.CX_PRIVATE_KEY,
      app: process.env.CX_APP,
      env: process.env.CX_ENV,
      version: process.env.VITE_APP_VERSION,
      folder: "dist/assets",
    }),
  ],
};
```

---

## License

MIT
