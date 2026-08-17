/**
 * hb patch: route every model call through OpenRouter instead of the Vercel
 * AI Gateway. The AI SDK resolves string model ids via
 * `globalThis.AI_SDK_DEFAULT_PROVIDER ?? gateway`, so installing a provider
 * here (before any model resolution) switches the whole agent — no eve
 * changes. OpenRouter model ids share the `vendor/model` shape the DB model
 * setting already stores. Without OPENROUTER_API_KEY the stock gateway path
 * is untouched.
 */

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function installOpenRouterProvider(): void {
	const apiKey = process.env.OPENROUTER_API_KEY;
	if (!apiKey) return;

	(globalThis as { AI_SDK_DEFAULT_PROVIDER?: unknown }).AI_SDK_DEFAULT_PROVIDER =
		createOpenAICompatible({
			name: "openrouter",
			baseURL: "https://openrouter.ai/api/v1",
			apiKey,
			headers: {
				"HTTP-Referer": "https://crm.operator.humanbased.ai",
				"X-Title": "Humanbased CRM",
			},
		});
	console.log("[openrouter] AI_SDK_DEFAULT_PROVIDER -> openrouter.ai");
}
