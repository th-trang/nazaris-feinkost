import {createTransport} from "nodemailer";
import {defineSecret} from "firebase-functions/params";
import type {CreateOrderInput} from "./types.js";
import {locationCatalog} from "../locationCatalog.js";

const smtpHost = defineSecret("SMTP_HOST");
const smtpPort = defineSecret("SMTP_PORT");
const smtpUser = defineSecret("SMTP_USER");
const smtpPass = defineSecret("SMTP_PASS");
const smtpFrom = defineSecret("SMTP_FROM");

export const emailSecrets = [smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom];

interface OrderConfirmationData {
	orderNumber: string;
	payload: CreateOrderInput;
	subtotal: number;
}

const GERMAN_DAYS = [
	"Sonntag", "Montag", "Dienstag", "Mittwoch",
	"Donnerstag", "Freitag", "Samstag",
];

const GERMAN_MONTHS = [
	"Januar", "Februar", "M\u00e4rz", "April", "Mai", "Juni",
	"Juli", "August", "September", "Oktober", "November", "Dezember",
];

const formatGermanDate = (dateStr: string): string => {
	const [year, month, day] = dateStr.split("-").map(Number);
	const date = new Date(year, month - 1, day);
	const dayName = GERMAN_DAYS[date.getDay()];
	const monthName = GERMAN_MONTHS[date.getMonth()];
	return `${dayName}, ${day}. ${monthName} ${year}`;
};

const findLocation = (locationName: string) =>
	locationCatalog.find(
		(loc) => loc.name.toLowerCase() === locationName.trim().toLowerCase(),
	);

const getPickupHours = (locationName: string, dateStr: string): string => {
	const location = findLocation(locationName);
	if (!location) return "";
	const [year, month, day] = dateStr.split("-").map(Number);
	const date = new Date(year, month - 1, day);
	const dayName = GERMAN_DAYS[date.getDay()];
	const matchingDay = location.openDays.find((d) => d.day === dayName);
	return matchingDay ? matchingDay.hours : location.hours;
};

