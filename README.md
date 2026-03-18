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
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
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


## Firebase Firestore data model (Phase 2)

The backend now writes and maintains these collections:

- `orders`
	- `orderNumber`, `status`, `customerUid`, `customerUserId`
	- customer fields: `customerName`, `customerEmail`, `customerPhone`
	- pickup fields: `pickupDate`, `pickupLocation`, `pickupLocationId`
	- payment fields: `paymentStatus`, `payment.method`, `payment.status`
	- line items: `items[]` with `id`, `name`, `quantity`, `unitPrice`
	- timestamps: `createdAt`, `updatedAt`
- `users`
	- customer/staff profile data
	- role/type fields (`type`, `isStaff`, `isAdmin` where relevant)
	- timestamps such as `updatedAt`, `lastOrderAt`
- `locations`
	- market metadata (`name`, `address`, `city`, `hours`, `openDays`)
	- flags: `active`, `sortOrder`
	- timestamps: `createdAt`, `updatedAt`

### Sync location catalog to Firestore

`syncLocationsCatalog` callable function was added in `functions/src/index.ts`.

Run from your client app (logged in as staff/admin) once after deployment to create/update `locations` documents.

### Deploy rules/indexes/functions

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions
```
