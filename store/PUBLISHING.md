# DevPulse — Chrome Web Store Publishing Guide

## Prerequisites

- [ ] Google Developer account ($5 one-time fee) — https://chrome.google.com/webstore/devconsole
- [ ] ExtensionPay account with `devpulse` extension ID configured — https://extensionpay.com
- [ ] Privacy policy hosted at a public URL (see PRIVACY_POLICY.md)

## Build the Extension

```bash
cd devpulse
npm install
npm run build
npm run zip    # creates devpulse.zip in project root
```

The `devpulse.zip` file in the project root is what you upload to the Chrome Web Store.

## Store Listing Setup

### Basic Information
- **Name**: DevPulse — Performance HUD for Developers
- **Summary**: Real-time performance overlay for web developers. Monitor FPS, DOM nodes, memory, CLS, and Core Web Vitals — right on the page.
- **Description**: See STORE_LISTING.md for full copy
- **Category**: Developer Tools
- **Language**: English

### Graphics (in store_assets/)
| Asset | File | Required |
|-------|------|----------|
| Extension icon | `icons/icon128.png` | Yes (auto from manifest) |
| Small promo tile | `promo_small_440x280.png` | Recommended |
| Marquee promo | `promo_marquee_1400x560.png` | Optional |
| Screenshot (dark) | `screenshot_1280x800.png` | Yes (min 1 required) |
| Screenshot (light) | `screenshot_light_1280x800.png` | Recommended |

### Privacy
- **Single purpose**: Display real-time web performance metrics as an on-page overlay
- **Privacy policy URL**: Host PRIVACY_POLICY.md as a web page (GitHub Pages, Notion, etc.)
- **Permissions justification**:
  - `activeTab` — Inject HUD overlay into the current tab on user click
  - `scripting` — Execute the performance monitoring content script
  - `storage` — Cache premium subscription status locally
- **Host permissions**:
  - `extensionpay.com` — Required for premium payment processing
- **Data usage**: Does not collect or transmit any user data
- **Remote code**: No — all code is bundled in the extension

### Distribution
- **Visibility**: Public
- **Regions**: All regions
- **Pricing**: Free (premium features via ExtensionPay in-app purchase, $2.99 lifetime)

## ExtensionPay Setup

1. Go to https://extensionpay.com/dashboard
2. Create extension with ID `devpulse`
3. Set price to $2.99 (one-time)
4. After Chrome Web Store approval, update the extension ID in ExtensionPay to match the assigned CWS extension ID

## Post-Publish

- [ ] Verify installation from Chrome Web Store
- [ ] Test free metrics on a regular page
- [ ] Test icon toggle (open/close/reopen)
- [ ] Test localhost persistence
- [ ] Test premium upgrade flow via ExtensionPay
- [ ] Test theme switching (dark/light/system)
- [ ] Test on a few popular sites (GitHub, Stack Overflow, etc.)

## Version Bumping

Update `version` in `public/manifest.json` before each new upload:
```
"version": "1.0.1"
```

Chrome Web Store requires incrementing versions. Use semver: patch for fixes, minor for features.
