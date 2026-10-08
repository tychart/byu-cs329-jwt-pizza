# 🍕 JWT Pizza

![Coverage badge](https://pizza-factory.cs329.click/api/badge/tychart/jwtpizzacoverage)

[![CI Pipeline](https://github.com/tychart/byu-cs329-jwt-pizza/actions/workflows/ci.yml/badge.svg)](https://github.com/tychart/byu-cs329-jwt-pizza/actions/workflows/ci.yml)

A JSON Web Token, or [JWT](https://jwt.io/introduction), (pronounced JOT) is a digitally signed transfer of information using JSON notation. Because you can validate the digital signature you can buy JWT pizzas with confidence.

`JWT Pizza` takes the next stage of digital evolution by allowing you to buy pizzas that you can never actually eat. Not only does JWT exchange bitcoin and give you nothing in return, it also allows for you to be come a franchisee and turn the whole vapor company into an MLM.

You can see a working example of the application at [pizza.cs329.click](https://pizza.cs329.click)

## Local development (Fedora 44)

The frontend runs with Bun. To use the app with real data, also run the backend and MySQL (see the backend repo below). The complete stack is:

```
MySQL (Podman, :3306)  →  jwt-pizza-service (Bun, :3000)  →  this frontend (Vite, :5173)
```

### 1. Install prerequisites

```sh
sudo dnf install -y git nodejs
curl -fsSL https://bun.sh/install | bash
# then reopen your terminal (or run: source ~/.bashrc)
```

| Tool | Why |
| --- | --- |
| `bun` | Package manager, task runner, and runtime — use it for everything |
| `nodejs` | Required only because Vite and Playwright are Node-based CLIs; run them through Bun |

> **Bun first.** Prefer `bun` / `bunx` over `npm` / `npx` for every command (`bun install`, `bun run dev`, `bunx playwright install chromium`).

### 2. Clone and install

```sh
git clone git@github.com:tychart/byu-cs329-jwt-pizza.git
cd byu-cs329-jwt-pizza
bun install
```

### 3. Start the full stack

1. Start MySQL and the backend service on http://localhost:3000. Follow the backend repo's README:
   [byu-cs329-jwt-pizza-service](https://github.com/tychart/byu-cs329-jwt-pizza-service) (also at `../byu-cs329-jwt-pizza-service/README.md`).
2. Start the frontend:

   ```sh
   bun run dev
   ```

   Open http://localhost:5173. `.env.development` already points `VITE_PIZZA_SERVICE_URL` at `http://localhost:3000`.

### 4. Build

```sh
bun run build     # production bundle in dist/
bun run preview   # serve the production build
```

## Testing with Playwright

The UI tests mock the backend service, so you do **not** need MySQL or the backend running.

```sh
bunx playwright install chromium   # one-time browser download
bun run test                       # run the tests
bun run test:coverage              # run with coverage (fails below 80% lines)
bunx playwright test --ui          # interactive UI mode / recording
bunx playwright show-report        # open the last HTML report
```

- Tests live in `tests/`, split into small per-feature files (`auth`, `menu`, `payment`, `delivery`, `diner`, `franchise`, `admin`, `docs`, `static`) that share the API mocks and helpers in `tests/mocks.ts`.
- `tests/testSetup.ts` fails a test if it makes a real call to `http://localhost:3000`.
- Playwright reuses an existing dev server on `:5173`. After changing dependencies, restart `bun run dev` so the tests don't hit a stale module graph.
- Coverage thresholds live in `.nycrc.json` (80% lines).
- Playwright starts the Vite dev server automatically via `bun run dev`.
- Recording (`--ui`) needs a graphical desktop session, so run it from a terminal on the machine itself, not over plain SSH.

## Frontend conventions

Short rules that reflect the current toolchain: TypeScript 7, React 19, Vite 8 (Rolldown), and React Router 8.

- **No `import React` for JSX.** `tsconfig.json` uses the automatic runtime (`"jsx": "react-jsx"`), so a file only imports what it actually uses.
- **Import hooks, events, and types by name.** e.g. `import { useState, type FormEvent } from 'react'` or `import type { ReactNode } from 'react'`. Don't reach for the `React.*` namespace.
- **Routing comes from `react-router`.** `react-router-dom` was removed in React Router 8; import `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, and every hook from `react-router`.
- **Use inline `type` imports** so it stays obvious what exists at runtime.
- **Compiler settings are intentional.** `moduleResolution: "bundler"` is required by TS 7 (the old `"node"` value was removed) and is correct for Vite, and `target: "ES2025"` is the newest level Vite 8 accepts. `tsc` is not part of the build — run `bunx tsc --noEmit` to type-check.

## Development notes

JWT Pizza uses Vite, React, Tailwind, and Preline. The following contains some notes about how these components were integrated into the project.

### Vite

Create the basic Vite app.

```sh
bun init -y
bun add -d vite@latest
```

Modify `package.json`

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
```

### React

React works out of the box with Vite. Install React and the router (React Router 8 is imported from `react-router`; the old `react-router-dom` package was removed in v8). The `index.html` file loads `index.tsx` which then loads the app component (`src/app/app.tsx`).

```sh
bun add react react-dom react-router
```

### Tailwind

To process the Tailwind css we use `postcss` and `autoprefixer`.

```sh
bun add -d tailwindcss postcss autoprefixer
bunx tailwindcss init
```

Modify `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['index.html', './src/**/*.{html,js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Create a `main.css` and add the basic Tailwind directives.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Modify `index.html` to include tailwind output.css.

```html
<head>
  ...
  <link href="./main.css" rel="stylesheet" />
</head>
```

Now when you run with `bun run dev` the css will automatically be generated.

### Preline

Added the Tailwind [Preline component library](https://preline.co/) so that I can use all of their nifty nav, slideshow, containers, and cards.

```sh
bun add preline
```

Updated the tailwind config to use preline.

```js
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['index.html', './src/**/*.{html,js,jsx}', './node_modules/preline/preline.js'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require('preline/plugin')],
};
```

Import preline into app.jsx.

```js
import 'preline/preline';
```

Initialize components whenever the page location changes.

```js
import { useLocation, Routes, Route, NavLink } from 'react-router';

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.HSStaticMethods.autoInit();
  }, [location.pathname]);
  //...
```

### Icons

[HeroIcons](https://heroicons.com/) - MIT license
