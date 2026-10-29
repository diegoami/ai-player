// What a run has cost.
//
// The two providers report differently: MiniMax bills speech by the
// character, and OpenRouter puts the cost of every call in its usage. Both
// are counted here so a run can report what it spent.

export const costs = {
	openrouter: 0,
	openrouterCalls: 0,
	promptTokens: 0,
	completionTokens: 0,
	speechChars: 0,
	speechCost: 0,
	speechProvider: '',
	/** Calls the other provider made, if it reports one. */
	other: 0,
	otherCalls: 0,
	otherTokens: 0,
	otherProvider: ''
};

/** What the voice providers charge, per 1,000 characters. */
const SPEECH_RATES = { minimax: 0.1, elevenlabs: 0.3, edge: 0 };

export function addSpeech(provider, characters) {
	costs.speechProvider = provider;
	costs.speechChars += characters;
	costs.speechCost += (characters / 1000) * (SPEECH_RATES[provider] ?? 0);
}

export function addOpenRouter(usage) {
	costs.openrouter += usage?.cost ?? 0;
	costs.openrouterCalls += 1;
	costs.promptTokens += usage?.prompt_tokens ?? 0;
	costs.completionTokens += usage?.completion_tokens ?? 0;
}

/** For a provider that reports its own cost, in dollars, and its tokens. */
export function addOther(provider, cost, tokens = 0) {
	costs.otherProvider = provider;
	costs.other += cost ?? 0;
	costs.otherCalls += 1;
	costs.otherTokens += tokens;
}

/** The report a run prints at the end. */
export function costReport() {
	const usd = (n) => `$${n.toFixed(4)}`;
	const lines = [];
	if (costs.openrouterCalls)
		lines.push(
			`OpenRouter  ${usd(costs.openrouter)}  (${costs.openrouterCalls} calls, ${costs.promptTokens} in, ${costs.completionTokens} out)`
		);
	if (costs.otherCalls)
		lines.push(
			`${costs.otherProvider.padEnd(10)} ${usd(costs.other)}  (${costs.otherCalls} calls, ${costs.otherTokens} tokens)`
		);
	if (costs.speechChars)
		lines.push(
			`Speech      ${usd(costs.speechCost)}  (${costs.speechChars} characters via ${costs.speechProvider})`
		);
	const total = costs.openrouter + costs.speechCost + costs.other;
	lines.push(`Total       ${usd(total)}`);
	return lines.join('\n');
}
