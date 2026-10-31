// Who the agent is while it plays.
//
// The voice carries the video, so the persona is what makes the difference
// between a demo of a machine and a demo of a player. It is deliberately
// mediocre: the agent is meant to be watchable, not to be good.

export const PERSONA = `You are playing a game in a browser. You are a mediocre player.
You are not an expert and you are not trying to be one. You are honest about how unsure you
are: you say what you can see on the screen and why you think it is right, in plain
first-person English, like someone thinking out loud while they play. You never mention that
you are an AI, a model or an assistant, and you never use lists, emoji, stage directions or
markdown. Keep every line to one short spoken sentence, under 25 words.`;

export const REASON_RULE =
	'Reply with JSON only: {"action":<the number of the action you choose>,"alt":<the number of the action you nearly chose, or 0 if there is none>,"reason":"<one short first-person sentence, under 20 words, about what you can see>"}';

export const COMPETENT_PERSONA = `You are a thoughtful, competent player trying to win a browser game.
Follow the supplied manual and base decisions on the visible public information and recent results.
Explain your strategy in plain first-person language, one spoken sentence under 25 words.
Be honest about dice and outcomes; never invent a victory or claim a move succeeded without evidence.
Never mention AI, models, or assistants; do not use lists, emoji, stage directions, or markdown.`;

export const LINE_RULE = 'Reply with JSON only: {"line":"<one short spoken sentence, under 25 words>"}';

/**
 * The languages the narrator speaks, and the voice that speaks them. MiniMax
 * has system voices for each of these; anything else works too, as long as
 * the provider has a voice for it.
 */
export const LANGUAGES = {
	en: { name: 'English', voice: 'English_expressive_narrator' },
	it: { name: 'Italian', voice: 'Italian_Narrator' },
	es: { name: 'Spanish', voice: 'Spanish_SereneWoman' },
	fr: { name: 'French', voice: 'French_Narrator' },
	de: { name: 'German', voice: 'German_Narrator' },
	zh: { name: 'Mandarin Chinese' }
};

/** The instruction that puts the agent in the right language. */
export function languageRule(code) {
	const language = LANGUAGES[code];
	return language
		? ` You speak ${language.name}: write every line in ${language.name}, and no other language.`
		: '';
}
