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
*   **Styling:** Tailwind CSS 4
*   **State Management:** Redux Toolkit
*   **Routing:** React Router DOM 7
*   **Key Libraries:** `@dnd-kit` (Drag & Drop), `@tiptap` (Rich Text), `react-hot-toast`

### Backend (`/server`)
*   **Runtime:** Node.js v22
*   **Framework:** Express 5
*   **Database:** MongoDB (Mongoose 8)
*   **Caching:** Redis & LRU Cache
*   **Security:** Helmet (CSP), Rate Limiting, CORS, Bcrypt, JWT

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
    This project is set up as a monorepo. Use the root script to install dependencies for both client and server:
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

## 📜 Scripts

*   `npm run install-all`: Installs dependencies for root, client, and server.
*   `npm run dev`: Starts both client and server in watch mode.
*   `npm run client`: Builds the frontend for production.
*   `npm run server`: Starts the backend server.
*   `npm run deploy`: Builds client and starts server.

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