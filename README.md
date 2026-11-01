# Hospital-Management

## Appointment payments

Appointment booking supports server-derived consultation fees, database-backed availability,
duplicate-slot protection, pay-at-hospital cash bookings, and Razorpay online payments with
backend signature verification and idempotent webhook handling.

Configure online payments in the backend environment without committing credentials:

```env
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Use Razorpay test credentials during development. Configure the webhook URL as
`https://your-backend-host/api/billing/webhook/razorpay` for `payment.captured` and
`order.paid` events. Browser callbacks alone never mark an invoice successful.