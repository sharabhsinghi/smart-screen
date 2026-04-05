# Smart Screen

A **Smart Display** Android app for tablets built with **Next.js** (App Router), **Tailwind CSS**, and **Capacitor**. Designed to look and feel like a dedicated display device rather than a regular app — perfect for a tablet on charge.

## Screenshots

### Main Display
![Smart Display Main View](https://github.com/user-attachments/assets/5cf4c6be-c8c5-4d11-b2c6-8fd093d65d74)

### Edit Mode
![Smart Display Edit Mode](https://github.com/user-attachments/assets/ca495120-e630-48a6-9d6d-b2ba1d65a2e2)

## Features

### Widgets
| Widget | Description |
|--------|-------------|
| 🕐 **Clock** | Live digital clock (HH:mm:ss) with full date display. Updates every second. |
| 🌤 **Weather** | Current conditions from OpenWeatherMap for Barrie, ON. Refreshes every 15 minutes. |
| 📅 **Tasks** | Today's task list with check-off, add new tasks, and pending count. |
| 🏠 **Smart Home** | 6-button grid to toggle smart lights/devices via Home Assistant REST API. |

### Display
- **Background Slideshow** — Cycles through 5 nature images with a smooth 2-second cross-fade (Framer Motion). Falls back to gradient backgrounds if images fail to load.
- **Glassmorphism Overlay** — `backdrop-blur-md` frosted glass panels for all widgets.
- **Landscape Grid** — 4-column, 3-row grid layout optimised for tablet landscape orientation.

### Edit Mode
- **Add / Remove widgets** — Slide-in panel with a catalog of available widgets.
- **Resize widgets** — Three sizes: Small (1×1), Medium (2×1), Large (2×2).
- Toggle edit mode with the ⚙ **Edit** / ✓ **Done** button.

### Android / Capacitor
- Full-screen **immersive mode** — status bar and navigation bar hidden via `@capacitor/status-bar` and `@capgo/capacitor-navigation-bar`.
- **Screen stays on** — `@capacitor-community/keep-awake` prevents the display from sleeping while charging.
- Configured for static export (`next build` → `out/`) ready for `npx cap sync android`.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in your keys:
```bash
cp .env.local.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | Free API key from [openweathermap.org](https://openweathermap.org/api) |
| `NEXT_PUBLIC_HA_URL` | Home Assistant base URL, e.g. `http://homeassistant.local:8123` |
| `NEXT_PUBLIC_HA_TOKEN` | Home Assistant long-lived access token |

### 3. Run in development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in a browser at 1280×800 (landscape).

### 4. Build for Android
```bash
# Build static export and sync to Capacitor Android project
npm run build:android
```
This runs `next build` → `npx cap sync android` → opens Android Studio.

> **First time?** Initialize the Android project first:
> ```bash
> npx cap add android
> npm run build:android
> ```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout (viewport meta, full-screen body)
│   ├── page.tsx           # Main Smart Display page
│   └── globals.css        # Global styles (scrollbar hide, touch optimisations)
├── components/
│   ├── BackgroundSlideshow.tsx  # Framer Motion cross-fade slideshow
│   ├── WidgetWrapper.tsx        # Glassmorphism panel + edit mode controls
│   ├── EditModePanel.tsx        # Slide-in panel for add/remove widgets
│   └── widgets/
│       ├── ClockWidget.tsx      # Digital clock + date
│       ├── WeatherWidget.tsx    # OpenWeatherMap widget
│       ├── CalendarWidget.tsx   # Today's tasks checklist
│       └── SmartHomeWidget.tsx  # Smart light toggle grid
├── hooks/
│   ├── useClock.ts        # 1-second interval clock hook
│   └── useWeather.ts      # 15-minute weather refresh hook
└── types/
    └── index.ts           # Shared TypeScript types

capacitor.config.ts        # Capacitor Android configuration
```

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** — App Router, static export
- **[Tailwind CSS v4](https://tailwindcss.com/)** — Utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** — Background slideshow transitions
- **[Lucide React](https://lucide.dev/)** — Icons
- **[Capacitor](https://capacitorjs.com/)** — Native Android wrapper
- **[@capacitor/status-bar](https://capacitorjs.com/docs/apis/status-bar)** — Hide system status bar
- **[@capgo/capacitor-navigation-bar](https://www.npmjs.com/package/@capgo/capacitor-navigation-bar)** — Transparent navigation bar
- **[@capacitor-community/keep-awake](https://github.com/capacitor-community/keep-awake)** — Prevent screen sleep
