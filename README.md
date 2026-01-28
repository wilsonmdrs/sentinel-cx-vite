# @sentineljs/cx-vite

Sentinel is a focused observability integration for **Vite + React** apps using **Coralogix RUM**.

It provides:

- **Runtime** error reporting via Coralogix Browser SDK
- **React utilities** (ErrorBoundary, HOC, hook) for consistent capture patterns
- **React 19 root callbacks** integration (uncaught + recoverable errors)
- A **Vite plugin** to upload **hidden sourcemaps** (Sentry-like stack traces)
- Works without CI access (can run on any build machine)

> `@coralogix/browser` is installed automatically as a dependency.

---

## Installation

```bash
npm install @sentineljs/cx-vite
```

---

## Quick start (recommended setup)

### 1) Environment variables

**Frontend (public)**

```bash
VITE_CX_RUM_PUBLIC_KEY=xxxx
VITE_CX_DOMAIN=EU2
VITE_APP_NAME=my-web-app
VITE_ENV_NAME=prod
VITE_APP_VERSION=1.2.3
```

**Build-time only (private)**

```bash
CX_PRIVATE_KEY=yyyy
CX_APP=my-web-app
CX_ENV=prod
CX_SOURCEMAPS=true
```

**Rules**

- Anything prefixed with `VITE_` becomes **public** in the browser bundle.
- Never expose `CX_PRIVATE_KEY` to the browser.

---

### 2) Initialize Sentinel once (app entry)

In `src/main.tsx` (or equivalent):

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
  tags: { service: "web" },
});

