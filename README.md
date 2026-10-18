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

Status: dedicated private storage connected with explicit user approval. Direct signed
Muse delivery and exact replay preserve the frozen complete edition. The saved job
rotation-weekly-capture-v2 is the only enabled future Saturday07:00 America/Los_Angeles
schedule. Its final b16386 test fc152c00 succeeded at2026-10-18T09:29:02Z: already-saved
Saturday short-circuit, unchanged signedPOST200/already_saved, independent freshGET200
and deep-equal readback, no human approval, no new week or packet mutation. The saved
job's NEW-week capture/classification/append path has not yet run; first scheduled
exercise is October24. Independent source verification read160/165 and remains
blocked/incomplete, preserving the original frozen complete edition.
16 focused tests pass. The old job is disabled for future fires, not deleted; its original
full-capture parent parked while read-only children remained in flight. Its recovery
was canceled before execution. Prior v2 test0353f9 stopped safely on its obsolete
daily-date guard without a POST. Exact records and final receipt are kept in the local
handoff, not exposed as false complete-capture evidence.
The browser artifact relay is retired (human Share required per version); its manual
probe workflow has no schedule. No live Hyperidol domain or Telegram publication is
included here.

`npm test` checks signed requests, replay, immutable history, corrupt objects, future
editions, size bounds, CAS conflicts and storage failure. Source acquisition must stop
on checkpoints, incomplete country positions, mixed dates or unresolved identity. Never
bypass a source restriction or retry through alternate identities.

The hosted `/` review desk and `/chart.html` are read-only previews. Chart data loads
from this same service. Review selections persist only in that browser and generate
a request for review, never deployment approval or a live write. Chart source and
validation are pinned to Hyperidol5676f96; provenance is in site/PROVENANCE.txt.
