---
name: neobrutalism-ui
description: Neobrutalism design system rules for this chat application — zero border-radius, 2px borders, box-shadow buttons, dark theme color palette
---

# Neobrutalism UI Standards

## Core Rules (never break)

1. **No border-radius** — `border-radius: 0` on ALL elements (buttons, inputs, avatars, modals, cards, images)
2. **2px solid borders** — `border: 2px solid #4f4e4e` on all elements
3. **Box-shadow on interactive elements**: `5px 5px 0px 0px #4f4e4e`
4. **Pressed animation**: element shifts right+down, shadow collapses
5. **No gradients** — flat solid fills only

## Color Palette

```
Primary (purple):  #ae7aff   — buttons, links, active states, own messages
Danger (red):      #ff4d4d   — delete, errors, leave actions
Border:            #4f4e4e   — all borders and shadows

Background layers (dark → light):
  Page:            #111111
  Card/Panel:      #1a1a1a
  Input/Deep:      #0f0f0f

Text:
  Primary:         #ffffff
  Muted:           #888888   — timestamps, placeholders, subtitles
```

## Button States

```css
/* Default */
border: 2px solid #4f4e4e;
box-shadow: 5px 5px 0px 0px #4f4e4e;

/* Hover */
box-shadow: 3px 3px 0px 0px #4f4e4e;
transform: translate(2px, 2px);

/* Active/Pressed */
box-shadow: none;
transform: translate(5px, 5px);

/* Disabled */
opacity: 0.5;
cursor: not-allowed;
/* no shadow, no transform */
```

## Utility Classes (defined in globals.css)

- `.neo-btn` — button with shadow + hover/press animation
- `.neo-card` — panel with dark bg + border
- `.neo-input` — input with dark bg + border + focus:border-primary
- `.neo-avatar` — square image with border (NO border-radius)
- `.neo-badge` — notification count badge

## Common Components

### Buttons
```jsx
{/* Primary */}
<button className="px-4 py-2 bg-[#ae7aff] text-white font-bold neo-btn">Send</button>

{/* Ghost */}
<button className="px-4 py-2 bg-transparent text-white border-2 border-[#4f4e4e] neo-btn">Cancel</button>

{/* Danger */}
<button className="px-4 py-2 bg-[#ff4d4d] text-white font-bold neo-btn">Delete</button>

{/* Icon only */}
<button className="p-2 bg-transparent border-2 border-[#4f4e4e] neo-btn"><Icon /></button>
```

### Inputs
```jsx
<input className="w-full neo-input px-4 py-2 text-sm" placeholder="..." />
<textarea className="w-full neo-input px-4 py-2 text-sm resize-none" />
```

### Cards / Modals
```jsx
<div className="neo-card p-4">...</div>
<div className="neo-card" style={{ boxShadow: '8px 8px 0px 0px #4f4e4e' }}>
  {/* Modal */}
</div>
```

### Active/Selected State
```jsx
{/* Sidebar active conversation */}
<div className={isActive
  ? 'border-l-4 border-l-[#ae7aff] bg-[#ae7aff]/20'
  : 'hover:bg-[#1a1a1a]'
}>
```

## Anti-Patterns

- ❌ Any `rounded-*` Tailwind class
- ❌ Any `border-radius` value other than 0
- ❌ Gradients or opacity overlays on backgrounds
- ❌ Soft shadows (blur > 0)
- ❌ Using white or light backgrounds
- ❌ Omitting border on any visible element
