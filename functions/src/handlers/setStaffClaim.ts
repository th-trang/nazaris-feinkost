import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";

const FUNCTION_OPTIONS = {
	region: "europe-west3",
	invoker: "public" as const,
};

export const setStaffClaim = onCall(FUNCTION_OPTIONS, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAdmin = request.auth.token.admin === true;
	if (!isAdmin) {
		throw new HttpsError(
			"permission-denied",
			"Only admins can manage staff claims.",
		);
	}

	const payload = request.data as {uid?: string; staff?: boolean} | undefined;
	const uid = (payload?.uid ?? "").trim();
	const staff = payload?.staff ?? true;

	if (!uid) {
		throw new HttpsError("invalid-argument", "uid is required.");
	}

	const auth = getAuth();
	const user = await auth.getUser(uid);
	const existingClaims = user.customClaims ?? {};
	const nextClaims: Record<string, unknown> = {...existingClaims};

	if (staff) {
		nextClaims.staff = true;
	} else {
		delete nextClaims.staff;
	}

	await auth.setCustomUserClaims(uid, nextClaims);

	const db = getFirestore();
	const userDoc = await auth.getUser(uid);
	await db
		.collection("users")
		.doc(uid)
		.set(
			{
				uid,
				type: "staff",
				email: userDoc.email ?? null,
				displayName: userDoc.displayName ?? null,
				isStaff: staff,
				isAdmin: userDoc.customClaims?.admin === true,
				updatedAt: FieldValue.serverTimestamp(),
				createdAt: FieldValue.serverTimestamp(),
			},
			{merge: true},
		);

	return {
		uid,
		staff,
	};
});
