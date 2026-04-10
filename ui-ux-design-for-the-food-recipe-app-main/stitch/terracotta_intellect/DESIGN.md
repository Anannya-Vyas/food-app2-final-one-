# Design System Strategy: Global Culinary Compass

## 1. Overview & Creative North Star: "The Digital Gastronome"
The Creative North Star for this design system is **"The Digital Gastronome."** We are not building a digital cookbook; we are crafting a high-performance instrument for cultural exploration. The aesthetic reconciles the precision of industrial-grade AI with the soul of earthy, artisanal traditions.

To move beyond a "template" look, we utilize a **Modern Bento Grid** characterized by intentional asymmetry. While the underlying logic is a 12-column grid, components should "break" the rhythm through overlapping imagery, varying aspect ratios, and high-contrast typography scales. The goal is an editorial layout that feels curated by a human hand, powered by a futuristic engine.

---

## 2. Colors & Atmospheric Tones
The palette is a dialogue between the warmth of the earth (`terracotta`) and the depth of the digital unknown (`indigo`).

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts or tonal transitions.
- Use `surface-container-low` for large section backgrounds.
- Place `surface-container-lowest` or `surface` elements on top to create definition.
- To separate content, rely on the `spacing-scale` (e.g., `8` or `10`) rather than a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `background` (#fcf9f6) or `surface`.
- **Primary Containers:** `surface-container` (#f0edea).
- **Interactive Tiles:** `surface-container-highest` (#e5e2df) for high-contrast bento cards.
- **Glassmorphism:** For floating AI-recommendation overlays, use `surface` at 60% opacity with a `24px` backdrop-blur.

### Signature Textures
Apply a subtle linear gradient to main Action Buttons and Hero Cards: 
*From `primary` (#a03f28) to `primary_container` (#c0573e) at a 135-degree angle.* This adds "soul" and depth, preventing the flat, "standard" look of basic hex fills.

---

## 3. Typography: Precision Meets Elegance
We utilize two high-performance sans-serifs to create a hierarchy of authority and utility.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and industrial feel. Use `display-lg` for recipe titles and `headline-md` for category headers. These should be set with tight tracking (-0.02em) to feel premium.
*   **Body & Titles (Plus Jakarta Sans):** Chosen for its high x-height and readability. Use `body-lg` for ingredient lists and instructions. 
*   **Labels (Manrope):** Use `label-md` in all-caps with increased letter spacing (+0.05em) for technical data (e.g., "PROTEIN CONTENT," "ORIGIN: OAXACA").

---

## 4. Elevation & Depth: Tonal Layering
We avoid the "card-on-shadow" trope. Depth is achieved through the **Layering Principle.**

*   **Tonal Stacking:** Place a `surface_container_lowest` card on a `surface_container_low` section. This creates a soft, natural lift that feels like fine paper.
*   **Ambient Shadows:** If an element must float (e.g., a "Quick-Add" FAB), use a shadow with a `40px` blur, `0px` offset, and `on_surface` color at 6% opacity. It should look like an atmospheric glow, not a drop shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline_variant` at **15% opacity**. Never use a 100% opaque border.
*   **Industrial Glass:** Apply a `1px` inner-stroke using `outline_variant` at 20% opacity to "glass" components to catch the light, mimicking the edge of a lens.

---

## 5. Components: The Bento Kit

### Bento Cards (The Signature Component)
- **Shape:** Use `xl` (1.5rem) or `lg` (1rem) corner radius.
- **Interaction:** On hover, a card should scale slightly (1.02x) and shift from `surface_container` to `surface_container_highest`. 
- **No Dividers:** Content within cards is separated by `spacing-4` (1.4rem) of negative space.

### Interactive Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`), `full` roundedness, white text (`on_primary`).
- **Secondary (The Indigo Variant):** `secondary` (#4c56af) background with `on_secondary` text. Used for "Discovery" or "Global" actions.
- **Tertiary:** No background. `primary` text with an underline that appears only on hover.

### Global Compass Chips
- Use `tertiary_fixed` (#ffddb4) for "Cultural Origin" tags and `secondary_fixed` (#e0e0ff) for "AI Insights."
- Shape: `md` (0.75rem).

### Inputs & Discovery Bars
- **Style:** `surface_container_lowest` fill. 
- **Active State:** Instead of a heavy border, the background shifts to `surface_bright` with a soft `primary` tinted ambient shadow.

### New Component: "The Flavor Spectrum"
A horizontal bar component using a gradient transition between `primary` (Spicy/Earthy) and `secondary` (Cool/Deep) to visualize the flavor profile of a recipe.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical spacing. If the left margin is `spacing-8`, the right margin for a bento element could be `spacing-4` to create visual tension.
- **Do** use `on_surface_variant` (#56423d) for secondary text to maintain the "Earthy" warmth.
- **Do** leverage micro-interactions (e.g., a recipe card’s image subtly zooms on hover).

### Don't
- **Don't** use black (#000000). Use `on_background` (#1c1c1a) for all high-contrast text.
- **Don't** use "default" Material Design shadows. They are too aggressive for this premium aesthetic.
- **Don't** use lines to separate list items. Use a background toggle between `surface` and `surface_container_low`.
- **Don't** use perfectly square corners. Every element should feel organic and handled, using the `Roundedness Scale`.