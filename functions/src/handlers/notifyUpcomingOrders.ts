import {getFirestore} from "firebase-admin/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";

const telegramBotToken = defineSecret("TELEGRAM_BOT_TOKEN");
const telegramChatId = defineSecret("TELEGRAM_CHAT_ID");

/**
 * Number of days ahead to include in the upcoming-orders digest.
 * Defaults to 1 (tomorrow only). Override via UPCOMING_ORDERS_LOOKAHEAD_DAYS env var.
 */
const LOOKAHEAD_DAYS = Math.max(
	1,
	parseInt(process.env.UPCOMING_ORDERS_LOOKAHEAD_DAYS ?? "1", 10),
);

const REGION = "europe-west3";

interface UpcomingOrderData {
	orderNumber: string;
	customerName: string;
	customerPhone: string;
	pickup: {date: string; location: string};
	totals: {subtotal: number; currency: string};
	items: Array<{
		name: string;
		quantity: number;
		unitPrice: number;
		weightInGrams?: number;
	}>;
	specialRequests?: string;
}

/** Returns a YYYY-MM-DD string for a Date in the Europe/Berlin timezone. */
const toBerlinDateString = (date: Date): string =>
	date.toLocaleDateString("en-CA", {timeZone: "Europe/Berlin"});

/**
 * Returns the list of upcoming YYYY-MM-DD date strings starting from tomorrow.
 * The count is controlled by LOOKAHEAD_DAYS.
 */
const getUpcomingDates = (): string[] => {
	const now = new Date();
	return Array.from({length: LOOKAHEAD_DAYS}, (_, i) => {
		const future = new Date(now);
		future.setDate(future.getDate() + i + 1);
		return toBerlinDateString(future);
	});
};

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

/**
 * Queries Firestore for uncompleted orders on the given dates and returns
 * them grouped by date.
 */
const fetchOrdersByDates = async (
	dates: string[],
): Promise<Map<string, UpcomingOrderData[]>> => {
	const db = getFirestore();
	const result = new Map<string, UpcomingOrderData[]>();

	for (const date of dates) {
		const snapshot = await db
			.collection("orders")
			.where("pickup.date", "==", date)
			.where("isComplete", "==", false)
			.orderBy("createdAt")
			.get();

		if (!snapshot.empty) {
			result.set(
				date,
				snapshot.docs.map((doc) => doc.data() as UpcomingOrderData),
			);
		}
	}

	return result;
};

/** Builds the Telegram message from grouped orders. */
const buildMessage = (
	ordersByDate: Map<string, UpcomingOrderData[]>,
	lookaheadDays: number,
): string => {
	const totalCount = [...ordersByDate.values()].reduce(
		(sum, arr) => sum + arr.length,
		0,
	);

	const periodLabel =
		lookaheadDays === 1
			? "morgen"
			: `den nächsten ${lookaheadDays} Tagen`;

	const lines: string[] = [
		`<b>📦 Bevorstehende Bestellungen (${periodLabel})</b>`,
		`Gesamt: <b>${totalCount}</b> Bestellung(en)`,
		"",
	];

	for (const [date, orders] of ordersByDate.entries()) {
		lines.push(
			`<b>— ${date} · ${orders.length} Bestellung${orders.length > 1 ? "en" : ""} —</b>`,
			"",
		);

		for (const order of orders) {
			lines.push(
				`<b>${order.orderNumber}</b>`,
				`Name: ${order.customerName}`,
				`Telefon: ${order.customerPhone}`,
				`Abholort: ${order.pickup.location}`,
				`Summe: ${order.totals.subtotal.toFixed(2)} ${order.totals.currency}`,
				"Artikel:",
				...order.items.map(
					(item) =>
						`  - ${item.quantity}× ${item.name} (${item.unitPrice.toFixed(2)} EUR${
							item.weightInGrams ? `, ${item.weightInGrams} g` : ""
						})`,
				),
				...(order.specialRequests
					? [`Sonderwünsche: ${order.specialRequests}`]
					: []),
				"",
			);
		}
	}

	return lines.join("\n");
};

/**
 * Scheduled Cloud Function — runs every day at 08:00 Europe/Berlin.
 * Sends a Telegram digest of all uncompleted orders whose pickup date
 * falls within the next LOOKAHEAD_DAYS day(s).
 */
export const notifyUpcomingOrders = onSchedule(
	{
		schedule: "every day 08:00",
		timeZone: "Europe/Berlin",
		region: REGION,
		secrets: [telegramBotToken, telegramChatId],
	},
	async () => {
		const dates = getUpcomingDates();
		const ordersByDate = await fetchOrdersByDates(dates);
		const totalCount = [...ordersByDate.values()].reduce(
			(sum, arr) => sum + arr.length,
			0,
		);

		if (totalCount === 0) {
			console.log(
				`No upcoming uncompleted orders for the next ${LOOKAHEAD_DAYS} day(s).`,
			);
			return;
		}

		const message = buildMessage(ordersByDate, LOOKAHEAD_DAYS);
		await sendTelegramNotification(message);
		console.log(
			`Upcoming-orders digest sent: ${totalCount} order(s) across ${ordersByDate.size} date(s).`,
		);
	},
);

/**
 * HTTP trigger for manually testing the upcoming-orders notification.
 * Protected by a shared secret passed as the `token` query parameter.
 *
 * Usage:
 *   POST https://<region>-<project>.cloudfunctions.net/triggerUpcomingOrdersDigest?token=<TEST_SECRET>
 *
 * Set TEST_TRIGGER_SECRET in your .env / Firebase secret manager.
 */
export const triggerUpcomingOrdersDigest = onRequest(
	{region: REGION, invoker: "public", secrets: [telegramBotToken, telegramChatId]},
	async (req, res) => {
		const testSecret = process.env.TEST_TRIGGER_SECRET;
		const providedToken = req.query["token"];

		if (!testSecret || providedToken !== testSecret) {
			res.status(403).json({error: "Forbidden"});
			return;
		}

		const dates = getUpcomingDates();
		const ordersByDate = await fetchOrdersByDates(dates);
		const totalCount = [...ordersByDate.values()].reduce(
			(sum, arr) => sum + arr.length,
			0,
		);

		if (totalCount === 0) {
			res.json({sent: false, reason: "No upcoming uncompleted orders found."});
			return;
		}

		const message = buildMessage(ordersByDate, LOOKAHEAD_DAYS);
		await sendTelegramNotification(message);
		res.json({
			sent: true,
			totalOrders: totalCount,
			dates: [...ordersByDate.keys()],
		});
	},
);
