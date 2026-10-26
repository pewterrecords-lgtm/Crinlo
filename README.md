# Crinlo Printify Customiser — starter MVP

This is a starter app for embedding a basic design editor into the Crinlo Shopify product page.

## Security first
The Printify token pasted into chat should be revoked/regenerated. Never place it in Liquid, HTML, JavaScript, a theme setting, or a public repository. Add the replacement token only to your hosting provider's server-side environment variables.

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Set `PRINTIFY_API_TOKEN` and `PRINTIFY_SHOP_ID` in `.env`.
4. Run `npm install` and `npm start`.
5. Open `http://localhost:3000`.

## Shopify embed
Upload `crinlo-product-printify-embed.liquid` to the theme's Sections directory and use it in place of the current matching product section only after taking a backup. In the theme editor, set the customiser URL to the deployed app URL. The Liquid section has an iframe slot for the hosted editor.

## Scope and known limitations
- Lists the first page (up to 50) of existing products from the configured Printify shop.
- Offers a simple text/image canvas and PNG upload to Printify's media library.
- This is a prototype, not a production order integration. It does not yet handle Shopify cart line-item personalization, final provider print templates, pricing/variant validation, checkout-to-Printify order submission, or webhooks.
- Printify product images may not permit canvas export due to cross-origin restrictions. The editor's separate transparent artwork export is the intended print file path.
- Before launch, add authentication/rate limiting, file validation, robust error handling, privacy controls and an order reconciliation process.
