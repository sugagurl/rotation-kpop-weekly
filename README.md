# Weekly K-pop country-chart archive

Source: https://rotation.today/map . A separate data service receives signed, reviewed
weekly K-pop packets from a Muse cloud goal. It has no game database, Aura database,
account tokens or application credentials. The producer's private signing key stays in
its goal workspace; only its public key is configured here.

GET /api/archive returns public chart JSON. POST verifies an Ed25519 signature over the
exact UTF-8 JSON bytes in X-Rotation-Signature, validates completeness and identity, and
rejects changed/omitted historical editions. Dated objects are immutable; the current
feed uses ETag conditional writes. Storage is private for fresh origin reads; the public
API exposes only the validated K-pop packet. Failed/blocked capture attempts preserve
all complete saved editions.

Status: receiver prepared and13 tests passing. A one-time dedicated storage connection
is awaiting specific approval. No unattended schedule is active yet. The earlier browser
artifact relay is retired: Muse requires a new human Share approval for every public
artifact version. Its manual probe workflow is retained only as an evidence check and
has no schedule. No live Hyperidol domain or Telegram publication is included here.

`npm test` checks signed requests, replay, immutable history, corrupt objects, future
editions, size bounds, CAS conflicts and storage failure. Source acquisition must stop
on checkpoints, incomplete country positions, mixed dates or unresolved identity. Never
bypass a source restriction or retry through alternate identities.
