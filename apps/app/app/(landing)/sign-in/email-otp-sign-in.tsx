"use client";

import { authClient } from "@crm/auth/client";
import { Button } from "@crm/ui/components/button";
import { Input } from "@crm/ui/components/input";
import { Spinner } from "@crm/ui/components/spinner";
import { useState } from "react";
import { toast } from "sonner";

/**
 * hb patch: email-OTP sign-in for installs without Google/SSO. A code goes to
 * an allow-listed address; verifying it creates the session (and, first time,
 * the user — the server-side allow-list hook is the backstop).
 */
export function EmailOtpSignIn() {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [stage, setStage] = useState<"email" | "otp">("email");
	const [pending, setPending] = useState(false);

	async function requestCode() {
		setPending(true);
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "sign-in",
		});
		setPending(false);
		if (error) {
			toast.error(error.message ?? "Could not send the code.");
			return;
		}
		setStage("otp");
	}

	async function verifyCode() {
		setPending(true);
		const { error } = await authClient.signIn.emailOtp({ email, otp });
		if (error) {
			toast.error(error.message ?? "That code did not work.");
			setPending(false);
			return;
		}
		window.location.assign("/");
	}

	if (stage === "otp") {
		return (
			<form
				className="flex w-full flex-col gap-2"
				onSubmit={(event) => {
					event.preventDefault();
					void verifyCode();
				}}
			>
				<p className="text-center text-muted-foreground text-sm/5">
					We sent a code to {email}.
				</p>
				<Input
					autoComplete="one-time-code"
					autoFocus
					inputMode="numeric"
					onChange={(event) => setOtp(event.target.value.trim())}
					placeholder="6-digit code"
					value={otp}
				/>
				<Button className="w-full" disabled={pending || otp.length < 6} type="submit">
					{pending ? <Spinner data-icon="inline-start" /> : null}
					Sign in
				</Button>
				<Button
					className="w-full"
					onClick={() => {
						setOtp("");
						setStage("email");
					}}
					type="button"
					variant="ghost"
				>
					Use a different address
				</Button>
			</form>
		);
	}

	return (
		<form
			className="flex w-full flex-col gap-2"
			onSubmit={(event) => {
				event.preventDefault();
				void requestCode();
			}}
		>
			<Input
				autoComplete="email"
				onChange={(event) => setEmail(event.target.value.trim())}
				placeholder="you@inductive.network"
				type="email"
				value={email}
			/>
			<Button className="w-full" disabled={pending || !email.includes("@")} type="submit">
				{pending ? <Spinner data-icon="inline-start" /> : null}
				Email me a sign-in code
			</Button>
		</form>
	);
}
