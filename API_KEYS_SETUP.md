# API Keys Setup

Signal Autopsy now has server-side Vercel API routes. Secrets belong in .env.local for local development and in Vercel Project Settings for the deployment. They must never be placed in index.html, app.js, or Git.

## Bitget RSA

Use the passphrase you created when generating the Bitget API key. Keep spot/UTA trade permission enabled. IP restrictions are configured in Bitget's API management screen; add the fixed egress IP of the server that will execute orders. Vercel does not provide a fixed outbound IP on every plan, so keep execution in simulated mode unless the deployment has approved static egress.

~~~env
BITGET_API_KEY=your_key
BITGET_PASSPHRASE=your_passphrase
BITGET_RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key_material\n-----END PRIVATE KEY-----"
BITGET_BASE_URL=https://api.bitget.com
~~~

The official Agent Hub SDK currently signs authenticated calls with HMAC. Signal Autopsy therefore uses Agent Hub's read-only market intent for public UTA v3 ticker data and its own official-spec RSA signer for authenticated Reality depth and Reality orders.

## Safety Controls

~~~env
RECEIPT_SIGNING_SECRET=use_a_long_random_server_only_secret
BITGET_EXECUTION_MODE=simulated
BITGET_LIVE_ACK=
~~~

The route gate is machine-enforced in both modes. To deliberately arm real order submission, set BITGET_EXECUTION_MODE=live and BITGET_LIVE_ACK=I_UNDERSTAND_REAL_ORDERS. A valid REAL-signed, unexpired receipt must still pass symbol, side, route, and notional checks.

## Qwen

~~~env
BITGET_QWEN_API_KEY=your_s2_qwen_key
QWEN_BASE_URL=https://hackathon.bitgetops.com/v1
QWEN_MODEL=qwen3.8-max
QWEN_WIRE_API=responses
~~~

The S2 subsidy key uses Bitget's Qwen proxy and the Responses wire format. A standard DASHSCOPE_API_KEY remains supported as a fallback. Qwen only produces an adversarial examination. It cannot set the risk score or authorize execution.
