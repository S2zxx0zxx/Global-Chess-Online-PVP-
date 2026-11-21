# Global Chess v3 original artwork provenance

Contract: user-provided Chess Final Production Ready Planning Pack v3, sections 03–05.
Status: implementation evidence, not a legal clearance certificate.

## Created in project branch
- Original chess identity: `global-chess-emblem.svg`, `global-chess-wordmark.svg`, `icon.svg`, `maskable.svg`
- Original mode art: `classic-royal.svg`, `quick-clock.svg`, `tactics-crown.svg`
- Original local avatars: `guest-avatar.svg`, `computer-avatar.svg`
- Original result ornament: `victory-confetti.svg`
- Original navigation icon family: `nav-home.svg`, `nav-play.svg`, `nav-learn.svg`, `nav-profile.svg`
- Original piece family: `brand/pieces/piece_{white|black}_{king|queen|rook|bishop|knight|pawn}.svg` (12 variants)
All above SVG assets were newly authored for this game in this development wave. No Chess Clash or Miniclip logos, screenshots, bitmaps or distinctive UI artwork were used as project source assets.

## Runtime integration
- Assets are stored under `public/brand/` and `public/brand/pieces/`.
- Installable icon is `public/icon.svg`, with safer-area maskable `public/maskable.svg`.
- Offline service-worker manifest enumerates brand and piece files.
- Main lobby and match views use original art directly; piece artwork selectable as `Royal Crest`.
- Current original art is scalable and editable SVG; no external image CDN is required.

## Still requires validation
- Existing earlier `public/chess-assets/board/maple-walnut.webp` and earlier
  `public/chess-assets/pieces/*.webp` must have proof of ownership/license and original master files.
- New art requires 320/360/412px and device contrast QA, display-zoom tests and icon mask checks.
- Generated concept renders, audio OGG files, store poster, real mobile screenshots,
  self-hosted licensed fonts and native PNG/adaptive assets are not certified in this repo.
- The commercial license/ownership declaration must be reviewed by the product owner.
Do not describe the full v3 asset registry as complete merely because the original SVG family exists.
