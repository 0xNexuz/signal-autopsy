# Reusable SDK Surface

The reusable core can later become a small package with three stable calls:

~~~text
computeRisk(input) -> decision
signReceipt(payload, secret) -> signature
inspectRouteGate(receipt, order, secret) -> authorization
~~~

Recommended package boundary:

- pure deterministic engine with versioned weights;
- receipt schema and canonical serializer;
- route-gate middleware for Node services;
- Bitget Reality adapter as an optional integration;
- Qwen adapter kept outside the authorization package.

Extraction should wait until the receipt schema and route thresholds have at least one external consumer. Premature packaging would make schema changes harder during validation.
