# Rufia — material, drawing, workshop

Updated 2026-10-25. Independent design concept, not an official identity or actual garment catalogue. Audience: people considering a conversation with the atelier. Primary action: contact or try the clearly marked demo enquiry form.

## References consulted

- https://styles.refero.design/style/cdc4a162-cefa-49a1-81e7-4857e421ae24 — Adam Lippes reference: the photographic plate, paper surface and strong image proportions anchor the fashion composition. We retain the existing Rufia layout, Cyrillic Prata/Golos, 18px reading copy and ultramarine actions; we do not copy its monochrome-only palette or small navigation.
- https://21st.dev/@ibelick/components/spotlight — Julien Thibeaut Spotlight: pointer-controlled illumination over a fixed surface. Public usage and description inspected; implementation source requires an account. No source was copied and no React dependency was installed. The original local equivalent changes the light on stationary fabric.
- https://motionsites.ai/lesson/cursor-tracking-website-with-motionsites — public tutorial: bounded pointer input controls a visual property; input is not an excuse to slide an entire picture. Original response here is light position and woven detail. No video, remote prompt execution or paid source was used.

Live browser verification belongs to the task's QA pass; inspecting these references is not a claim to have tested their demos.

## Design system

Preserved: paper #efefeb, ink #202221, ultramarine #304bc4, secondary #61655f, ruled borders #c6c9c1. Prata for editorial titles, Golos Text for controls and body. Body 18px; controls 16px; secondary copy14px. Main maximum width1380px, desktop sidegaps48px, mobile20px. Square working sheets, a fixed textile photograph and code-native garment drawings.

The new emblem is an original needle with trailing thread. It replaces the bare R in header/footer/favicon; its concept status is disclosed in the demo information.

## Interaction map

| Section | Input → response | Bounds and alternatives |
| --- | --- | --- |
| Material hero | Move pointer → sheen follows over fixed photo; activate → reveal woven overlay | Image never translates/scales/rotates and native image drag is disabled. Light clamps0–100%. Touch tap and Enter toggle detail; keyboard arrows move light. Reduced motion uses static/discrete light. |
| Approach | Pointer → curved thread and sketch motifs respond | Existing bounded decorative response; text and targets remain fixed; reduced motion is static. |
| Sketch | Enable pen → mouse/touch drawing or keyboard polyline; change garment/color → preserve per-garment drawings | SVG coordinate bounds8–392 and8–512; max24 lines ×600 points per silhouette. Mouse/finger draws. Arrow keys move pen; Enter/Space adds a point, Esc ends a line. Undo/clear and SVG download produce a usable result. Native page scrolling remains available outside the explicitly enabled drawing surface. |
| Workshop | Choose material/cut/detail → live garment changes; check against the brief → specific feedback | Three fictional briefs and three completed garments; wrong attempts can be revised, successful choices lock until next order; restart clears all. Native radios/buttons support touch/keyboard. Artwork alone responds to pointer. |
| Contact/footer | Pointer/focus → needle/thread and form border respond | Fields and main targets remain fixed; form is an honest local demonstration. |

## Workshop solutions and QA path

1. Аня, summer city walk: Лён + Свободный + Карманы.
2. Мира, dancing: Трикотаж + Приталенный + Пояс.
3. Даша, presentation: Жаккард + Структурный + Лацканы.

Submit with missing selections, submit a wrong combination, revise and solve all three, then restart. Three collections appear progressively. Verify rapid repeated submit/next cannot duplicate cards. This is an interpretive design game with explicit fictional wishes, not professional tailoring advice.

Sketch QA: toggle pen, draw two strokes, undo, clear, add keyboard line, change color, switch silhouette and back (drawing persists per silhouette), export SVG. No drawing or personal data is stored across reload. Existing enquiry form remains unchanged.
