import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {defineSecret} from "firebase-functions/params";
import {sendOrderConfirmationEmail, emailSecrets} from "../lib/email.js";
import {sendTelegramNotification} from "../lib/telegram.js";
import {paymentMethodLabel} from "../lib/paymentMethods.js";
import type {OrderNotificationPayload, ResolvedPaymentMethod, StoredOrderItem} from "../lib/types.js";

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

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
		const discount: number = after.totals?.discount ?? 0;
		// Orders written before totals carried a discount only stored the subtotal.
		const total: number = after.totals?.total ?? subtotal;
		const items: StoredOrderItem[] = (after.items ?? []).map(
			(item: Partial<StoredOrderItem>): StoredOrderItem => ({
				...(item as StoredOrderItem),
				lineTotal:
					item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 0),
			}),
		);

		// --- Telegram notification ---
		const notificationLines = [
			`Neue Bestellung ${orderNumber}`,
			`Name: ${after.customer?.firstName} ${after.customer?.lastName}`,
			`E-Mail: ${after.customer?.email ?? after.customerEmail}`,
			`Telefon: ${after.customer?.phone ?? after.customerPhone}`,
			`Abholdatum: ${after.pickup?.date ?? after.pickupDate}`,
			`Abholort: ${after.pickup?.location ?? after.pickupLocation}`,
			`Zahlungsmethode: ${paymentMethodLabel(method)}`,
			...(discount > 0
				? [
					`Zwischensumme: ${subtotal.toFixed(2)} EUR`,
					`Rabatt: -${discount.toFixed(2)} EUR`,
				]
				: []),
			`Summe: ${total.toFixed(2)} EUR`,
			"",
			"Artikel:",
			...items.map(
				(item) =>
					`- ${item.quantity}x ${item.name} (${item.lineTotal.toFixed(2)} EUR${
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
		const payload: OrderNotificationPayload = {
			firstName: after.customer?.firstName ?? "",
			lastName: after.customer?.lastName ?? "",
			email: after.customer?.email ?? after.customerEmail ?? "",
			phone: after.customer?.phone ?? after.customerPhone ?? "",
			pickupDate: after.pickup?.date ?? after.pickupDate ?? "",
			pickupLocation: after.pickup?.location ?? after.pickupLocation ?? "",
			specialRequests: after.specialRequests,
			// Keep the wallet the customer actually used (Apple Pay, Google Pay …).
			paymentMethod: method as ResolvedPaymentMethod,
			items,
		};

		await sendOrderConfirmationEmail({orderNumber, payload, subtotal, discount, total});
	},
);
