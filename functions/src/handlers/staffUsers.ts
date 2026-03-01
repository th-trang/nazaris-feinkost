import {getAuth} from "firebase-admin/auth";
import {HttpsError, onCall} from "firebase-functions/v2/https";

const FUNCTION_OPTIONS = {
	region: "europe-west3",
	invoker: "public" as const,
};

interface StaffUserResponse {
	uid: string;
	email: string;
	displayName: string | null;
	isAdmin: boolean;
	isStaff: boolean;
	createdAt: string | null;
}

/**
 * List all staff users (users with staff or admin claims).
 * Only admins can call this function.
 */
export const listStaffUsers = onCall(FUNCTION_OPTIONS, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAdmin = request.auth.token.admin === true;
	if (!isAdmin) {
		throw new HttpsError(
			"permission-denied",
			"Only admins can view staff users.",
		);
	}

	const auth = getAuth();
	const staffUsers: StaffUserResponse[] = [];

	// Firebase Auth doesn't support querying by custom claims, so we need to list all users
	// and filter client-side. For small user bases this is acceptable.
	let nextPageToken: string | undefined;

	do {
		const listResult = await auth.listUsers(1000, nextPageToken);

		for (const user of listResult.users) {
			const claims = user.customClaims ?? {};
			if (claims.staff === true || claims.admin === true) {
				staffUsers.push({
					uid: user.uid,
					email: user.email ?? "",
					displayName: user.displayName ?? null,
					isAdmin: claims.admin === true,
					isStaff: claims.staff === true,
					createdAt: user.metadata.creationTime ?? null,
				});
			}
		}

		nextPageToken = listResult.pageToken;
	} while (nextPageToken);

	return {users: staffUsers};
});

interface CreateStaffUserPayload {
	email: string;
	password: string;
	displayName?: string;
	isAdmin?: boolean;
}

/**
 * Create a new staff user with email/password.
 * Only admins can call this function.
 */
export const createStaffUser = onCall(FUNCTION_OPTIONS, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAdmin = request.auth.token.admin === true;
	if (!isAdmin) {
		throw new HttpsError(
			"permission-denied",
			"Only admins can create staff users.",
		);
	}

	const payload = request.data as CreateStaffUserPayload | undefined;

	if (!payload?.email || !payload?.password) {
		throw new HttpsError(
			"invalid-argument",
			"Email and password are required.",
		);
	}

	const email = payload.email.trim();
	const password = payload.password;
	const displayName = payload.displayName?.trim() || null;
	const makeAdmin = payload.isAdmin === true;

	if (password.length < 6) {
		throw new HttpsError(
			"invalid-argument",
			"Password must be at least 6 characters.",
		);
	}

	const auth = getAuth();

	// Create the user
	const newUser = await auth.createUser({
		email,
		password,
		displayName,
	});

	// Set custom claims
	const claims: Record<string, boolean> = {staff: true};
	if (makeAdmin) {
		claims.admin = true;
	}
	await auth.setCustomUserClaims(newUser.uid, claims);

	return {
		uid: newUser.uid,
		email: newUser.email,
		displayName: newUser.displayName,
		isAdmin: makeAdmin,
		isStaff: true,
	};
});

interface UpdateStaffUserPayload {
	uid: string;
	displayName?: string;
	email?: string;
	isAdmin?: boolean;
	isStaff?: boolean;
}

/**
 * Update a staff user's profile or claims.
 * Only admins can call this function.
 */
