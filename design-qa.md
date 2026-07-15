# Design QA · portada del tutor amb Piu

- Source visual truth path: `/Users/marc/Documents/Company d'estudi/docs/qa/tutor-home-reference.png`
- Implementation screenshot path: `/Users/marc/Documents/Company d'estudi/docs/qa/tutor-home-desktop.png`
- Full-view comparison evidence: `/Users/marc/Documents/Company d'estudi/docs/qa/tutor-home-comparison.png`
- Viewport: 1280 × 720 CSS px, DPR 2, screenshot captured with CSS scale and full-page mode.
- State: tutor de validació autenticat, entrada directa al grup actiu, grup sense alumnes ni activitat.

**Findings**

- No actionable P0, P1 or P2 visual mismatches remain.
- Information architecture: the implementation preserves the sketch hierarchy — tutor header, greeting, Piu as the central protagonist, six surrounding actions, Radar and feedback in the right rail.
- Fonts and typography: the existing Company d’estudi display/body pairing is retained. The hierarchy is legible and matches the hand-drawn emphasis without introducing a new type system.
- Spacing and layout rhythm: orbit positions, card separation, central character scale, right rail and top bar follow the sketch proportions. No overlap or horizontal overflow at the tested viewport.
- Colors and visual tokens: existing navy, warm canvas, white surfaces, line and shadow tokens are used consistently; contrast remains strong.
- Image quality and asset fidelity: the existing high-resolution Piu emotion asset is used directly, with correct aspect ratio, no crop, no placeholder and no CSS/SVG substitute.
- Copy and content: crossed-out labels were replaced with `Progrés de classe`, `Missatges alumnes` and `Missions de classe`; `Alumnes` includes `Informació rellevant`; `Resum`, `Comunitat`, `Radar` and `Espai feedback` are present.
- Icons: Phosphor icons are used consistently and align optically with the existing student home.
- Accessibility and behavior: actions are semantic buttons with visible focus states and labels; heading structure and image alt text are present. Desktop navigation, return home and community access were exercised.

**Open Questions**

- None blocking. The tutor name and class name are intentionally dynamic, so the validation capture shows `Tutor` and the local validation group instead of `Marc` and his production class.

**Comparison History**

1. First browser-rendered pass found a P2 empty-state behavior issue: Radar remained in `Actualitzant…` when the selected class had zero students. `observeTutorClassActivity` now emits an empty activity state immediately.
2. Post-fix browser capture shows `Tot tranquil`, with the full orbit, right rail and account header visible. The combined source/implementation comparison has no remaining actionable P0/P1/P2 finding.

**Focused Region Comparison**

- A separate focused crop was not needed: at 1280 px the combined comparison keeps the top bar, all six orbit actions, Piu, Radar and feedback text readable in one frame.

**Primary Interactions Tested**

- Direct tutor entry without a group selector.
- `Resum` opens class follow-up.
- Brand/back control returns home.
- `Comunitat` opens the real class community.
- Settings and sign-out controls are present and keyboard-focusable.
- Browser console checked: no errors; only Vite/React development messages.

**Implementation Checklist**

- [x] Direct tutor entry into the active group.
- [x] Piu-centered tutor home from the supplied sketch.
- [x] Corrected labels and added tutor access points.
- [x] Real class-derived Radar and feedback summary.
- [x] Functional routes to follow-up, community, missions, calendar and settings.
- [x] Empty-class activity state resolved.
- [x] Tests and production build passing.

**Follow-up Polish**

- P3: validate the live production state with Marc’s real class data after deployment; dynamic badges and Radar entries will then replace the calm empty state.

final result: passed
