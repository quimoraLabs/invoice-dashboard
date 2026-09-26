# 33. Firebase Storage Specification

---

## 1. Bucket Directory Structure

```
gs://invoice-dashboard.appspot.com/
└── users/
    └── {userId}/
        ├── branding/
        │   └── logo.png              # Business logo image
        ├── signatures/
        │   └── signature.png         # Digital signature image
        └── invoices/
            └── {invoiceId}.pdf       # Sent/Archived invoice PDF copies
```

---

## 2. File Constraints & Validation Rules

| Asset Type | Allowed MIME Types | Max File Size | Target Aspect Ratio / Dimensions |
| :--- | :--- | :---: | :--- |
| **Company Logo** | `image/png`, `image/jpeg`, `image/webp` | 2 MB | 1:1 or 4:3 (Recommended 400x400 px) |
| **Digital Signature** | `image/png`, `image/svg+xml` | 1 MB | 3:1 (Recommended 600x200 px, Transparent BG) |
| **Invoice Attachments** | `application/pdf`, `image/png` | 5 MB | Standard A4 Document |

---

## 3. Storage Security Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function checking auth
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function checking ownership
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // User asset storage rules
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId)
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/(png|jpeg|webp|svg\\+xml)|application/pdf');
    }
  }
}
```

---

## 4. Image Upload & Compression Flow
1. User selects image in `ImageUploader.jsx`.
2. Client-side canvas utility compresses image to maximum width 800px.
3. Image converted to WebP/PNG blob stream.
4. Uploaded via `uploadBytesResumable` from Firebase Storage SDK.
5. Storage `downloadURL` generated and persisted to Firestore `business_profiles` document.
