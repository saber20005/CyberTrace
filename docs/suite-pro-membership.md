# Suite Pro membership status — CyberTrace (staged)

The Pro page keeps **all existing Free content** and explicitly states that
checkout and paid enrollments do not exist. This PR adds a **manual** "check my
membership" panel only for an independently authenticated BLACKBOX account,
using the already-reserved `getSuiteMembership` callable. Neither matching
email nor a CyberTrace Firebase UID is used to infer entitlement.

The client requires the existing real BLACKBOX Firebase app and matching
current Auth UID, a configured Enterprise App Check public site key, and
the backend callable in `us-central1`. It validates the server's strict Free
or Pro response shape. Unavailable backend, missing key and invalid responses
do not produce a false active membership. No localStorage entitlement,
auth bypass, checkout link, premium content or credential data is added.

**Important:** `Suite Pro` is still **NOT FOR SALE**. The server owns the
source of truth. The separate BLACKBOX release-gate PR keeps even a valid
server-managed membership inactive until release conditions are met. A client
badge is never authorization for paid content. No payment provider, price,
refund, cancellation, webhook or protected premium scenario is provisioned.

Before merge, verify Google/email sessions, two Firebase projects, mobile
layout, App Check unavailable scenarios, and existing Free/Pro page routes.
