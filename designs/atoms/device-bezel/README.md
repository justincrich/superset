# atom · device-bezel

The iPhone 16 Pro Max hardware shell that frames every mobile view. Renders the titanium bezel, glass viewport surface, Dynamic Island cutout, status bar chrome (time + signal/wifi/battery), and home indicator. Does NOT render any application content — that is the responsibility of the view layer dropped into the slot.

## Anatomy

```
.atom-device-bezel                           ← 444×962 outer titanium shell (aria-hidden)
  .atom-device-bezel__viewport               ← 430×932 glass viewport (--surface-page bg)
    .atom-device-bezel__dynamic-island       ← OLED-off pill, absolute positioned (aria-hidden)
    .atom-device-bezel__status-bar           ← 54px iOS status bar row (aria-hidden)
      .atom-device-bezel__time               ← "9:41" left-side time
      .atom-device-bezel__indicators         ← signal + wifi + battery icons, right side
        <svg> signal bars
        <svg> wifi
        .atom-device-bezel__battery          ← battery capsule (body + fill + nub)
          .atom-device-bezel__battery-body
            .atom-device-bezel__battery-fill
    <slot> .atom-device-bezel__content       ← consumer fills with view content
    .atom-device-bezel__home-indicator       ← 134×5 pill, absolute bottom-8 (aria-hidden)
```

**Slot convention (HTML):** The consumer places their view markup as a direct child of `.atom-device-bezel__viewport`, after the status bar. The `__content` class is a naming hint — it may be omitted if the consumer uses their own wrapper.

## Variants

| Class | Effect |
|---|---|
| `atom-device-bezel--default` | Full chrome: bezel + dynamic island + status bar + home indicator all visible. Use for all product views. |
| `atom-device-bezel--minimal` | Bezel + viewport surface only. Dynamic island, status bar, and home indicator are hidden. Use for design-showcase contexts where chrome competes with the content under review. |

## Modifiers

| Class | Effect |
|---|---|
| `atom-device-bezel--with-island-content` | Dynamic Island renders its default pill shape AND exposes an inner flex row for consumer-provided live-activity content (e.g., a `live-activity-dot` atom). Without this modifier the Dynamic Island pill is an opaque hardware cutout with no interior. |

## States

| State | Notes |
|---|---|
| `default` / `is-portrait` | Portrait orientation only. Landscape is out of scope for this PRD. |

## CSS skeleton

```css
/* --- Outer bezel -------------------------------------------- */
.atom-device-bezel {
  width: var(--device-width);            /* 444px */
  height: var(--device-height);          /* 962px */
  border-radius: var(--device-radius);   /* 60px */
  background: var(--device-bg);          /* linear-gradient(160deg, #1a1a1a 0%, #050505 100%) */
  padding: var(--device-bezel);          /* 7.5px */
  position: relative;
  box-shadow: var(--elevation-modal);
  flex-shrink: 0;
}

/* --- Viewport ----------------------------------------------- */
.atom-device-bezel__viewport {
  width: var(--viewport-width);          /* 430px */
  height: var(--viewport-height);        /* 932px */
  border-radius: var(--viewport-radius); /* 54px */
  background: var(--surface-page);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* --- Dynamic Island ----------------------------------------- */
.atom-device-bezel__dynamic-island {
  position: absolute;
  top: var(--dynamic-island-top);        /* 11px */
  left: 50%;
  transform: translateX(-50%);
  width: var(--dynamic-island-width);    /* 126px */
  height: var(--dynamic-island-height);  /* 37px */
  background: #000;   /* hardware exception — see note below */
  border-radius: var(--radius-pill);
  z-index: 30;
}

/* --- Status bar --------------------------------------------- */
.atom-device-bezel__status-bar {
  height: var(--status-bar-height);      /* 54px */
  padding: 18px 32px 0;                  /* iOS HIG exception — see note below */
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-meta);
  font-size: var(--font-size-label);
  color: var(--text-body);
  flex-shrink: 0;
  position: relative;
  z-index: 20;
}

/* --- Home indicator ----------------------------------------- */
.atom-device-bezel__home-indicator {
  position: absolute;
  bottom: 8px;                           /* iOS HIG exception — see note below */
  left: 50%;
  transform: translateX(-50%);
  width: var(--home-indicator-width);    /* 134px */
  height: var(--home-indicator-height);  /* 5px */
  background: var(--text-body);
  border-radius: var(--radius-pill);
  z-index: 30;
}
```

