# Orchid Health website

Static HTML site in `public_html/` (no build step). Deployed as-is.

## Privacy / consent rules (do not regress)
- Every page must include, in `<head>` before any other script:
  `<link rel="stylesheet" href="{prefix}css/consent.css" type="text/css" />` and
  `<script src="{prefix}js/consent.js"></script>` (`{prefix}` = `../` per directory level; `404.shtml` uses `/`).
- Pages under `behavioralhealth/` and `404.shtml` add `data-analytics="off"` to the consent.js tag.
- Every page needs a `<a href="#" data-consent-open>` Privacy settings link (footer `.footer-links` block where present).
- Never paste tracking tags (GA, Meta/Facebook, ad pixels, call tracking) directly into pages. Google Analytics is
  loaded only by `js/consent.js`; the GA4 ID lives in `GA_ID` there (`G-J6LD7YL94P`, the "Orchid Health" stream
  of property 252076728; one ID for the whole site, per-page reporting is by page path; `G-XXXXXXXXXX` = GA disabled).
  The blog (blog.orchidhealth.org, Webflow) uses the same stream; its GA must also be loaded only via consent.js.
- Meta Pixel / Facebook SDK and ReachLocal were removed on purpose; do not re-add.
- No third-party requests before consent: fonts are self-hosted (`css/fonts-local.css`), embeds must use the
  click-to-load pattern (`<div class="oc-embed" data-consent-embed data-src="...">` with a
  `[data-consent-embed-play]` button; see the YouTube embed in `index.html`).

## Verification
- Serve locally: `python3 -m http.server 8000 --directory public_html`.
- Check that no tracker strings came back:
  `grep -rnE "fbq|connect\.facebook\.net|googletagmanager|google-analytics|fonts\.googleapis|rlets|youtube\.com/embed" public_html --include=*.html --include=*.shtml`
  should only match nothing (consent.js is the only file that references googletagmanager).
- In a browser with DevTools > Network: with no choice / after Reject, no third-party requests (except the
  hotlinked HRSA NHSC badge image on clinic pages); after Accept, only `googletagmanager.com` on non-BH pages.
