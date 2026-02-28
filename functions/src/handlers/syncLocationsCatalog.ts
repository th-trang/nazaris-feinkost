import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {locationCatalog} from "../locationCatalog.js";

export const syncLocationsCatalog = onCall(async (request) => {
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "Sign in is required.");
	}

	const isAllowed =
		request.auth.token.admin === true || request.auth.token.staff === true;

	if (!isAllowed) {
		throw new HttpsError(
			"permission-denied",
			"Only staff can sync locations.",
		);
	}

	const db = getFirestore();
	const batch = db.batch();

	locationCatalog.forEach((location, index) => {
		const ref = db.collection("locations").doc(location.id);
		batch.set(
			ref,
			{
				name: location.name,
				address: location.address,
				city: location.city,
				hours: location.hours,
				openDays: location.openDays,
				active: true,
				sortOrder: index,
				updatedAt: FieldValue.serverTimestamp(),
				createdAt: FieldValue.serverTimestamp(),
			},
			{merge: true},
		);
	});

	await batch.commit();

	return {
		locationsSynced: locationCatalog.length,
	};
});