## Hardware-black exception

`background: #000` on `.atom-device-bezel__dynamic-island` is intentional and documented. The Dynamic Island is a physical OLED-off region on the iPhone 16 Pro Max display — it is literally black because those pixels are unpowered. It is never a semantic color and must not be replaced with a CSS variable. Same precedent as the `island-mockup` in `live-activity-dot.html`.

## iPhone hardware geometry exceptions

Three literal pixel values are iPhone-spec structural geometry, not design-system spacing tokens:

| Property | Value | Source |
|---|---|---|
| `status-bar` top padding | `18px` | Apple HIG — iPhone 16 Pro Max status bar safe-area inset |
| `status-bar` horizontal padding | `32px` | Apple HIG — iPhone 16 Pro Max horizontal chrome margin |
| `home-indicator` bottom offset | `8px` | Apple HIG — home indicator bottom clearance |

These values come from Apple's Human Interface Guidelines and match the physical display. They are not design system tokens and should not be tokenized unless Apple changes the spec.

## Token recipe

| Element | Property | Token | Dark resolved | Light resolved |
|---|---|---|---|---|
| Bezel | width | `--device-width` | 444px | 444px |
| Bezel | height | `--device-height` | 962px | 962px |
| Bezel | border-radius | `--device-radius` | 60px | 60px |
| Bezel | background | `--device-bg` | `linear-gradient(160deg, #1a1a1a 0%, #050505 100%)` | same (hardware material) |
| Bezel | padding | `--device-bezel` | 7.5px | 7.5px |
| Bezel | box-shadow | `--elevation-modal` | `0 30px 80px rgb(0 0 0 / 0.55), 0 12px 24px rgb(0 0 0 / 0.4)` | `0 30px 80px rgb(0 0 0 / 0.20), 0 12px 24px rgb(0 0 0 / 0.12)` |
| Viewport | width | `--viewport-width` | 430px | 430px |
| Viewport | height | `--viewport-height` | 932px | 932px |
| Viewport | border-radius | `--viewport-radius` | 54px | 54px |
| Viewport | background | `--surface-page` | `#151110` | `oklch(1 0 0)` |
| Dynamic Island | top | `--dynamic-island-top` | 11px | 11px |
| Dynamic Island | width | `--dynamic-island-width` | 126px | 126px |
| Dynamic Island | height | `--dynamic-island-height` | 37px | 37px |
| Dynamic Island | background | `#000` (hardware exception) | — | — |
| Dynamic Island | border-radius | `--radius-pill` | 999px | 999px |
| Status bar | height | `--status-bar-height` | 54px | 54px |
| Status bar | font-family | `--font-mono` | Geist Mono | Geist Mono |
| Status bar | font-weight | `--font-weight-meta` | 500 | 500 |
| Status bar | font-size | `--font-size-label` | 12px | 12px |
| Status bar | color | `--text-body` | `#eae8e6` | `oklch(0.145 0 0)` |
| Home indicator | width | `--home-indicator-width` | 134px | 134px |
| Home indicator | height | `--home-indicator-height` | 5px | 5px |
| Home indicator | background | `--text-body` | `#eae8e6` | `oklch(0.145 0 0)` |
| Home indicator | border-radius | `--radius-pill` | 999px | 999px |

**Theme behavior:** The bezel (`--device-bg`) is identical in both themes — it represents a physical hardware material. Only the viewport surface (`--surface-page`) responds to theme switching.

## Accessibility

The device bezel is purely decorative chrome. Semantic content lives entirely inside the slot (view content area).

| Element | Treatment |
|---|---|
| `.atom-device-bezel` | `aria-hidden="true"` — the entire bezel is decorative |
| `.atom-device-bezel__dynamic-island` | `aria-hidden="true"` — visual hardware cutout |
| `.atom-device-bezel__status-bar` | `aria-hidden="true"` — decorative chrome in design previews |
| `.atom-device-bezel__home-indicator` | `aria-hidden="true"` — decorative chrome |
| `.atom-device-bezel__content` (slot) | No aria suppression — this is where real semantic content lives |

In a production React Native app the device bezel component would not exist at all (the OS provides real chrome). This atom exists only for design previews and the chat-mobile design system documentation.
