# Patrol serviços landing page

This project serves the Patrol landing page and includes a Vercel serverless endpoint that sends contact form submissions using Resend.

## Production domain

The intended custom domain for this deployment is `servicos.patrolservicos.com.br`. Custom domains are configured in Vercel, not in the page source:

1. Import or deploy this repository as a Vercel project.
2. In the project, open **Settings → Domains** and add `servicos.patrolservicos.com.br`.
3. Configure the DNS record requested by Vercel with the domain's DNS provider.
4. In **Settings → Environment Variables**, set `RESEND_TO_EMAIL` to the same recipient used by the limpeza landing page.

## Setup

1. Install dependencies:

   npm install

2. Copy `.env.example` to `.env` and fill in your keys:

   cp .env.example .env

3. In Vercel project settings, add the same variables as environment variables.

## Environment variables

- `RESEND_API_KEY`
- `RESEND_TO_EMAIL` (use the same recipient configured for the limpeza landing page)
- `RESEND_FROM_EMAIL`

## Form behavior

The page submits to `/api/contact` and remains on the same page with a success message after the request succeeds.

## Local validation

Run:

```bash
npm install
npx vercel dev
```

Then open the local preview and submit the form.
