# FineDeal Price Drop Notification Feature

## Overview
The Price Drop Notification feature in FineDeal helps you track price reductions for specific products on Flipkart and Amazon. When enabled, you will receive a browser notification if the price of a product drops the next time you visit its page.

---

## How It Works

1. **Enable Notification**
   - Open the FineDeal extension popup while viewing a product page on Flipkart or Amazon.
   - Toggle the "Price Drop Notification" switch to enable notifications for that product.

2. **Tracking the Price**
   - FineDeal records the current price of the product when you visit the page.
   - The extension stores this price locally in your browser.

3. **Detecting a Price Drop**
   - On subsequent visits to the same product page, FineDeal checks the current price against the last recorded price.
   - If the price has dropped and you have enabled notifications for this product, a browser notification will be triggered.

4. **Notification Details**
   - The notification will show the product name and the price change (e.g., "Price dropped from ₹1,000 to ₹900").
   - You will only be notified once per price drop (to avoid spamming).

5. **Disabling Notification**
   - You can turn off notifications for any product at any time by toggling the switch off in the popup.

---

## Example Workflow

1. Visit a product page on Flipkart or Amazon.
2. Open the FineDeal popup and enable the Price Drop Notification toggle.
3. Leave the page. Later, revisit the same product page.
4. If the price is lower than before, you will receive a Chrome notification about the price drop.

---

## Notes
- Notifications are only available for Flipkart and Amazon product pages.
- All data is stored locally in your browser; no information is sent to external servers.
- You must keep the extension enabled and allow notifications in your browser settings.

---

## Troubleshooting
- If you do not receive notifications:
  - Ensure the toggle is enabled for the product.
  - Make sure Chrome notifications are allowed in your system settings.
  - Reload the extension after updates.

---

For more help, contact the FineDeal support team.
