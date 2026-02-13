# DevPulse — QA Checklist

## Injection & Toggle

- [ ] Click icon on regular page → HUD appears
- [ ] Click icon again → HUD disappears
- [ ] Click icon third time → HUD reappears (no console errors)
- [ ] Click X button on HUD → HUD disappears
- [ ] Click icon after X close → HUD reappears
- [ ] Click icon on `chrome://` page → fails gracefully (no crash)

## Localhost Persistence

- [ ] Open `localhost:*` → click icon → HUD appears
- [ ] Reload page → HUD auto-restores
- [ ] Close HUD via X → reload → HUD does NOT restore
- [ ] Open HUD → reload → click icon → toggles off (no duplicate declaration error)
- [ ] Open HUD on localhost → navigate to different localhost route → HUD restores

## Non-Localhost Behavior

- [ ] Open HUD on regular site → reload page → HUD is gone (expected)
- [ ] After reload, click icon → HUD appears normally

## Metrics (Free)

- [ ] FPS shows and updates every second
- [ ] FPS sparkline renders with ≥2 data points
- [ ] DOM count shows and updates
- [ ] DOM sparkline renders
- [ ] FPS color: green (≥45), yellow (30-44), red (<30)
- [ ] DOM color: green (<1500), yellow (1500-2999), red (≥3000)

## Metrics (Premium / Locked)

- [ ] MEM row shows `••••` + PRO badge when not premium
- [ ] CLS row shows `••••` + PRO badge
- [ ] LONG row shows `••••` + PRO badge
- [ ] NET row shows `••••` + PRO badge
- [ ] FCP vital shows PRO badge
- [ ] LCP vital shows PRO badge
- [ ] Clicking PRO badge → triggers `openPayment` message (check BG console)
- [ ] Export button when not premium → triggers `openPayment`

## Metrics (Premium / Unlocked)

- [ ] Set `isPremium: true` manually in storage → reopen HUD
- [ ] MEM shows MB value + sparkline
- [ ] CLS shows decimal value
- [ ] LONG shows count + red `+N` badge for recent tasks
- [ ] NET shows request count + transfer size
- [ ] FCP shows ms/s value with color coding
- [ ] LCP shows ms/s value with color coding
- [ ] Export button downloads JSON file
- [ ] JSON contains all metrics + history arrays

## Collapse / Expand

- [ ] Click collapse button → body hidden, mini bar shows FPS · DOM · MEM
- [ ] Click collapsed bar → expands back
- [ ] Mini bar values update in real-time
- [ ] Mini bar colors match threshold status

## Drag

- [ ] Drag header → HUD moves
- [ ] Drag near edges → doesn't go offscreen
- [ ] Clicking buttons in header does NOT initiate drag
- [ ] Position persists while HUD is open (not across sessions)

## Uptime

- [ ] Footer shows `Page: Xm Xs` and increments

## Shadow DOM Isolation

- [ ] HUD styles don't leak into host page
- [ ] Host page styles don't affect HUD
- [ ] Page with aggressive CSS reset → HUD renders correctly

## ExtPay Integration

- [ ] BG console: ExtPay initializes without error
- [ ] Payment flow opens when PRO badge clicked
- [ ] After payment, reopen HUD → premium metrics visible

## Edge Cases

- [ ] Multiple tabs with HUD open simultaneously
- [ ] Close tab with HUD open → no background errors
- [ ] Extension update/reload → localStorage flag cleared on next localhost visit
- [ ] Page with heavy DOM (>3000 nodes) → DOM counter turns red
- [ ] `performance.memory` unavailable (Firefox) → MEM row hidden gracefully
