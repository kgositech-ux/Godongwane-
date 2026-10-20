# Security Specification: Godongwane Progressive Projects

## 1. Data Invariants
- Admin users are explicitly identified by email in [`servicewebsites6@gmail.com`, `mthethwapraisegodcebolenkosi@gmail.com`] or via the `/admins/{uid}` collection.
- Unauthenticated requests are rejected (`request.auth != null`).
- Write operations enforce entity schema validity: string sizes, regex patterns, valid enums, and required keys.
- Clients, Projects, Tasks, Milestones, Documents, Employees, Invoices cannot be modified by unauthenticated users.
- Tasks reference valid project IDs.
- Sensitive user records are protected: users can only modify their own profile data, and cannot self-escalate role without admin verification.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Unauthenticated Read**: Attempt to read `/projects` with `auth: null` -> `PERMISSION_DENIED`
2. **Unauthenticated Write**: Attempt to create `/clients` with `auth: null` -> `PERMISSION_DENIED`
3. **Role Escalation**: Regular user writes `role: "admin"` to `/users/{uid}` -> `PERMISSION_DENIED`
4. **Oversized String / DoW Attack**: Client payload containing 2MB string in `name` -> `PERMISSION_DENIED`
5. **ID Poisoning**: Writing to document ID with path traversal `../../bad` or invalid characters -> `PERMISSION_DENIED`
6. **Unknown Fields (Ghost Field)**: Project payload with `{ ghostSecret: true }` -> `PERMISSION_DENIED`
7. **Invalid Enum**: Task payload with `status: "hacked_status"` -> `PERMISSION_DENIED`
8. **Negative Hours**: Task payload with `actualHours: -50` -> `PERMISSION_DENIED`
9. **Orphaned Sub-Resource**: Task created with empty or missing `projectId` -> `PERMISSION_DENIED`
10. **Admin Bypass**: Non-admin user attempting to delete `/clients/{id}` -> `PERMISSION_DENIED`
11. **Impersonated Author**: User UID `user123` attempting to set `uploadedBy: "user456"` on `/documents/{id}` -> `PERMISSION_DENIED`
12. **Malformed Invoice**: Invoice payload without required `invoiceNumber` or with negative `amount` -> `PERMISSION_DENIED`
