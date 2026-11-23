# CyberTrace Royal Gold optional theme
The seven-stop gold palette approved in the Vercel preview is now a fourth appearance option on the **existing** `?view=settings` page and a one-tap preset. It is opt-in: no current user is forced away from their saved appearance.

The CSS targets only `html[data-ct-theme="gold"]` (not the old preview attribute) and is imported by the live application. The preview-only floating comparison control and script are NOT copied.

The theme uses the original proposed amber colors `#5A4A0D #7A5E12 #A67917 #CC961F #EBB84A #F3D789 #FFF3D8`, darkened mixes for deep cards, and covers investigation review, SOC shift, account, journeys, studio status indicators.

The gold palette does **not** mix with cyan/violet accent colors: selecting Royal Gold automatically uses the `brand` accent; those alternative swatches are disabled while it is selected. Other themes keep their current palette controls.

Settings persist under the existing `cybertrace.ui-preferences.v1` key, with strict validation and no writes to account progress, certificates, Firebase or BLACKBOX.

Validation: Node schema/migration tests, Chromium 320/390/1440 with theme selection, reload persistence, readability/overflow and former green card computed-color checks, existing Firebase emulator jobs. Only merge after successful CI. Preview PR #78 remains unmerged; its experimental comparator must not be brought into production.