export const updateStaffUser = onCall(FUNCTION_OPTIONS, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAdmin = request.auth.token.admin === true;
	if (!isAdmin) {
		throw new HttpsError(
			"permission-denied",
			"Only admins can update staff users.",
		);
	}

	const payload = request.data as UpdateStaffUserPayload | undefined;

	if (!payload?.uid) {
		throw new HttpsError("invalid-argument", "User uid is required.");
	}

	const auth = getAuth();
	const user = await auth.getUser(payload.uid);

	// Update profile if provided
	const profileUpdates: {displayName?: string; email?: string} = {};
	if (payload.displayName !== undefined) {
		profileUpdates.displayName = payload.displayName.trim() || undefined;
	}
	if (payload.email !== undefined) {
		profileUpdates.email = payload.email.trim();
	}

	if (Object.keys(profileUpdates).length > 0) {
		await auth.updateUser(payload.uid, profileUpdates);
	}

	// Update claims if provided
	if (payload.isAdmin !== undefined || payload.isStaff !== undefined) {
		const existingClaims = user.customClaims ?? {};
		const newClaims: Record<string, boolean> = {};

		// Handle staff claim
		if (payload.isStaff !== undefined) {
			if (payload.isStaff) {
				newClaims.staff = true;
			}
			// If isStaff is false, we don't include it (effectively removing it)
		} else if (existingClaims.staff) {
			newClaims.staff = true;
		}

		// Handle admin claim
		if (payload.isAdmin !== undefined) {
			if (payload.isAdmin) {
				newClaims.admin = true;
			}
		} else if (existingClaims.admin) {
			newClaims.admin = true;
		}

		await auth.setCustomUserClaims(payload.uid, newClaims);
	}

	// Fetch updated user
	const updatedUser = await auth.getUser(payload.uid);
	const updatedClaims = updatedUser.customClaims ?? {};

	return {
		uid: updatedUser.uid,
		email: updatedUser.email,
		displayName: updatedUser.displayName,
		isAdmin: updatedClaims.admin === true,
		isStaff: updatedClaims.staff === true,
	};
});

/**
 * Delete a staff user.
 * Only admins can call this function.
 * Admins cannot delete themselves.
 */
export const deleteStaffUser = onCall(FUNCTION_OPTIONS, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAdmin = request.auth.token.admin === true;
	if (!isAdmin) {
		throw new HttpsError(
			"permission-denied",
			"Only admins can delete staff users.",
		);
	}

	const payload = request.data as {uid?: string} | undefined;

	if (!payload?.uid) {
		throw new HttpsError("invalid-argument", "User uid is required.");
	}

	// Prevent admins from deleting themselves
	if (payload.uid === request.auth.uid) {
		throw new HttpsError(
			"failed-precondition",
			"You cannot delete your own account.",
		);
	}

	const auth = getAuth();

	// Verify the user exists and is a staff member
	const user = await auth.getUser(payload.uid);
	const claims = user.customClaims ?? {};

	if (!claims.staff && !claims.admin) {
		throw new HttpsError(
			"failed-precondition",
			"This user is not a staff member.",
		);
	}

	// Delete the user
	await auth.deleteUser(payload.uid);

	return {
		success: true,
		uid: payload.uid,
	};
});

/**
 * Verify a staff user exists and return their email for password reset.
 * Only admins can call this function.
 * The actual email is sent by the client using Firebase Auth SDK.
 */
export const resetStaffUserPassword = onCall(FUNCTION_OPTIONS, async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAdmin = request.auth.token.admin === true;
	if (!isAdmin) {
		throw new HttpsError(
			"permission-denied",
			"Only admins can reset staff user passwords.",
		);
	}

	const payload = request.data as {uid?: string} | undefined;

	if (!payload?.uid) {
		throw new HttpsError("invalid-argument", "User uid is required.");
	}

	const auth = getAuth();

	// Get the user to verify they exist and get their email
	const user = await auth.getUser(payload.uid);
	const claims = user.customClaims ?? {};

	if (!claims.staff && !claims.admin) {
		throw new HttpsError(
			"failed-precondition",
			"This user is not a staff member.",
		);
	}

	if (!user.email) {
		throw new HttpsError(
			"failed-precondition",
			"This user does not have an email address.",
		);
	}

	return {
		success: true,
		uid: payload.uid,
		email: user.email,
	};
});
