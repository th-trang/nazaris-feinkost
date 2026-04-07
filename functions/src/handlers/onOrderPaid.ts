import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {defineSecret} from "firebase-functions/params";
import {sendOrderConfirmationEmail, emailSecrets} from "../lib/email.js";
import {sendTelegramNotification} from "../lib/telegram.js";
import type {CreateOrderInput} from "../lib/types.js";

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	card: "Karte",
	paypal: "PayPal",
	sepa_debit: "SEPA-Lastschrift",
};

export const onOrderPaid = onDocumentUpdated(
	{
		document: "orders/{orderId}",
		region: "europe-west3",
		secrets: [telegramBotToken, telegramChatId, ...emailSecrets],
	},
	async (event) => {
		const before = event.data?.before.data();
		const after = event.data?.after.data();

		if (!before || !after) return;

		// Only trigger when payment status changes to "paid"
		if (before.payment?.status === "paid" || after.payment?.status !== "paid") {
			return;
		}

		const orderNumber: string = after.orderNumber;
		const method: string = after.payment?.method ?? "card";
		const subtotal: number = after.totals?.subtotal ?? 0;

		// --- Telegram notification ---
		const notificationLines = [
			`Neue Bestellung ${orderNumber}`,
			`Name: ${after.customer?.firstName} ${after.customer?.lastName}`,
			`E-Mail: ${after.customer?.email ?? after.customerEmail}`,
			`Telefon: ${after.customer?.phone ?? after.customerPhone}`,
			`Abholdatum: ${after.pickup?.date ?? after.pickupDate}`,
			`Abholort: ${after.pickup?.location ?? after.pickupLocation}`,
			`Zahlungsmethode: ${PAYMENT_METHOD_LABELS[method] ?? method}`,
			`Summe: ${subtotal.toFixed(2)} EUR`,
			"",
			"Artikel:",
			...(after.items ?? []).map(
				(item: {name: string; quantity: number; unitPrice: number; weightInGrams?: number}) =>
					`- ${item.quantity}x ${item.name} (${item.unitPrice.toFixed(2)} EUR${
						item.weightInGrams ? `, ${item.weightInGrams} g` : ""
					})`,
			),
		];

		await sendTelegramNotification(
			notificationLines.join("\n"),
			telegramBotToken.value(),
			telegramChatId.value(),
		);

		// --- Confirmation email ---
		const payload: CreateOrderInput = {
			firstName: after.customer?.firstName ?? "",
			lastName: after.customer?.lastName ?? "",
			email: after.customer?.email ?? after.customerEmail ?? "",
			phone: after.customer?.phone ?? after.customerPhone ?? "",
			pickupDate: after.pickup?.date ?? after.pickupDate ?? "",
			pickupLocation: after.pickup?.location ?? after.pickupLocation ?? "",
			specialRequests: after.specialRequests,
			paymentMethod: method === "paypal" ? "paypal" : "card",
			items: after.items ?? [],
		};

		await sendOrderConfirmationEmail({orderNumber, payload, subtotal});
	},
);
