import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {createHash} from "node:crypto";
import {onCall} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {locationCatalog} from "../locationCatalog.js";
import {assertValidCreateOrderPayload, roundCurrency} from "../lib/validation.js";
import {sendOrderConfirmationEmail, emailSecrets} from "../lib/email.js";

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

const FUNCTION_OPTIONS = {
	region: "europe-west3",
	invoker: "public" as const,
	secrets: [telegramBotToken, telegramChatId, ...emailSecrets],
};

const toGuestUserId = (email: string): string => {
	const hash = createHash("sha256").update(email).digest("hex").slice(0, 24);
	return `guest_${hash}`;
};

const locationIdByName = new Map(
	locationCatalog.map((location) => [location.name.toLowerCase(), location.id]),
);

const getPickupLocationId = (pickupLocation: string): string =>
	locationIdByName.get(pickupLocation.trim().toLowerCase()) ?? "custom";

const sendTelegramNotification = async (message: string): Promise<void> => {
	const TELEGRAM_BOT_TOKEN = telegramBotToken.value();
	const TELEGRAM_CHAT_ID = telegramChatId.value();
	if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
		console.warn(
			"Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.",
		);
		return;
	}

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
			{
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					chat_id: TELEGRAM_CHAT_ID,
					text: message,
					parse_mode: "HTML",
				}),
			},
		);

		if (!response.ok) {
			const errorText = await response.text().catch(() => "");
			console.error(
				"Failed to send Telegram notification",
				response.status,
				errorText,
			);
		}
	} catch (error) {
		console.error("Error while sending Telegram notification", error);
	}
};

export const createOrder = onCall(FUNCTION_OPTIONS, async (request) => {
	const payload = assertValidCreateOrderPayload(request.data);
	const db = getFirestore();
	const customerUid = request.auth?.uid ?? null;
	const customerUserId = customerUid ?? toGuestUserId(payload.email);
	const pickupLocationId = getPickupLocationId(payload.pickupLocation);

	const subtotal = roundCurrency(
		payload.items.reduce(
			(sum, item) => sum + item.unitPrice * item.quantity,
			0,
		),
	);

	const counterRef = db.collection("meta").doc("orderCounter");
	const sequence = await db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(counterRef);
		const currentValue = snapshot.exists
			? Number(snapshot.data()?.current ?? 0)
			: 0;
		const nextValue = currentValue + 1;
		transaction.set(counterRef, {current: nextValue}, {merge: true});
		return nextValue;
	});

	const year = new Date().getFullYear();
	const orderNumber = `NZ-${year}-${String(sequence).padStart(6, "0")}`;
	const orderRef = db.collection("orders").doc();
	const userRef = db.collection("users").doc(customerUserId);

	await db.runTransaction(async (transaction) => {
		const userSnapshot = await transaction.get(userRef);
		const now = FieldValue.serverTimestamp();

		if (!userSnapshot.exists) {
			transaction.set(userRef, {
				uid: customerUid,
				type: "customer",
				email: payload.email,
				firstName: payload.firstName,
				lastName: payload.lastName,
				phone: payload.phone,
				createdAt: now,
				updatedAt: now,
				lastOrderAt: now,
			});
		} else {
			transaction.set(
				userRef,
				{
					uid: customerUid,
					type: "customer",
					email: payload.email,
					firstName: payload.firstName,
					lastName: payload.lastName,
					phone: payload.phone,
					updatedAt: now,
					lastOrderAt: now,
				},
				{merge: true},
			);
		}
	});

	await orderRef.set({
		orderNumber,
		status: "pending",
		isComplete: false,
		customerUid,
		customerUserId,
		customerName: `${payload.firstName} ${payload.lastName}`,
		customerEmail: payload.email,
		customerPhone: payload.phone,
		pickupDate: payload.pickupDate,
		pickupLocation: payload.pickupLocation,
		pickupLocationId,
		paymentStatus: "pending",
		customer: {
			firstName: payload.firstName,
			lastName: payload.lastName,
			email: payload.email,
			phone: payload.phone,
		},
		pickup: {
			date: payload.pickupDate,
			location: payload.pickupLocation,
			locationId: pickupLocationId,
		},
		specialRequests: payload.specialRequests,
		payment: {
			method: payload.paymentMethod,
			status: "pending",
		},
		totals: {
			subtotal,
			currency: "EUR",
		},
		items: payload.items,
		createdAt: FieldValue.serverTimestamp(),
		updatedAt: FieldValue.serverTimestamp(),
	});

	const notificationLines = [
		`Neue Bestellung ${orderNumber}`,
		`Name: ${payload.firstName} ${payload.lastName}`,
		`E-Mail: ${payload.email}`,
		`Telefon: ${payload.phone}`,
		`Abholdatum: ${payload.pickupDate}`,
		`Abholort: ${payload.pickupLocation}`,
		`Zahlungsmethode: ${payload.paymentMethod === "paypal" ? "PayPal" : "Karte"}`,
		`Summe: ${subtotal.toFixed(2)} EUR`,
		"",
		"Artikel:",
		...payload.items.map(
			(item) =>
				`- ${item.quantity}x ${item.name} (${item.unitPrice.toFixed(2)} EUR${
					item.weightInGrams ? `, ${item.weightInGrams} g` : ""
				})`,
		),
	];

	await sendTelegramNotification(notificationLines.join("\n"));

	await sendOrderConfirmationEmail({orderNumber, payload, subtotal});

	return {
		orderId: orderRef.id,
		orderNumber,
		status: "pending",
	};
});
