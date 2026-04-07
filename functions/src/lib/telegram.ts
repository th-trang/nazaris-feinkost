export const sendTelegramNotification = async (
	message: string,
	botToken: string,
	chatId: string,
): Promise<void> => {
	if (!botToken || !chatId) {
		console.warn(
			"Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.",
		);
		return;
	}

	try {
		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendMessage`,
			{
				method: "POST",
				headers: {"Content-Type": "application/json"},
				body: JSON.stringify({
					chat_id: chatId,
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
