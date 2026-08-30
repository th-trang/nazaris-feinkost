/**
 * Locating order documents by order number.
 *
 * Orders are keyed by their order number ("NZ-2026-000123"), so the Firestore
 * console lists something readable and every lookup here is a direct read
 * rather than a query. Orders written before that change carry an auto-generated
 * ID and keep the number in a field, so each lookup falls back to the old query
 * when the direct read misses.
 */
import type {DocumentSnapshot, Firestore} from "firebase-admin/firestore";

/**
 * The shape createOrder generates. Order numbers reach us from the browser
 * (Widerruf) and from Stripe metadata, and a document ID is a path segment —
 * anything that is not this exact shape must never be handed to .doc().
 */
const ORDER_NUMBER_PATTERN = /^NZ-\d{4}-\d{6}$/;

export const isOrderNumber = (value: string): boolean =>
	ORDER_NUMBER_PATTERN.test(value);

/**
 * Every order document carrying this number: at most one under the current
 * scheme, but legacy duplicates are possible because the old auto-ID writes
 * had nothing to collide on.
 */
export const findOrderCandidates = async (
	db: Firestore,
	orderNumber: string,
	limit = 5,
): Promise<DocumentSnapshot[]> => {
	if (isOrderNumber(orderNumber)) {
		const direct = await db.collection("orders").doc(orderNumber).get();
		if (direct.exists) {
			return [direct];
		}
	}

	const snapshot = await db
		.collection("orders")
		.where("orderNumber", "==", orderNumber)
		.limit(limit)
		.get();

	return snapshot.docs;
};

/** The single order for this number, or null when there is none. */
export const findOrderByNumber = async (
	db: Firestore,
	orderNumber: string,
): Promise<DocumentSnapshot | null> => {
	const [order] = await findOrderCandidates(db, orderNumber, 1);
	return order ?? null;
};
