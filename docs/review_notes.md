# Review Notes: Auth UI Guards & Store Alignment

This document outlines the visual layout structures and navigation checks verifying the client authentication guards.

## Visual Hierarchy & Styling Verification

### 1. Feed Item Comments Drawer
- **Unauthenticated View (`token === null`)**:
  - The drawer hides `<TextInput>` (formerly `comment-input`) and the `<TouchableOpacity>` submit button.
  - In its place, a styled CTA container (`styles.loginCtaContainer`) is rendered with a border-top matching `theme.border` and background of `theme.cardBg`.
  - It features:
    - An explanatory text label (`styles.loginCtaText`) using the `Inter_400Regular` font and `theme.textSecondary` color.
    - A primary CTA button (`styles.loginCtaButton`) using `theme.primary` as background and `theme.background` as text color, matching the standard visual button height of $38\text{px}$ and rounded $19\text{px}$ borders.
  - Clicking this CTA invokes `closeCommentsDrawer()` to close the drawer before navigating cleanly to the `AuthScreen` via `navigation.navigate('Auth')`.
- **Authenticated View (`token !== null`)**:
  - Standard input field and "Post" buttons remain fully accessible.

### 2. Book Detail Screen Reviews Card
- **Unauthenticated View (`token === null`)**:
  - Replaces the review input card entirely with a new login CTA card (`testID="login-cta-card"`).
  - Uses `styles.writeReviewCard` to maintain consistent page padding, borders (`theme.border`), and background colors (`theme.cardBg`).
  - Contains a subtitle ("Want to review this book?") in `Inter_600SemiBold` and secondary text in `Inter_400Regular`, centered and spaced at $16\text{px}$ above the action button.
  - Includes a full-width "Log In / Sign Up" button styled with the primary accent background color.
- **Authenticated View (`token !== null`)**:
  - The star rating interactive row and reviews textarea/submit button render normally.

### 3. Custom Upload Button (Feed Screen Header)
- Checks the authentication token immediately.
- If not logged in, clicking the button triggers `navigation.navigate('Auth')` instead of opening the custom upload form.

---

## Test Verification Summary

All 12 Jest test suites passed cleanly with **59 tests** verified.

| Test Suite | Total Tests | Status |
| :--- | :---: | :---: |
| `src/components/Feed.test.js` | 6 | **PASS** |
| `src/components/FeedItem.test.js` | 4 | **PASS** |
| `src/screens/AuthScreen.test.js` | 8 | **PASS** |
| `src/screens/OnboardingScreen.test.js` | 3 | **PASS** |
| `src/screens/CustomUploadScreen.test.js` | 5 | **PASS** |
| `src/store/feedStore.test.js` | 5 | **PASS** |
| `src/store/interactionStore.test.js` | 9 | **PASS** |
| `src/store/authStore.test.js` | 7 | **PASS** |
| `src/store/commentStore.test.js` | 4 | **PASS** |
| `src/store/reviewStore.test.js` | 4 | **PASS** |
| `src/store/customUploadStore.test.js` | 2 | **PASS** |
| `src/store/onboardingStore.test.js` | 2 | **PASS** |
| **Total** | **59** | **PASS** |