const escapeHtml = (str: string): string =>
	str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const buildOrderConfirmationHtml = (data: OrderConfirmationData): string => {
	const {orderNumber, payload, subtotal} = data;
	const paymentLabel =
		payload.paymentMethod === "paypal"
			? "PayPal"
			: "Kartenzahlung bei Abholung";

	const location = findLocation(payload.pickupLocation);
	const locationAddress = location ? escapeHtml(location.address) : "";
	const locationCity = location ? escapeHtml(location.city) : "";
	const pickupHours = getPickupHours(payload.pickupLocation, payload.pickupDate);
	const formattedDate = formatGermanDate(payload.pickupDate);

	const itemRows = payload.items
		.map((item) => {
			const imageCell = item.imageUrl
				? `<td style="padding:12px 8px 12px 0;border-bottom:1px solid #f0f0f0;width:48px;vertical-align:middle;">
					<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" width="44" height="44" style="border-radius:8px;object-fit:cover;display:block;" />
				</td>`
				: `<td style="padding:12px 8px 12px 0;border-bottom:1px solid #f0f0f0;width:48px;vertical-align:middle;">
					<div style="width:44px;height:44px;border-radius:8px;background:#f0f0f0;"></div>
				</td>`;

			const weightLabel = item.weightInGrams
				? `<br/><span style="font-size:12px;color:#999;">${item.weightInGrams}g</span>`
				: "";

			return `<tr>
				${imageCell}
				<td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;vertical-align:middle;">
					<strong>${escapeHtml(item.name)}</strong>${weightLabel}
				</td>
				<td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#333;vertical-align:middle;">${item.quantity}</td>
				<td style="padding:12px 0 12px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#333;vertical-align:middle;">&euro;${(item.unitPrice * item.quantity).toFixed(2)}</td>
			</tr>`;
		})
		.join("");

	return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bestellbest&auml;tigung ${escapeHtml(orderNumber)}</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

	<!-- ======== HEADER ======== -->
	<tr>
		<td style="background:linear-gradient(160deg, #1a6b35 0%, #28a745 50%, #5ec576 100%);padding:32px 24px 28px;text-align:center;">
			<img src="https://nazaris-feinkost.web.app/logo.png" alt="Nazari's Feinkost" width="64" height="64" style="border-radius:50%;display:inline-block;margin-bottom:12px;background:#fff;" />
			<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:0.5px;">Nazari's Feinkost</h1>
			<p style="margin:6px 0 20px;color:#b8e6c8;font-size:14px;letter-spacing:0.5px;">Bestellbest&auml;tigung</p>
			<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
				<tr><td style="width:52px;height:52px;border-radius:50%;background:#ffffff;text-align:center;line-height:52px;">
					<span style="color:#28a745;font-size:30px;font-weight:bold;">&#10003;</span>
				</td></tr>
			</table>
		</td>
	</tr>

	<!-- ======== GREETING ======== -->
	<tr>
		<td style="padding:32px 36px 8px;">
			<h2 style="margin:0;color:#28a745;font-size:22px;font-weight:600;">Hallo ${escapeHtml(payload.firstName)},</h2>
			<p style="margin:10px 0 0;color:#777;font-size:15px;line-height:1.5;">
				vielen Dank f&uuml;r Ihre Bestellung! Hier ist Ihre Best&auml;tigung:
			</p>
		</td>
	</tr>

	<!-- ======== ORDER NUMBER ======== -->
	<tr>
		<td style="padding:20px 36px;">
			<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf4;border:1px solid #c8e6d0;border-radius:10px;">
				<tr><td style="padding:20px;text-align:center;">
					<p style="margin:0 0 6px;color:#28a745;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">&#128203; Bestellnummer</p>
					<p style="margin:0;font-size:28px;font-weight:bold;color:#1a1a1a;letter-spacing:1px;">${escapeHtml(orderNumber)}</p>
				</td></tr>
			</table>
		</td>
	</tr>

	<!-- ======== ARTICLES ======== -->
	<tr>
		<td style="padding:8px 36px 4px;">
			<p style="margin:0 0 14px;font-size:16px;font-weight:700;color:#1a1a1a;">&#128722; Artikel</p>
			<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
				<tr>
					<th style="padding:0 8px 10px 0;text-align:left;font-size:12px;color:#999;font-weight:600;border-bottom:2px solid #e5e7eb;" width="48"></th>
					<th style="padding:0 8px 10px;text-align:left;font-size:12px;color:#999;font-weight:600;border-bottom:2px solid #e5e7eb;">Artikel</th>
					<th style="padding:0 8px 10px;text-align:center;font-size:12px;color:#999;font-weight:600;border-bottom:2px solid #e5e7eb;">Menge</th>
					<th style="padding:0 0 10px 8px;text-align:right;font-size:12px;color:#999;font-weight:600;border-bottom:2px solid #e5e7eb;">Preis</th>
				</tr>
				${itemRows}
				<tr>
					<td colspan="3" style="padding:14px 8px 14px 0;text-align:right;font-weight:bold;font-size:15px;color:#333;">Summe</td>
					<td style="padding:14px 0 14px 8px;text-align:right;font-weight:bold;font-size:20px;color:#28a745;">&euro;${subtotal.toFixed(2)}</td>
				</tr>
			</table>
		</td>
	</tr>

	<!-- ======== PICKUP INFORMATION ======== -->
	<tr>
		<td style="padding:16px 36px;">
			<table width="100%" cellpadding="0" cellspacing="0">
				<tr>
					<!-- Abholort -->
					<td width="48%" style="vertical-align:top;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;padding:18px;">
						<p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#1a1a1a;">&#128205; Abholort</p>
						<p style="margin:0;font-size:14px;color:#28a745;font-weight:600;">${escapeHtml(payload.pickupLocation)}</p>
						${locationAddress ? `<p style="margin:4px 0 0;font-size:13px;color:#777;">${locationAddress}</p>` : ""}
						${locationCity ? `<p style="margin:2px 0 0;font-size:13px;color:#777;">${locationCity}</p>` : ""}
					</td>
					<td width="4%"></td>
					<!-- Abholdatum -->
					<td width="48%" style="vertical-align:top;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;padding:18px;">
						<p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#1a1a1a;">&#128197; Abholdatum</p>
						<p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600;">${escapeHtml(formattedDate)}</p>
						${pickupHours ? `<p style="margin:6px 0 0;font-size:13px;color:#777;">&#9200; ${escapeHtml(pickupHours)}</p>` : ""}
					</td>
				</tr>
			</table>
		</td>
	</tr>

	<!-- ======== PAYMENT METHOD ======== -->
	<tr>
		<td style="padding:8px 36px;">
			<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">
				<tr><td style="padding:18px 0;">
					<p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1a1a1a;">&#128179; Zahlungsmethode</p>
					<p style="margin:0;font-size:14px;color:#666;">${escapeHtml(paymentLabel)}</p>
				</td></tr>
			</table>
		</td>
	</tr>

	<!-- ======== CONTACT INFORMATION ======== -->
	<tr>
		<td style="padding:0 36px 8px;">
			<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;">
				<tr><td style="padding:18px 0;">
					<p style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#28a745;font-weight:700;">Kontaktinformationen</p>
					<p style="margin:0 0 8px;font-size:14px;color:#333;">&#128100; ${escapeHtml(payload.firstName)} ${escapeHtml(payload.lastName)}</p>
					<p style="margin:0 0 8px;font-size:14px;color:#333;">&#9993; ${escapeHtml(payload.email)}</p>
					<p style="margin:0;font-size:14px;color:#333;">&#128222; ${escapeHtml(payload.phone)}</p>
				</td></tr>
			</table>
		</td>
	</tr>

	<!-- ======== FOOTER ======== -->
	<tr>
		<td style="padding:24px 36px 32px;text-align:center;border-top:1px solid #e5e7eb;">
			<p style="margin:0 0 20px;font-size:14px;color:#777;">
				Bei Fragen antworten Sie einfach auf diese E-Mail.
			</p>
			<!--[if mso]>
			<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" style="height:40px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="t" strokecolor="#28a745" fillcolor="#ffffff">
			<v:stroke dashstyle="solid" color="#28a745" weight="2pt" />
			<center style="color:#28a745;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">&#128424; Best&auml;tigung drucken</center>
			</v:roundrect>
			<![endif]-->
			<!--[if !mso]><!-->
			<a href="#" style="display:inline-block;padding:10px 28px;border:2px solid #28a745;border-radius:24px;color:#28a745;text-decoration:none;font-size:14px;font-weight:600;">&#128424; Best&auml;tigung drucken</a>
			<!--<![endif]-->
			<p style="margin:20px 0 0;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} Nazari's Feinkost</p>
		</td>
	</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
};

export const sendOrderConfirmationEmail = async (
	data: OrderConfirmationData,
): Promise<void> => {
	const host = smtpHost.value();
	const port = Number(smtpPort.value());
	const user = smtpUser.value();
	const pass = smtpPass.value();
	const from = smtpFrom.value();

	if (!host || !user || !pass) {
		console.warn(
			"Order confirmation email skipped: SMTP secrets not configured.",
		);
		return;
	}

	const transporter = createTransport({
		host,
		port: port || 587,
		secure: port === 465,
		auth: {user, pass},
	});

	const html = buildOrderConfirmationHtml(data);

	try {
		await transporter.sendMail({
			from,
			to: data.payload.email,
			subject: `Bestellbestätigung – ${data.orderNumber}`,
			html,
		});
	} catch (error) {
		console.error("Failed to send order confirmation email:", error);
	}
};
