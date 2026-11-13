# Authentication and authorisation

OM PVRD has two kinds of sign-in. Catalogue accounts use the public site. Administrators use a separate panel. They do not share a password table or a session cookie.

## Roles

| Who | How they join | What they can do |
| --- | --- | --- |
| Retailer | Signs up, then signs in | Browse the catalogue and keep a profile. Inquiries, loyalty, and catalogue downloads are allowed only while the account is active. |
| Carpenter / Contractor | Signs up as `pending` | Same as a retailer after an administrator approves the account. Until then the account cannot sign in. |
| Consumer | Signs up, then signs in | Browse the catalogue and keep a profile. Reviews of contractors are a consumer feature when that module is built. |
| Administrator | Created in the `admins` table, not by public signup | Opens `/login/admin`, manages the catalogue, and approves, deactivates, blocks, or deletes catalogue accounts. |

The public catalogue stays open without an account. Signing in does not yet unlock a separate trade-price list.

## Sign up

`/signup` asks for full name, mobile, email (optional), city, account type, password, and an optional photo.

- Mobile is stored as a 10-digit Indian number and must be unique.
- Email, when provided, must be unique.
- Password is at least 8 characters and is stored as a salted scrypt hash.
- Retailers and consumers are `active` and are signed in.
- Contractors are `pending`. They see a message that an administrator must approve them.

Photos go to `users/{userId}/{imageId}.ext` in the image bucket. The account stores the public URL and the object key.

## Sign in

`/login` accepts the mobile number or email plus the password.

| Status | Result |
| --- | --- |
| `active` | A 7-day session is created and last sign-in is recorded. |
| `pending` | Refused. The account is waiting for approval. |
| `inactive` | Refused. The account is deactivated. |
| `blocked` | Refused. The block reason is kept for the administrator. |

The session cookie is `pvrd_user`. It is HTTP-only. The database stores only a hash of the token in `user_sessions`.

`/account` shows the profile from the requirements: photo, name, mobile, email, type, city, registration date, last sign-in, and status. The person can change name, email, city, photo, and password. Mobile and account type stay fixed.

## What an administrator controls

On **Users** in the admin panel:

- **Approve** or **Activate** sets the account to `active`.
- **Deactivate** sets it to `inactive` and ends its sessions.
- **Block** requires a reason, sets `blocked`, stores the reason, and ends its sessions.
- **Delete** removes the account and its profile photo.

A blocked, inactive, or pending account cannot sign in. The same rule applies to inquiries, loyalty points, and catalogue downloads: those actions require an `active` catalogue session when those modules are built.

## Where the code lives

- `web/lib/db/schema.ts` — `users` and `user_sessions`
- `web/lib/auth/session.ts` — catalogue and administrator cookies
- `web/lib/auth/access.ts` — role labels and sign-in refusals
- `web/lib/actions/account.ts` — signup, sign-in, profile, sign-out
- `web/lib/actions/users.ts` — administrator approval, block, and delete
- `web/app/login`, `web/app/signup`, `web/app/account` — public screens
- `web/app/login/admin` — administrator screen
