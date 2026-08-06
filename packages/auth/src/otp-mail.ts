/**
 * OTP mail for the email-OTP sign-in (hb patch).
 *
 * Mirrors the internal gtm-console pattern: Resend HTTP API, same env names
 * (`RESEND_API_KEY`, `RESEND_FROM_INTERNAL`), 6-digit code in the subject so
 * the inbox preview alone is enough. No Resend SDK — one fetch, fail loud.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function otpMailConfigured(): boolean {
	return Boolean(process.env.RESEND_API_KEY) || otpLocalLog();
}

// Local-dev escape, same idea as gtm-console's LOCAL_TEST_AUTH: log the code
// instead of mailing it. Explicit opt-in, never set in a deployed environment.
function otpLocalLog(): boolean {
	return process.env.OTP_LOCAL_LOG === "true";
}

export async function sendOtpMail(email: string, otp: string): Promise<void> {
	if (otpLocalLog()) {
		console.warn(`[otp-mail] OTP_LOCAL_LOG is on — code for ${email}: ${otp}`);
		return;
	}
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error(
			"RESEND_API_KEY is not set: the email-OTP sign-in cannot send codes.",
		);
	}
	const from =
		process.env.RESEND_FROM_INTERNAL ??
		"Inductive Network <noreply@inductive.network>";

	const response = await fetch(RESEND_ENDPOINT, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			from,
			to: [email],
			subject: `${otp} is your CRM sign-in code`,
			text: `Your CRM sign-in code is ${otp}. It expires in 10 minutes. If you did not request it, ignore this email.`,
		}),
	});

	if (!response.ok) {
		const body = await response.text().catch(() => "");
		throw new Error(
			`Resend refused the OTP mail (${response.status}): ${body.slice(0, 300)}`,
		);
	}
}
