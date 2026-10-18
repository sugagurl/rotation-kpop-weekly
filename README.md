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

Status: isolated private storage connected with explicit user approval. First signed
Muse delivery is visible through fresh GET; the frozen complete edition is unchanged.
The160/165 verification attempt is blocked/incomplete. Exact replay returns already_saved
and preserves the feed. The saved Saturday07:00 America/Los_Angeles cloud job is active;
its first scheduler-owned test run is still running, not yet verified.15 focused tests pass. The earlier browser
artifact relay is retired: Muse requires a new human Share approval for every public
artifact version. Its manual probe workflow is retained only as an evidence check and
has no schedule. No live Hyperidol domain or Telegram publication is included here.

`npm test` checks signed requests, replay, immutable history, corrupt objects, future
editions, size bounds, CAS conflicts and storage failure. Source acquisition must stop
on checkpoints, incomplete country positions, mixed dates or unresolved identity. Never
bypass a source restriction or retry through alternate identities.

The hosted `/` review desk and `/chart.html` are read-only previews. Chart data loads
from this same service. Review selections persist only in that browser and generate
a request for review, never deployment approval or a live write. Chart source and
validation are pinned to Hyperidol5676f96; provenance is in site/PROVENANCE.txt.
