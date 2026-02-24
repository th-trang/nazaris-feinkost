# Nazaris Feinkost

## Local development

Run the frontend:

```bash
npm install
npm run dev
```

Run Cloud Functions locally:

```bash
cd functions
npm install
npm run build
```

## Firebase Phase 1 (orders + staff auth)

### 1) Frontend environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=europe-west3
```

### 2) Deploy Firebase config

From project root:

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```

### 3) Grant staff role

`setStaffClaim` is an admin-only callable function. The caller must have `admin: true` custom claim.

Example payload:

```json
{
	"uid": "STAFF_USER_UID",
	"staff": true
}
```

### 4) What Phase 1 includes

- `createOrder` callable Cloud Function with server-side validation
- Firestore order persistence (`orders` collection)
- locked-down Firestore rules for orders/users/meta
- staff claim helper utilities on the frontend
