```markdown
# Design System Specification: The Serene Sentinel

## 1. Overview & Creative North Star
**Creative North Star: The Digital Sanctuary**
This design system is built to transform "anxiety-inducing tasks" into a controlled, premium, and sophisticated experience. We are moving away from the frantic, high-density layouts of traditional SaaS. Instead, we embrace **The Digital Sanctuary**—a philosophy rooted in high-end editorial layouts, breathing room (negative space), and depth through light rather than lines.

To break the "template" look, we utilize **Intentional Asymmetry**. Important actions aren't always centered; they are positioned to guide the eye through a path of least resistance. Overlapping elements and high-contrast typography scales create a sense of bespoke craftsmanship, ensuring the user feels they are in a safe, expertly curated environment.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep, nocturnal tones to reduce eye strain and promote a sense of calm.

### Surface Hierarchy & Nesting
We reject the flat grid. Hierarchy is achieved through **Tonal Layering**, treating the UI as stacked sheets of frosted obsidian.
- **Base Layer:** `surface` (#131318) is the canvas.
- **Sectioning:** Use `surface-container-low` (#1b1b20) for large structural areas.
- **Interactive Elements:** Use `surface-container-high` (#2a292f) for cards or modular components to create a natural "lift."

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Boundaries must be defined solely through background color shifts. If a container sits on the `surface`, use `surface-container-low` to define its bounds. 

### The "Glass & Gradient" Rule
For floating modals or high-priority overlays, use **Glassmorphism**:
- **Background:** `surface-container-highest` at 60% opacity.
- **Effect:** `backdrop-filter: blur(20px)`.
- **Signature Texture:** Primary CTAs should use a subtle linear gradient from `primary` (#d0bcff) to `primary-container` (#a078ff) at a 135-degree angle to provide a "silk-like" finish.

---

## 3. Typography
We use a dual-typeface system to balance authority with approachable clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern editorial feel. Use `display-lg` for hero statements to command attention without shouting.
*   **Body & Labels (Inter):** The workhorse. Inter provides maximum readability for task details.

**Hierarchy as Identity:** 
Large, thin headlines (`headline-lg`) paired with generous letter spacing convey a "premium concierge" feel. Use `label-sm` in all-caps with increased tracking (0.05em) for category headers to create an authoritative, organized structure.

---

## 4. Elevation & Depth
In this design system, depth is a feeling, not a drop-shadow effect.

*   **The Layering Principle:** Stack containers to create hierarchy. A `surface-container-lowest` card placed on a `surface-container-low` background creates a "sunken" effect, perfect for secondary data or logs.
*   **Ambient Shadows:** For "floating" elements (like FABs or dropdowns), use a custom shadow: `0px 24px 48px rgba(0, 0, 0, 0.4)`. Shadows must never be harsh; they should mimic a soft glow being absorbed by the dark background.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at 15% opacity. Never use 100% opaque borders.
*   **Tonal Transitions:** Use smooth 300ms ease-in-out transitions for all hover states to maintain the "calm" brand promise.

---

## 5. Components

### Buttons
- **Primary:** `primary` background with `on-primary` text. `xl` roundedness (1.5rem). No border.
- **Secondary (High Contrast):** `secondary` (Amber #ffb95f) background. Reserved exclusively for "Resolve" or "Confirm" actions.
- **Tertiary (Ghost):** No background. `primary` text. Used for "Cancel" or "Back" to reduce visual noise.

### Cards & Lists
**Strict Rule:** Forbid the use of divider lines. 
- Separate list items using `12px` of vertical white space.
- Use a slight `surface-bright` hover state change to indicate interactivity.
- Cards should use `md` roundedness (0.75rem).

### Input Fields
- **Default:** `surface-container-highest` background, no border, `sm` roundedness.
- **Focus State:** A subtle `primary` outer glow (4px spread, 20% opacity) and the "Ghost Border" becomes 40% opaque.
- **Error:** Background shifts slightly toward `error_container` with `error` text for the helper message.

### Risk Indicators (Chips)
- **Low Risk:** `tertiary_container` background with `on-tertiary` text.
- **Medium Risk:** `secondary_container` background with `on-secondary` text.
- **High Risk:** `error_container` background with `on-error` text.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical margins (e.g., 80px left, 48px right) on desktop to create an editorial feel.
- **Do** use `primary_fixed_dim` for icons to keep them sophisticated and subdued.
- **Do** leverage whitespace as a functional tool to reduce user cognitive load.
- **Do** ensure all "Risk" semantic colors meet AA contrast ratios against the dark background.

### Don't
- **Don't** use pure black (#000000). It feels "hollow" rather than premium. Use our `surface` (#131318).
- **Don't** use "Cyberpunk" neon glows. Keep glows restricted to a 2px soft outer diffusion on active states only.
- **Don't** use centered "Welcome" text. Align to the left to establish a strong vertical rhythm.
- **Don't** use standard 1px dividers. If you need a break, use a `2px` height `surface-container-highest` bar that only spans 40% of the container width.```