const root = ReactDOM.createRoot(document.getElementById("root")!, {
  // React 19+ (recommended): capture crashes not caught by ErrorBoundaries
  onUncaughtError(error, info) {
    captureException(error, {
      extra: {
        type: "react.onUncaughtError",
        componentStack: info.componentStack,
      },
    });
  },

  // React 19+ (recommended): capture errors React can recover from
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
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
```

Why this setup?

- `ErrorBoundary` handles **caught render** errors.
- `onUncaughtError` + `onRecoverableError` capture **uncaught** and **recoverable** errors.
- We intentionally do **not** use `onCaughtError` to avoid duplicate reporting.

---

## API Reference

### `initSentinel(config)`

Initialize the Coralogix RUM SDK exactly once. Subsequent calls are ignored.

```ts
import { initSentinel } from "@sentineljs/cx-vite";

initSentinel({
  publicKey: "â€¦",
  domain: "EU2",
  app: "my-web-app",
  env: "prod",
  version: "1.2.3",
  tags: { team: "frontend" },
});
```

**Config**

- `publicKey` _(string, required)_: Coralogix **RUM public key** (safe in browser).
- `domain` _(string, required)_: Coralogix domain/region (e.g., `"EU1"`, `"EU2"`, `"US1"`).
- `app` _(string, required)_: Application name shown in Coralogix.
- `env` _(string, required)_: Environment name (e.g., `dev`, `qa`, `prod`).
- `version` _(string, required)_: Release identifier. **Must match sourcemap upload version.**
- `tags` _(Record<string, string>, optional)_: Stable key/value tags.

---

### `captureException(error, options?)`

Capture **handled** errors (errors you catch and do not allow to crash the app).

```ts
import { captureException } from "@sentineljs/cx-vite";

try {
  await submitOrder();
} catch (e) {
  captureException(e, {
    extra: { feature: "checkout", step: "submit" },
  });
}
```

**When to call it**

- Network failures you handle
- Unexpected exceptions you recover from
- âœ… Business-critical failures that impact UX

**When _not_ to call it**

- Normal validation errors (expected)
- Control-flow exceptions used intentionally

**Options**

- `extra?: Record<string, unknown>`: Attach extra metadata for debugging (non-sensitive).

---

### `setUser(user?)`

Attach user context after authentication.

```ts
import { setUser } from "@sentineljs/cx-vite";

setUser({
  id: "123",
  email: "user@company.com",
  name: "Jane Doe",
});
```

Call `setUser(undefined)` on logout to clear identity context if your app requires it.

---

## React utilities

### `<ErrorBoundary />`

Use to capture render/lifecycle errors and show a fallback UI.

```tsx
import { ErrorBoundary } from "@sentineljs/cx-vite";

<ErrorBoundary fallback={<div>Something went wrong.</div>}>
  <App />
</ErrorBoundary>;
```

**Props**

- `fallback?: ReactNode | (error: Error) => ReactNode`
- `onError?: (error: Error, info: React.ErrorInfo) => void`
- `extra?: Record<string, unknown>` (adds metadata to the captured event)

Example with `fallback` as a function:

```tsx
<ErrorBoundary
  fallback={(err) => <div>Oops: {err.message}</div>}
  extra={{ area: "dashboard" }}
>
  <Dashboard />
</ErrorBoundary>
```

---

### `withErrorBoundary(Component, options?)`

HOC wrapper when you prefer composing boundaries around specific screens:

```tsx
import { withErrorBoundary } from "@sentineljs/cx-vite";

function SettingsPage() {
  return <div>Settings</div>;
}

export default withErrorBoundary(SettingsPage, {
  fallback: <div>Settings is unavailable.</div>,
  extra: { route: "/settings" },
});
```

---

### `useSentinel()`

A convenience hook that returns a stable object with Sentinel functions, useful inside components and custom hooks.

```tsx
import { useSentinel } from "@sentineljs/cx-vite";

export function CheckoutButton() {
  const { captureException } = useSentinel();

  const onClick = async () => {
    try {
      await submitOrder();
    } catch (e) {
      captureException(e, { extra: { feature: "checkout" } });
    }
  };

  return <button onClick={onClick}>Pay</button>;
}
```

**Notes**

- You should still call `initSentinel()` once at app startup.
- Use `useSentinel()` for `captureException()` and `setUser()` anywhere after bootstrap.

---

## Vite plugin: sourcemaps upload

### Why sourcemaps matter

Production bundles are minified, so stack traces point to `dist` files and offsets:

```
index-abc123.js:1:98765
```

Sourcemaps allow Coralogix to map that back to your real code:

```
src/pages/Checkout.tsx:88
```

### Recommended Vite config (hidden sourcemaps)

```ts
// vite.config.ts
export default {
  build: { sourcemap: "hidden" },
};
```

### Add the Sentinel sourcemaps plugin

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { coralogixSourcemapsPlugin } from "@sentineljs/cx-vite/vite";

export default defineConfig({
  plugins: [
    react(),
    coralogixSourcemapsPlugin({
      enabled: process.env.CX_SOURCEMAPS === "true",
      privateKey: process.env.CX_PRIVATE_KEY,
      app: process.env.CX_APP,
      env: process.env.CX_ENV,
      version: process.env.VITE_APP_VERSION,
      folder: "dist/assets",
    }),
  ],
  build: { sourcemap: "hidden" },
});
```

### Run build with upload enabled

```bash
CX_SOURCEMAPS=true CX_PRIVATE_KEY="..." CX_APP="my-web-app" CX_ENV="prod" VITE_APP_VERSION="1.2.3" npm run build
```

> **Critical:** `version` passed to `initSentinel()` must exactly match the upload `version`.

---

## Best practices

### Use a stable `version`

Common strategies:

- Git tag (e.g. `1.2.3`)
- Git SHA (e.g. `c0ffee42`)
- Semver + build metadata (e.g. `1.2.3+sha.c0ffee42`)

Just keep it consistent between runtime and upload.

### Keep tags stable

Tags should not be high-cardinality (avoid user IDs, request IDs, etc.). Use `extra` for contextual debugging data.

### Capture handled errors intentionally

Donâ€™t spam your backend with expected failures. Capture what actually matters.

---

## Troubleshooting

### Sourcemaps uploaded but stack traces still minified

Most common causes:

- `version` mismatch between runtime and upload
- uploading the wrong folder (ensure your `.map` files are in `dist/assets`)
- sourcemaps not generated (`build.sourcemap` must be enabled)

### I don't see any errors in Coralogix

Check:

- public key and domain
- network calls not blocked by ad blockers / CSP
- `initSentinel()` called before errors occur

---

## Supported versions

- React: `>= 17` (React 19 supported)
- Vite: `>= 4`
- Node: `>= 18`
- Coralogix Browser SDK: `>= 3.0.0`
- Coralogix RUM CLI: `>= 1.1.0`

---

## License

MIT
