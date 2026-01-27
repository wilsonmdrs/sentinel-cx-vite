# @sentinel/cx-vite

Sentinel integration package for **Vite + React + Coralogix**.

This package provides:
- Runtime error capture via Coralogix RUM
- React helpers (`ErrorBoundary`, `withErrorBoundary`, `useSentinel`)
- A Vite plugin to upload sourcemaps at build time (Sentry-like stack traces)

## Install

```bash
npm i @sentinel/cx-vite
```

## Runtime setup (Vite + React)

```ts
// src/main.tsx
import { initSentinel, ErrorBoundary } from "@sentinel/cx-vite";

initSentinel({
  publicKey: import.meta.env.VITE_CX_RUM_PUBLIC_KEY,
  domain: import.meta.env.VITE_CX_DOMAIN, // "EU1" | "EU2" | ...
  app: import.meta.env.VITE_APP_NAME,
  env: import.meta.env.VITE_ENV_NAME,        // dev|qa|prod
  version: import.meta.env.VITE_APP_VERSION, // MUST match sourcemap upload version
  tags: { service: "web" }
});

// ...
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Handled errors:

```ts
import { captureException } from "@sentinel/cx-vite";

try {
  await submit();
} catch (e) {
  captureException(e, { extra: { feature: "checkout" } });
}
```

## Vite sourcemaps plugin

Enable hidden sourcemaps:

```ts
// vite.config.ts
build: { sourcemap: "hidden" }
```

Add the plugin:

```ts
import { coralogixSourcemapsPlugin } from "@sentinel/cx-vite/vite";

export default defineConfig({
  plugins: [
    coralogixSourcemapsPlugin({
      remember: true,
      enabled: process.env.CX_SOURCEMAPS === "true",
      privateKey: process.env.CX_PRIVATE_KEY,
      app: process.env.CX_APP,
      env: process.env.CX_ENV,
      version: process.env.VITE_APP_VERSION,
      folder: "dist/assets"
    })
  ]
});
```

Run a build with upload enabled:

```bash
export CX_SOURCEMAPS=true
export CX_PRIVATE_KEY="..."
export CX_APP="my-web"
export CX_ENV="prod"
export VITE_APP_VERSION="1.2.3+local"

npm run build
```

> Important: `version` passed to `initSentinel()` must match the uploaded sourcemap version.
