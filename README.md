# Rotation evidence archive and weekly K-pop chart

Sources: the relevant public pages at https://rotation.today/ . This isolated service
receives signed evidence from a Muse cloud goal. Weekly K-pop editions and source-wide
daily/backfill evidence have separate receivers and private storage prefixes. It has no game database, Aura database,
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
33 focused tests pass. The old job is disabled for future fires, not deleted; its original
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

The hosted `/` redirects to `/evidence.html`, the current read-only collection/review
desk. `/chart.html` is the actual weekly K-pop chart; `/feature-preview.html` preserves
the earlier feature-preview screen. Chart data loads
from this same service. Review selections persist only in that browser and generate
a request for review, never deployment approval or a live write. Chart source and
validation are pinned to Hyperidol5676f96; provenance is in site/PROVENANCE.txt.


## Source-wide collection (approved October 18)

`POST /api/evidence` accepts exact-byte Ed25519-signed backfill, daily and weekly-review
batches under `/evidence/contract.txt` and `contract.schema.json`. The existing producer
key is reused; no private key or storage credential is exported. Immutable raw batches
are saved under `evidence/batches/`; an ETag-protected index supports counts and review.
Signed timestamped GET readback verifies exact saved request hashes and parsed bodies.
Unsigned private reads/writes are denied. `/api/archive` and the frozen Oct17 map week
are unchanged by daily/backfill ingestion.

Hyperidol observations require exact named-credit K-pop identity evidence. New verified
identities are eligible without a fixed recording whitelist. Broader music and creative
musical estimates belong to SUGA CC within Aura OS. Raw evidence and SUGA review content
stay private; public GET exposes safe collection counts and K-pop suggestions only.
Source dates, capture times, measurement dates, partial lists and uncertainty stay
separate. Repeated Rotation observations remain one source family. Weekly review cards
retain their original source dates rather than labeling packaging time as fresh evidence.
No lyrics/audio/copied articles, game ratings, app writes or publication capability.

Muse schedules: `rotation-daily-source-collector` at06:00 America/Los_Angeles; existing
`rotation-weekly-capture-v2` Saturday07:00 includes source-wide review even when its map
step is unchanged/blocked. Daily collection prioritizes current evidence before historical
checkpoints; the source's75 exposed editions beginJuly19, with gaps/partial lists preserved.
The local Codex schedule stays paused. Persistent source challenges are recorded/deferred,
never bypassed. New live app/game/Aura releases and Telegram remain outside this approval.

Initial direct source-wide review delivery verified POST/readback/replay (2 private SUGA
suggestions). The saved daily test was triggered before path/current-first prompt fixes;
its outcome must retain that provenance and cannot certify the corrected prompt. Actual
run receipts and active saved-definition hashes belong in the private local handoff,
not in a claimed completed backfill. The review UI reads real archive counts; collection
completion is never inferred from an enabled schedule or a workspace-only file.
