# Original Royal Artwork v1 — Implementation register

- 45 individually authored SVG illustration slots are in `public/brand/royal-*.svg`.
- No extracted third-party image pixels, APK resource bundles, fonts, logos, or voice assets are included.
- Reproducibility: art consists of static SVG geometry, strokes and self-contained gradients. The SVG source is the editable production master.
- `src/original-royal-art.js` declares the registry used to verify the build.
- These are **initial art primitives**, not a claim that all 497 reference sprites were reconstructed, nor full legal title certification.
- Existing pieces and board themes from PR #13/#18 remain in use; importing a new asset does not replace tested chess state.
- For PNG-only outputs: rasterize these vectors at the required device density from the master, record hashes/terms, review originality and test crops before shipping.
- Pending: dedicated mobile imagery/human art direction signoff, physical device, Android TalkBack, frame-rate/memory benchmarks, store/legal clearances.
