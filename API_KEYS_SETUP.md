# API Keys Setup

Signal Autopsy now has server-side Vercel API routes. Secrets belong in .env.local for local development and in Vercel Project Settings for the deployment. They must never be placed in index.html, app.js, or Git.

## Bitget RSA

Use the passphrase you created when generating the Bitget API key. IP restrictions are configured in Bitget's API management screen. Add only an approved server egress IP. Vercel does not provide a fixed outbound IP on every plan, so authenticated Reality depth may remain unavailable without approved static egress.

~~~env
BITGET_API_KEY=your_key
BITGET_PASSPHRASE=your_passphrase
BITGET_RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key_material\n-----END PRIVATE KEY-----"
BITGET_BASE_URL=https://api.bitget.com
~~~

The official Agent Hub SDK currently signs authenticated calls with HMAC. Signal Autopsy therefore uses Agent Hub's read-only market intent for public UTA v3 instrument and ticker data and its own official-spec RSA signer for authenticated Reality depth.

## Safety Controls

~~~env
RECEIPT_SIGNING_SECRET=use_at_least_32_random_server_only_characters
~~~

The route gate verifies signature, expiry, symbol, side, route, and notional. A passing gate returns a SIMULATED order ID. There is no environment flag that enables exchange submission in this build.

## Qwen

~~~env
BITGET_QWEN_API_KEY=your_s2_qwen_key
QWEN_BASE_URL=https://hackathon.bitgetops.com/v1
QWEN_MODEL=qwen3.8-max
QWEN_WIRE_API=responses
~~~

The S2 subsidy key uses Bitget's Qwen proxy and the Responses wire format. A standard DASHSCOPE_API_KEY remains supported as a fallback. Qwen only produces an adversarial examination. It cannot set the risk score or authorize execution.
