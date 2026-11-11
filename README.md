# Hospital Management System

## Project structure

- `frontend/`: React, TypeScript, and Vite frontend
- `backend/`: Express and Mongoose API
- `backend/src/`: routes, controllers, models, middleware, and services

## Local setup

### Backend

```powershell
cd backend
npm ci
copy .env.example .env
npm start
```

The backend listens on `http://localhost:5000` by default. Check
`http://localhost:5000/health` after configuring MongoDB and JWT variables.

### Frontend

```powershell
cd frontend
npm ci
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` in `frontend/.env` to the backend API URL ending in `/api`.

## Render deployment

This repository includes [render.yaml](./render.yaml) for a Render Blueprint
with one backend Web Service and one frontend Static Site.

The backend requires `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` in Render.
The frontend requires the public backend URL in `VITE_API_URL`, for example:

```text
VITE_API_URL=https://your-backend-service.onrender.com/api
```

Never commit `.env` files or production credentials. Use the Render dashboard
for secret values. The frontend Static Site uses an SPA rewrite to
`/index.html`, so refreshing nested React Router routes continues to work.

## Appointment payments

Appointment booking supports server-derived consultation fees, database-backed availability,
duplicate-slot protection, pay-at-hospital cash bookings, and Razorpay online payments with
backend signature verification and idempotent webhook handling.

Configure online payments in the backend environment without committing credentials:

```env
RAZORPAY_KEY_ID=<razorpay-test-key-id>
RAZORPAY_KEY_SECRET=<razorpay-test-key-secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay-webhook-secret>
```

Use Razorpay test credentials during development. Configure the webhook URL as
`https://your-backend-host/api/billing/webhook/razorpay` for `payment.captured` and
`order.paid` events. Browser callbacks alone never mark an invoice successful.
