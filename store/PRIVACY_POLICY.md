# DevPulse Privacy Policy

**Last updated: February 13, 2026**

## Overview

DevPulse is a browser extension that displays real-time performance metrics as an overlay on web pages. This privacy policy explains how DevPulse handles your data.

## Data Collection

**DevPulse does not collect, transmit, or store any personal data.**

All performance metrics (FPS, DOM count, memory usage, Core Web Vitals, network statistics) are computed locally in your browser and displayed in the on-page HUD overlay. No data is sent to any server, third party, or remote endpoint.

## Data Storage

DevPulse stores the following data locally on your device using browser APIs:

- **HUD position and collapsed state** — stored in page localStorage to restore your layout preferences
- **Theme preference** — stored in page localStorage (dark, light, or system)
- **HUD active state** — stored in page localStorage for localhost persistence
- **Premium status** — stored in chrome.storage.local to cache your subscription state

This data never leaves your device and is only used to maintain your preferences across sessions.

## Third-Party Services

DevPulse uses **ExtensionPay** (extensionpay.com) to process premium upgrade payments. When you choose to upgrade, you interact with ExtensionPay's payment page, which is governed by their own privacy policy. DevPulse does not process or store any payment information.

## Permissions

DevPulse requests the following browser permissions:

- **activeTab** — to inject the performance HUD into the current tab when you click the toolbar icon
- **scripting** — to execute the HUD script on the active page
- **storage** — to save your premium subscription status

DevPulse does not use the `<all_urls>` permission and cannot access page content unless you explicitly activate it by clicking the toolbar icon.

The only exception is localhost and 127.0.0.1, where a content script runs automatically to support HUD persistence across page reloads during local development.

## Changes to This Policy

If this privacy policy is updated, the changes will be noted with a revised "Last updated" date at the top of this page.

## Contact

For questions about this privacy policy or the DevPulse extension, please contact us through the Chrome Web Store support page.
