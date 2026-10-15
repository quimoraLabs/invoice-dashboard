# API Reference & Service Integration
## Invomora — Serverless Endpoints & Client Service Layer

---

## 1. Serverless Endpoints (`/api/*`)

All serverless endpoints run on Node.js 20+ runtime on Vercel.

### 1.1 Create Firebase Custom Token
Mints a Firebase custom token containing `{ workspaceId, role }` claims from a validated Clerk JWT.

- **Endpoint:** `POST /api/create-firebase-token`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "token": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "firebaseToken": "eyJhbGciOiJ...",
    "workspaceId": "ws_12345",
    "role": "owner"
  }
  ```
- **Error Response (401 / 500):**
  ```json
  {
    "error": "Authentication failed",
    "message": "Invalid token"
  }
  ```

---

### 1.2 Accept Workspace Invitation
Verifies the workspace owner's 6-digit security PIN and enrolls the user as a workspace member.

- **Endpoint:** `POST /api/accept-invite`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <clerk_session_token>`
- **Request Body:**
  ```json
  {
    "inviteId": "inv_98765",
    "passcode": "842913",
    "displayName": "Jane Doe",
    "userEmail": "jane@example.com"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "workspaceId": "ws_12345",
    "workspaceName": "Acme Agency",
    "role": "accountant"
  }
  ```
- **Security Rejection Response (403 Forbidden):**
  ```json
  {
    "error": "Invalid passcode",
    "message": "The 6-digit security passcode entered does not match this workspace."
  }
  ```
  *(Note: An incorrect passcode also triggers an automatic security alert email to the workspace owner and writes an audit log in `activity_logs`.)*

---

### 1.3 Fetch Pending User Invitations
Retrieves all pending workspace invites addressed to the authenticated user's email.

- **Endpoint:** `GET /api/my-invites`
- **Headers:**
  - `Authorization: Bearer <clerk_session_token>`
- **Success Response (200 OK):**
  ```json
  {
    "invites": [
      {
        "id": "inv_98765",
        "workspaceId": "ws_12345",
        "workspaceName": "Acme Agency",
        "role": "accountant",
        "status": "pending",
        "createdAt": "2026-10-15T12:00:00Z"
      }
    ]
  }
  ```

---

### 1.4 Send Email Notifications & Security Alerts
Serverless Nodemailer service that dispatches invitation emails or instant security alerts.

- **Endpoint:** `POST /api/send-email`
- **Headers:** `Content-Type: application/json`
- **Request Body (Security Alert):**
  ```json
  {
    "type": "security_alert",
    "ownerEmail": "owner@acme.com",
    "workspaceName": "Acme Agency",
    "actorInfo": "Attendant / Desk Session",
    "details": "3 failed passcode attempts on standby lock screen"
  }
  ```
- **Request Body (Workspace Invite):**
  ```json
  {
    "type": "workspace_invite",
    "toEmail": "accountant@acme.com",
    "inviterName": "John Doe",
    "workspaceName": "Acme Agency",
    "passcode": "842913",
    "role": "accountant"
  }
  ```
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "messageId": "<xxxx@gmail.com>"
  }
  ```

---

## 2. Frontend Service Layer (`src/firebase/`)

All domain mutations consume the `scope` parameter `{ workspaceId, userId }`:

| Service Function | File | Description |
| :--- | :--- | :--- |
| `createInvoiceWithNumber(scope, data)` | `invoice.js` | Transactionally increments counter and creates invoice. |
| `updateInvoice(id, data, scope)` | `invoice.js` | Updates invoice and records activity audit log. |
| `deleteInvoice(id, scope)` | `invoice.js` | Deletes invoice and logs deletion event. |
| `createCustomer(data, scope)` | `customer.js` | Saves customer with duplicate email/phone check. |
| `createProduct(data, scope)` | `product.js` | Saves product item with GST tax rate. |
| `logActivity(entry)` | `activity.js` | Appends immutable record to `activity_logs`. |
| `createWorkspace(name, ownerUser)` | `workspace.js` | Atomically creates workspace & assigns owner role. |
| `regenerateWorkspacePasscode(id, actor)`| `workspace.js` | Generates a new 6-digit PIN and updates Firestore. |
