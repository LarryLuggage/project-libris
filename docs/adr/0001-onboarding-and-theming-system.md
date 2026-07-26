# 1. Onboarding and Theme System in Mobile App

## Status
Accepted

## Context
Project LIBRIS aims to provide a premium, highly aesthetic "TikTok for Books" vertical infinite feed. The default UI used generic beige colors and plain text components, which did not meet the "Rich Aesthetics" design standard of modern, state-of-the-art apps. We also needed an onboarding mechanism to capture genre preferences and vibe choices to allow future feed personalization.

## Decision
We implemented a dynamic styling, font loading, and onboarding system with the following characteristics:
1. **Google Fonts Integration**: Loaded `Playfair Display` (serif for classic book feel) and `Inter` (sans-serif for interface UI elements) using `expo-font`.
2. **Visual Theme Dictionary**: Defined 4 color palettes (Classic Cream, Dark Obsidian, Midnight Blue, and Emerald Forest) with light/dark flags and primary/accent colors.
3. **Multi-Step Onboarding Wizard**: Built a step-by-step setup screen for choosing visual themes, favorite genres, and reading vibes. Onboarding is stored in Zustand (`onboardingStore.js`) and persisted using `AsyncStorage`.
4. **Onboarding Guard**: App navigation stack restricts access to the main feed and detail screens until onboarding completion.
5. **Feed & Details Overhaul**:
   - Double-tap gesture triggers a popping heart animation for liking.
   - Reading time estimates are calculated and displayed on excerpt cards.
   - A floating quick theme picker dropdown was added in the feed.
   - Excerpt detail screen redesigned with horizontal scroll preview cards.

## Consequences
* App size and loading times are slightly impacted by remote Google Font loading (mitigated by splash loader state).
* We have local user preference state available in Zustand, ready to be passed to backend recommendation engines in the next phase.
* All changes are fully covered by Jest unit and integration tests.
