# API Keys Setup

Paste your Bitget API credentials into:

```text
.env.local
```

Use this format:

```env
BITGET_API_KEY=your_key_here
BITGET_API_SECRET=your_secret_here
BITGET_API_PASSPHRASE=your_passphrase_here
BITGET_BASE_URL=https://api.bitget.com
BITGET_TRADING_MODE=paper
```

Do not put keys in `index.html`, `docs.html`, frontend JavaScript, README, or any file that will be pushed to GitHub.

Important: the current app is still a static frontend. `.env.local` prepares the project for a backend/API route, but browser JavaScript cannot securely use private exchange keys. When live account actions are added, the backend should read `.env.local`, sign Bitget requests, and return only safe results to the frontend.
