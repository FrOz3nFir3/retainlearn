# RetainLearn

[![CodeQL](https://github.com/FrOz3nFir3/retainlearn/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/FrOz3nFir3/retainlearn/actions/workflows/github-code-scanning/codeql)
[![Dependabot Updates](https://github.com/FrOz3nFir3/retainlearn/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/FrOz3nFir3/retainlearn/actions/workflows/dependabot/dependabot-updates)
[![Deploy to Dokploy](https://github.com/FrOz3nFir3/retainlearn/actions/workflows/deploy.yml/badge.svg)](https://github.com/FrOz3nFir3/retainlearn/actions/workflows/deploy.yml)

RetainLearn is a full-stack spaced repetition and flashcard application designed to help users learn and retain information effectively. It features a modern, responsive frontend and a robust, secure backend with performance optimizations.


## 🚀 Features

*   **Smart Learning:** Create decks and flashcards organized by categories.
*   **Rich Content:** Support for rich text editing in flashcards using Tiptap.
*   **Progress Tracking:** Visualize learning progress and streaks.
*   **User Profiles:** Public and private profiles to showcase learning achievements.
*   **Secure Authentication:** Native email/password login and Google OAuth integration.
*   **Performance:** Implements Redis caching and rate limiting for optimal speed and security.

## 🛠 Tech Stack

### Frontend (`/client`)
*   **Framework:** React 19 (via Vite)
*   **Language:** JavaScript, and TypeScript for the new screens. Vite builds it and `tsc` type-checks it. New code imports the client's own files with `#` (`#components/ui/Button.tsx`), and the shared rules by name
*   **Styling:** Tailwind CSS 4
*   **State Management:** Redux Toolkit
*   **Routing:** React Router DOM 7
*   **Key Libraries:** `@dnd-kit` (Drag & Drop), `@tiptap` (Rich Text), `react-hot-toast`

### Backend (`/server`)
*   **Runtime:** Node.js 26, in a Docker image (the root `Dockerfile`)
*   **Language:** JavaScript, and TypeScript for new code. Node runs the `.ts` files directly and `tsc` type-checks them. What a request sends is checked with Zod (`src/middleware/validate.ts`), and new code imports the server's own files with `#` (`#middleware/validate.ts`)
*   **Framework:** Express 5
*   **Database:** MongoDB (Mongoose 8)
*   **Caching:** Redis & LRU Cache
*   **Security:** Helmet (CSP), Rate Limiting, CORS, Bcrypt, JWT

### Shared study rules (`/packages/core`)
*   **What:** the rules both the server and the client use, so the two never disagree: the player's local day, player cards and how they fade, what an answer changes, progress and statuses, and today's timetable.
*   **How:** plain TypeScript functions with no database, network or screen. Node 22.18 and newer runs the `.ts` files directly, and Vite handles them in the client. Imported by name, `@retainlearn/core`. Marked free of side effects (`"sideEffects": false`), so the site bundles only the rules it uses, and Zod only where something is checked.

## 🏁 Getting Started

### Prerequisites
*   **Node.js:** v22.x or higher
*   **MongoDB:** Local instance or Atlas URI
*   **Redis:** (Optional) For caching and rate limiting

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/FrOz3nFir3/retainlearn.git
    cd retainlearn
    ```

2.  **Install dependencies:**
    This project is set up as a monorepo. Use the root script to install dependencies for the client, the server and the shared study rules (the server links to them):
    ```bash
    npm run install-all
    ```

3.  **Configuration:**
    Create a `.env` file in the root directory by copying the sample:
    ```bash
    cp sample.env .env
    ```
    Open `.env` and fill in your details:
    *   **Frontend:** `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`
    *   **Backend:** `MONGO_URI`, `ACCESS_TOKEN_SECRET`, `REDIS_URI`, etc.

### Running the Application

Start both the client and server concurrently in development mode:

```bash
npm run dev
```

*   **Frontend:** http://localhost:5173
*   **Backend:** http://localhost:3000

### Local development: local databases only

A server started on your machine should never touch production's database.

1.  **MongoDB** on your machine (port 27017), and **Redis** from Docker:
    ```bash
    docker compose up -d
    ```
    This file is only for local Redis. Production doesn't use it: Dokploy builds and runs the server, and Cloudflare the client.
2.  **`.env.local`** points the server at them. It loads before `.env` and wins, and git ignores it:
    ```bash
    cp .env.local.example .env.local
    ```
    The server logs which database it connects to (`Initializing MongoDB connection to mongodb://localhost:27017/retainlearn`), and it stops if it can't connect.
3.  **Data** in the working database, `retainlearn`, either:
    *   copied from another local database, e.g. an imported copy of production (collections and indexes, the target dropped first):
        ```bash
        npm run db:copy --prefix server -- --from <imported copy> --to retainlearn
        ```
        With no arguments, `npm run db:copy --prefix server` copies `retainlearn` into `retainlearn_rehearsal`, to rehearse a migration on a copy first.
    *   or made-up data:
        ```bash
        npm run db:seed --prefix server
        ```

These scripts and the tests only ever write to a **local** database whose name starts with **`retainlearn`**. They refuse anything else (`server/scripts/local-only.js`).

### Tests

```bash
npm install --prefix packages/core   # once: the shared rules' own dependencies, which the server and the client use too
npm run typecheck --prefix server && npm test --prefix server
npm run typecheck --prefix client && npm test --prefix client
npm run typecheck --prefix packages/core && npm test --prefix packages/core
```

The API tests use Node's built-in test runner against a local database of their own, `retainlearn_test`, which is dropped and filled with made-up data at the start of each run, and Redis database 1. The server's TypeScript has a type check of its own. The client has a type check too, and its unit tests use the same runner and need no browser. The shared study rules have a type check and tests of their own: each test is one rule, written as an example. All three run on every pull request in GitHub Actions (`.github/workflows/test.yml`), where the client is also built as Cloudflare builds it, along with a fourth check that builds the server's Docker image and starts it.

### Deploying

Every push to `main` deploys. **Dokploy** builds the server from the root `Dockerfile` (Build Type "Dockerfile", Build Path `/`) and starts it with its settings as environment variables. **Cloudflare** builds and serves the site from `client/`. The image holds only the server and the shared rules (`.dockerignore` keeps everything else out), runs Node 26 as a non-root user, and stops cleanly when a deploy replaces it.

In Dokploy, the Build Path must be `/`, saved with its own Save button in the GitHub section. With `server`, Dokploy looks for `server/Dockerfile`, and the build fails. Leave Docker File, Docker Context Path and Docker Build Stage empty.

In Cloudflare, the site's build command is plain `npm run build`, with root directory `/client`. Its `prebuild` script installs the shared rules' own packages first (`npm ci --prefix ../packages/core`): the client links to the rules (`file:../packages/core`), and npm doesn't install a linked package's dependencies, so without it the build couldn't find Zod once a screen uses the rules. Because this lives in the repo, any place that runs `npm run build` works without extra settings.

To build and try the image on your machine, against a local database:
```bash
docker build -t retainlearn-api .
docker run --rm -p 3998:3000 -e MONGO_URI=mongodb://host.docker.internal:27017/retainlearn_rehearsal \
  -e REDIS_URI=redis://host.docker.internal:6379/3 \
  -e ACCESS_TOKEN_SECRET=local -e REFRESH_TOKEN_SECRET=local -e COOKIE_SECRET=local retainlearn-api
curl -H "X-Forwarded-Proto: https" http://localhost:3998/api/health
```
In production mode the server redirects plain HTTP to HTTPS. The header stands in for the proxy that marks real requests as HTTPS.

### Database changes (migrations)

Changes to the database's shape (indexes, new collections, data moved into them) are numbered migrations in `server/src/migrations`, run in order, once each. **Nothing is run by hand.** The deployed server runs the new ones itself once it's answering requests, records each in the `migrations` collection, and shows the latest in `/api/health` (`"migrations": {"state": "done", ...}`). A local server does the same on its local database; one pointed at another machine's database leaves them alone. Mongoose doesn't make indexes or collections at startup (`autoIndex` and `autoCreate` are off): the migrations do.

Before deploying, `npm run check:data` with `MONGO_URI` pointed at production lists, read-only, what the new migrations will do there, and anything that would stop them. How to write one, and the rules (code before data, safe to run again, and so on), are at the top of `server/src/migrations/runner.js`.

## 📜 Scripts

*   `npm run install-all`: Installs dependencies for root, client, and server.
*   `npm run dev`: Starts both client and server in watch mode.
*   `npm run client`: Builds the frontend for production.
*   `npm run server`: Starts the backend server.
*   `npm run deploy`: Builds client and starts server.
*   `npm run reports --prefix server`: Lists the study sets people have reported, most reported first. It only reads (the database in `MONGO_URI`), and says how to list a set again after checking it.
*   `npm run check:data --prefix server`: Checks, read-only, that a database's data fits what this version of the server reads (sign-in, the categories, each set's page), and lists what its migrations will do there, before deploying it. Point `MONGO_URI` at production to check it there. It prints counts only.

## 📄 License

This project is released under the **The Unlicense** (Public Domain). See the [UNLICENSE](UNLICENSE) file for details.

## 🙏 Credits & Acknowledgements

Special thanks to the following tools and services that made this project possible:

*   **[Cloudflare](https://www.cloudflare.com/)**: For reliable DNS resolution and content delivery network (CDN) services.
*   **[Oracle Cloud Infrastructure](https://www.oracle.com/cloud/)**: For robust and scalable cloud hosting solutions.
*   **[Dokploy](https://dokploy.com/)**: For simplifying application deployment and management.
*   **[Insomnia](https://insomnia.rest/)**: For providing a powerful interface to test and debug APIs.
*   **[Kiro](https://kiro.dev/)**: For its AI-powered development capabilities that assisted in building this application.
*   **[Google Gemini CLI](https://github.com/google-gemini/gemini-cli)**: For providing intelligent command-line assistance during development.
*   **[Google AI Studio](https://aistudio.google.com/)**: For access to advanced AI models and testing environments.