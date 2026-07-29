{
  "brand": {
    "name": "CineNexus",
    "attributes": [
      "cinematic",
      "premium",
      "content-first",
      "fast browsing",
      "trustworthy availability"
    ],
    "north_star": "Netflix-quality discovery: dark, quiet UI that makes posters + rails feel like the product; gradients only as cinematic accents (not as decoration everywhere)."
  },
  "design_tokens": {
    "notes": [
      "Current CSS uses purple-heavy glow + primary. For OTT we keep a Netflix-inspired red as primary and use cool-cyan as secondary accent for ‘availability’ and interactive focus. Avoid purple gradients per restriction rules; keep gradients mild and limited to hero/accents.",
      "Implement tokens in /app/frontend/src/index.css under :root and .dark. Keep HSL variables compatible with shadcn."
    ],
    "css_custom_properties": {
      "color": {
        "root_light": {
          "--background": "0 0% 100%",
          "--foreground": "222 47% 11%",
          "--card": "0 0% 100%",
          "--card-foreground": "222 47% 11%",
          "--popover": "0 0% 100%",
          "--popover-foreground": "222 47% 11%",
          "--primary": "356 86% 54%",
          "--primary-foreground": "0 0% 100%",
          "--secondary": "210 40% 96%",
          "--secondary-foreground": "222 47% 11%",
          "--muted": "210 40% 96%",
          "--muted-foreground": "215 16% 47%",
          "--accent": "191 92% 45%",
          "--accent-foreground": "0 0% 100%",
          "--destructive": "0 84% 60%",
          "--destructive-foreground": "0 0% 100%",
          "--border": "214 32% 91%",
          "--input": "214 32% 91%",
          "--ring": "191 92% 45%",
          "--radius": "0.95rem",
          "--shadow-color": "220 40% 2%",
          "--surface-1": "0 0% 100%",
          "--surface-2": "210 40% 98%",
          "--surface-3": "210 40% 96%"
        },
        "root_dark": {
          "--background": "225 30% 6%",
          "--foreground": "210 20% 96%",
          "--card": "225 26% 9%",
          "--card-foreground": "210 20% 96%",
          "--popover": "225 26% 9%",
          "--popover-foreground": "210 20% 96%",
          "--primary": "356 86% 54%",
          "--primary-foreground": "0 0% 100%",
          "--secondary": "225 22% 14%",
          "--secondary-foreground": "210 20% 96%",
          "--muted": "225 18% 16%",
          "--muted-foreground": "215 18% 72%",
          "--accent": "191 92% 45%",
          "--accent-foreground": "0 0% 100%",
          "--destructive": "0 84% 60%",
          "--destructive-foreground": "0 0% 100%",
          "--border": "225 16% 18%",
          "--input": "225 16% 18%",
          "--ring": "191 92% 45%",
          "--radius": "0.95rem",
          "--shadow-color": "220 40% 2%",
          "--surface-1": "225 30% 6%",
          "--surface-2": "225 26% 9%",
          "--surface-3": "225 22% 12%"
        },
        "semantic": {
          "--success": "152 62% 42%",
          "--warning": "38 92% 50%",
          "--info": "191 92% 45%",
          "--focus": "191 92% 45%"
        },
        "provider_badge_surfaces": {
          "netflix": "356 86% 54%",
          "prime": "199 92% 45%",
          "disney": "221 83% 60%",
          "hulu": "142 72% 45%",
          "hbo": "262 55% 62%",
          "appletv": "0 0% 96%"
        }
      },
      "typography": {
        "google_fonts_import": "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');",
        "font_pairing": {
          "headings": "Space Grotesk",
          "body": "Inter"
        },
        "scale": {
          "h1": "text-4xl sm:text-5xl lg:text-6xl",
          "h2": "text-base md:text-lg",
          "body": "text-sm md:text-base",
          "small": "text-xs md:text-sm"
        },
        "tracking": {
          "display": "tracking-[-0.02em]",
          "ui": "tracking-[-0.01em]",
          "meta": "tracking-[0.02em] uppercase"
        }
      },
      "spacing": {
        "system": "Use 4px base. Prefer 24–40px section padding on mobile, 56–80px on desktop.",
        "container": "max-w-7xl px-4 sm:px-6 lg:px-8",
        "rail_gutter": "gap-3 sm:gap-4",
        "card_radius": "rounded-[var(--radius)]",
        "poster_radius": "rounded-xl"
      },
      "shadows": {
        "elevation": {
          "card": "shadow-[0_10px_30px_hsl(var(--shadow-color)/0.45)]",
          "hover": "shadow-[0_18px_60px_hsl(var(--shadow-color)/0.55)]"
        },
        "glow": {
          "primary": "shadow-[0_0_0_1px_hsl(var(--primary)/0.25),0_0_24px_hsl(var(--primary)/0.18)]",
          "accent": "shadow-[0_0_0_1px_hsl(var(--accent)/0.25),0_0_24px_hsl(var(--accent)/0.16)]"
        }
      },
      "radius": {
        "sm": "rounded-md",
        "md": "rounded-lg",
        "lg": "rounded-xl",
        "xl": "rounded-2xl"
      }
    },
    "allowed_gradients": {
      "rule": "Gradients only for hero/section backgrounds and large cinematic cards; never on text-heavy reading areas; never exceed 20% viewport.",
      "presets": [
        {
          "name": "Cinematic Ember",
          "css": "radial-gradient(1200px circle at 20% 10%, rgba(239,68,68,0.18), transparent 55%), radial-gradient(900px circle at 80% 20%, rgba(34,211,238,0.12), transparent 60%)",
          "usage": "Home hero backdrop overlay only"
        },
        {
          "name": "Projector Spill",
          "css": "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          "usage": "Glass surfaces / cards (subtle)"
        }
      ]
    },
    "texture": {
      "noise_overlay": "Reuse existing .noise-overlay but reduce opacity to 0.04–0.06 on dark backgrounds.",
      "film_grain": "Optional: add a second subtle grain layer via CSS mask-image for hero only."
    }
  },
  "layout": {
    "grid": {
      "home": "Hero + multiple horizontal rails (ScrollArea). Each rail: title row + optional filter chips + horizontal poster list.",
      "browse_pages": "All Genres / All Languages: responsive grid (2 cols mobile, 3 tablet, 4–6 desktop).",
      "detail_pages": "Genre/Language detail: sticky filter bar + poster grid. Movie detail: split layout (poster left, meta right) on desktop; stacked on mobile."
    },
    "responsive_breakpoints": {
      "mobile_first": true,
      "patterns": [
        "Use horizontal rails with snap scrolling on mobile; switch to grid sections on desktop where appropriate.",
        "Keep primary CTA reachable: bottom sticky action row on mobile for ‘Open in Provider’."
      ]
    },
    "reading_flow": {
      "rule": "Left-aligned typography; avoid centered containers except for empty states and modals."
    }
  },
  "components": {
    "component_path": {
      "shadcn": {
        "Button": "/app/frontend/src/components/ui/button.jsx",
        "Card": "/app/frontend/src/components/ui/card.jsx",
        "Badge": "/app/frontend/src/components/ui/badge.jsx",
        "ScrollArea": "/app/frontend/src/components/ui/scroll-area.jsx",
        "Carousel": "/app/frontend/src/components/ui/carousel.jsx",
        "Skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
        "Tabs": "/app/frontend/src/components/ui/tabs.jsx",
        "Tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
        "Dialog": "/app/frontend/src/components/ui/dialog.jsx",
        "Sheet": "/app/frontend/src/components/ui/sheet.jsx",
        "Select": "/app/frontend/src/components/ui/select.jsx",
        "Pagination": "/app/frontend/src/components/ui/pagination.jsx",
        "Sonner": "/app/frontend/src/components/ui/sonner.jsx"
      },
      "recommended_new_components_js": {
        "CinematicCard": "/app/frontend/src/components/CinematicCard.js",
        "GenreCard": "/app/frontend/src/components/GenreCard.js",
        "LanguageCard": "/app/frontend/src/components/LanguageCard.js",
        "StudioCard": "/app/frontend/src/components/StudioCard.js",
        "ProviderBadge": "/app/frontend/src/components/ProviderBadge.js",
        "PosterImage": "/app/frontend/src/components/PosterImage.js",
        "Rail": "/app/frontend/src/components/Rail.js",
        "FilterBar": "/app/frontend/src/components/FilterBar.js"
      }
    },
    "card_system": {
      "language_cards": {
        "goal": "Replace globe SVGs with cinematic gradient cards that feel like ‘channels’.",
        "structure": [
          "Background: subtle gradient + noise overlay + vignette",
          "Top-left: language name (display)",
          "Bottom-left: movie count",
          "Right: small ‘chevron’ icon (lucide)"
        ],
        "tailwind": {
          "wrapper": "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
          "hover": "hover:border-white/15 hover:bg-white/[0.04]",
          "motion": "transition-colors duration-200",
          "overlay": "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "overlay_bg": "[background:radial-gradient(800px_circle_at_20%_20%,rgba(239,68,68,0.18),transparent_55%),radial-gradient(700px_circle_at_80%_30%,rgba(34,211,238,0.12),transparent_60%)]"
        },
        "micro_interactions": [
          "On hover: reveal overlay gradient + slight lift (translateY -2) ONLY on card container (no transition: all).",
          "On focus-visible: ring-2 ring-[hsl(var(--ring))] ring-offset-2 ring-offset-background."
        ],
        "data_testids": {
          "card": "language-card",
          "title": "language-card-title",
          "count": "language-card-count"
        }
      },
      "genre_cards": {
        "goal": "Replace emojis with professional gradient backgrounds + genre glyph (lucide icon) optional.",
        "visual": "Use a ‘posterless’ cinematic tile: gradient + subtle diagonal sheen + count badge.",
        "tailwind": {
          "wrapper": "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5",
          "sheen": "after:absolute after:inset-0 after:translate-x-[-60%] after:skew-x-[-20deg] after:bg-white/5 after:opacity-0 group-hover:after:opacity-100 group-hover:after:translate-x-[60%] after:transition-transform after:duration-700",
          "count_badge": "inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80"
        },
        "data_testids": {
          "card": "genre-card",
          "title": "genre-card-title",
          "count": "genre-card-count"
        }
      },
      "studio_network_cards": {
        "goal": "Show real Wikipedia CDN logos + studio name + count.",
        "logo_rules": [
          "Use Wikipedia/Wikimedia CDN SVG/PNG logos when available.",
          "Always provide fallback: first letter monogram in Avatar if logo fails.",
          "Logo container: fixed size, neutral surface, no gradients."
        ],
        "tailwind": {
          "wrapper": "group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.04] transition-colors duration-200",
          "logo_box": "grid h-12 w-12 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10",
          "logo_img": "h-7 w-7 object-contain [filter:grayscale(1)_contrast(1.1)_brightness(1.1)] group-hover:[filter:grayscale(0)_contrast(1.05)_brightness(1.05)] transition-[filter] duration-200"
        },
        "data_testids": {
          "card": "studio-card",
          "logo": "studio-card-logo",
          "title": "studio-card-title",
          "count": "studio-card-count"
        }
      },
      "movie_cards": {
        "goal": "Robust poster display with fallbacks; Netflix-like hover reveal.",
        "structure": [
          "Poster (AspectRatio 2/3)",
          "Hover overlay: title, year, rating, quick actions",
          "Fallback: skeleton + blurred backdrop + title initials"
        ],
        "tailwind": {
          "wrapper": "group relative",
          "poster_shell": "overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]",
          "poster_img": "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
          "overlay": "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          "meta": "p-3"
        },
        "fallback_rules": [
          "If TMDB poster missing: show a branded fallback with film-grain background + title.",
          "If image fails: swap to fallback and log once (avoid console spam).",
          "Use Skeleton while loading."
        ],
        "data_testids": {
          "card": "movie-card",
          "poster": "movie-card-poster",
          "title": "movie-card-title",
          "cta": "movie-card-open-details"
        }
      }
    },
    "where_to_watch": {
      "goal": "Enhanced provider display with logos and outbound links (JustWatch-like chips, premium).",
      "layout": {
        "desktop": "Two-column block: left = provider chips grouped by Stream/Rent/Buy; right = ‘Best option’ card with primary CTA.",
        "mobile": "Stacked: group tabs (Stream/Rent/Buy) using Tabs; chips wrap; sticky bottom CTA for selected provider."
      },
      "provider_badges": {
        "chip": {
          "tailwind": "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/90 hover:bg-white/[0.06] transition-colors duration-200",
          "logo": "h-5 w-5 rounded-sm object-contain",
          "price": "text-xs text-white/70"
        },
        "states": [
          "default: neutral surface",
          "hover: slightly brighter surface",
          "selected: ring-2 ring-[hsl(var(--ring))]",
          "disabled/unavailable: opacity-50 + cursor-not-allowed"
        ],
        "data_testids": {
          "section": "where-to-watch-section",
          "chip": "provider-chip",
          "outbound": "provider-outbound-link"
        }
      },
      "outbound_link_rules": [
        "Use <a target=\"_blank\" rel=\"noreferrer\"> for provider redirects.",
        "Show an external-link icon (lucide) and a short disclaimer: ‘Opens provider in a new tab’.",
        "Track click events later if analytics exists; for now keep UI ready."
      ]
    },
    "filters": {
      "genre_language_detail": {
        "pattern": "Sticky FilterBar with Select + ToggleGroup chips + search input.",
        "components": ["Select", "ToggleGroup", "Input", "Button"],
        "tailwind": {
          "bar": "sticky top-0 z-20 -mx-4 sm:mx-0 border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          "inner": "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        },
        "data_testids": {
          "bar": "filter-bar",
          "search": "filter-bar-search-input",
          "sort": "filter-bar-sort-select",
          "apply": "filter-bar-apply-button"
        }
      }
    }
  },
  "logos_and_assets": {
    "studio_network_logo_sources": {
      "rule": "Prefer Wikimedia (upload.wikimedia.org) assets. Store a mapping in code (studio/network name -> logo URL).",
      "examples": [
        {
          "name": "Netflix",
          "url": "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
        },
        {
          "name": "Amazon Prime Video",
          "url": "https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png"
        },
        {
          "name": "Disney+",
          "url": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg"
        },
        {
          "name": "HBO",
          "url": "https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg"
        },
        {
          "name": "Warner_Bros",
          "url": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Warner_Bros._%282023%29.svg"
        },
        {
          "name": "Universal",
          "url": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Universal_Pictures_logo.svg"
        }
      ],
      "fallback": "If no logo found: use Avatar with initials + neutral surface."
    }
  },
  "motion": {
    "library": {
      "recommended": "framer-motion",
      "install": "npm i framer-motion",
      "usage": [
        "Use for rail entrance (fade+slide), card hover lift, and poster overlay reveal.",
        "Respect reduced motion: disable transforms when prefers-reduced-motion is set."
      ]
    },
    "principles": [
      "Fast UI: durations 150–250ms for hover; 250–450ms for entrances.",
      "Use transition-[opacity,color,background-color,box-shadow,filter] (never transition-all).",
      "Hover lift: translateY(-2px) for tiles; posters scale 1.03 max.",
      "Scroll rails: snap + subtle momentum; show gradient edge fades to hint scroll."
    ]
  },
  "accessibility": {
    "wcag": "WCAG 2.1 AA",
    "requirements": [
      "All text must meet contrast; use text-white/90 on dark surfaces and avoid low-opacity text below /70 for body.",
      "Focus-visible rings on all interactive elements.",
      "Keyboard navigation for rails: left/right arrow support optional; at minimum tab order must be logical.",
      "Provide alt text for posters/logos; if decorative, alt=\"\".",
      "Respect prefers-reduced-motion."
    ]
  },
  "performance": {
    "poster_loading": [
      "Use loading=\"lazy\" for grid posters below the fold.",
      "Use responsive sizes and avoid huge images; prefer TMDB w342/w500 for grids.",
      "Use Skeleton placeholders to prevent layout shift."
    ],
    "rails": [
      "Virtualization optional for 3000–4000 movies; if needed later, consider react-window for grids.",
      "Avoid heavy shadows on hundreds of cards; keep shadows subtle and only on hover."
    ]
  },
  "image_urls": {
    "background_textures": [
      {
        "category": "hero_backdrop_optional",
        "description": "Dark film-grain texture for hero overlay (use with low opacity).",
        "url": "https://images.unsplash.com/photo-1662409750928-d2886ddbbd7d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBmaWxtJTIwZ3JhaW4lMjBkYXJrJTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fGJsYWNrfDE3NzU5NTE3Nzh8MA&ixlib=rb-4.1.0&q=85"
      }
    ],
    "cinematic_accents": [
      {
        "category": "hero_accent_blob",
        "description": "Red spotlight abstract for subtle hero accent (blur + opacity 0.12).",
        "url": "https://images.unsplash.com/photo-1646651024829-454814d2fb62?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwzfHxjaW5lbWF0aWMlMjBzcG90bGlnaHQlMjByZWQlMjBhYnN0cmFjdCUyMGdyYWRpZW50fGVufDB8fHxyZWR8MTc3NTk1MTc3OHww&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "section_accent_bokeh",
        "description": "Blue bokeh lights for a small decorative corner (not full background).",
        "url": "https://images.unsplash.com/photo-1597496610078-e85092480e1b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwYmx1ZSUyMGJva2VoJTIwbGlnaHRzJTIwY2luZW1hfGVufDB8fHxibHVlfDE3NzU5NTE3Nzh8MA&ixlib=rb-4.1.0&q=85"
      }
    ]
  },
  "instructions_to_main_agent": [
    "Update /app/frontend/src/index.css tokens to the provided red primary + cyan ring/accent; remove purple glow usage in App.css (glow-purple) and replace with primary/accent glows.",
    "Replace language/genre cards with new components (LanguageCard.js, GenreCard.js) using cinematic overlays + noise; no emojis, no globe SVG.",
    "Implement PosterImage.js with robust fallback: skeleton -> image -> fallback tile on error; use AspectRatio (2/3) and data-testid attributes.",
    "Implement ProviderBadge.js and WhereToWatch section: group providers by type (stream/rent/buy) using Tabs on mobile; chips with provider logos + outbound links.",
    "Create a studio/network logo map using Wikimedia URLs; render in StudioCard.js with graceful fallback Avatar.",
    "Use ScrollArea or Carousel for rails; add edge-fade overlays to hint horizontal scroll.",
    "Ensure every interactive element has data-testid in kebab-case (buttons, links, inputs, chips, cards).",
    "Add framer-motion for entrance animations and hover lift; respect prefers-reduced-motion.",
    "Do not touch AI Lab pipelines or backend AI logic."
  ],
  "general_ui_ux_design_guidelines": "    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
