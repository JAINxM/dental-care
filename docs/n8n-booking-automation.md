# n8n Booking Automation

This project now sends appointment events to n8n for:

- Email confirmation
- WhatsApp confirmation
- Google Calendar event creation
- Calendar event deletion when a booking is cancelled

## Backend Webhooks

Set the webhook URL from the site admin modal:

- Booking created: `config.n8nWebhookUrl`
- Booking cancelled: `config.n8nCancelWebhookUrl`

If `n8nCancelWebhookUrl` is blank, the backend sends both events to `n8nWebhookUrl`. In n8n, use the payload field `event` to route the workflow.

## Booking Created Payload

The backend sends:

```json
{
  "event": "appointment.created",
  "appointmentId": "DML-351281",
  "patientName": "Ananya Mehta",
  "patientPhone": "+919876543210",
  "patientEmail": "ananya@example.com",
  "service": "Acne & Scar Treatment",
  "rawDate": "2026-08-20",
  "time": "11:30 AM - 12:30 PM",
  "calendarEventId": "",
  "googleCalendar": {
    "summary": "DermaCare Luxe Clinic: Acne & Scar Treatment - Ananya Mehta",
    "startISO": "2026-08-20T11:30:00+05:30",
    "endISO": "2026-08-20T12:30:00+05:30",
    "timeZone": "Asia/Kolkata"
  },
  "whatsappMessageBody": "Hello Ananya Mehta..."
}
```

Recommended n8n nodes:

1. Webhook Trigger
2. IF or Switch node on `event`
3. Google Calendar `Create Event`
4. Email node using `patientEmail`
5. WhatsApp node/API request using `patientPhone` and `whatsappMessageBody`
6. Respond to Webhook with the created calendar id

The final n8n response should include one of these fields:

```json
{
  "calendarEventId": "google-calendar-event-id"
}
```

The backend automatically saves that id against the appointment. If your n8n flow cannot respond with the id, call this backend endpoint after creating the Google Calendar event:

```http
PATCH https://YOUR-ACTUAL-BACKEND-DOMAIN/api/appointments/DML-351281/calendar-event
Authorization: Bearer <N8N_BACKEND_TOKEN>
Content-Type: application/json

{
  "calendarEventId": "google-calendar-event-id"
}
```

Set `N8N_BACKEND_TOKEN` only on the Express backend environment. Do not add it to React, Vite, or any frontend environment variable. In n8n, configure the HTTP Request node with:

- Method: `PATCH`
- URL: `https://YOUR-ACTUAL-BACKEND-DOMAIN/api/appointments/{{$json.appointmentId}}/calendar-event`
- Authentication: none/manual header
- Header `Authorization`: `Bearer <N8N_BACKEND_TOKEN>`
- Header `Content-Type`: `application/json`
- Body type: JSON
- Body:

```json
{
  "calendarEventId": "={{$json.calendarEventId || $json.id || $json.eventId}}"
}
```

Replace `YOUR-ACTUAL-BACKEND-DOMAIN` with the public URL where the Express API is reachable. It must be the backend/API domain, not a frontend-only domain or a local `localhost` URL.

## Booking Cancelled Payload

When a customer, doctor, or admin cancels a booking, the backend sends:

```json
{
  "event": "appointment.cancelled",
  "appointmentId": "DML-351281",
  "status": "Cancelled",
  "cancelledBy": "customer",
  "calendarEventId": "google-calendar-event-id",
  "googleCalendar": {
    "eventId": "google-calendar-event-id"
  },
  "whatsappMessageBody": "Hello Ananya Mehta..."
}
```

Recommended cancellation nodes:

1. Webhook Trigger
2. IF or Switch node where `event` equals `appointment.cancelled`
3. Google Calendar `Delete Event` using `calendarEventId`
4. Email cancellation message
5. WhatsApp cancellation message
6. Respond to Webhook

## Backend Endpoints

- `POST /api/appointments` creates a booking and triggers `appointment.created`
- `PATCH /api/appointments/:id/cancel` marks a booking cancelled and triggers `appointment.cancelled`
- `DELETE /api/appointments/:id?cancelledBy=admin` deletes a booking and triggers `appointment.cancelled`
- `PATCH /api/appointments/:id/calendar-event` stores the Google Calendar event id
- `POST /api/n8n/test` sends a test booking payload
