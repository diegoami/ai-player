// Pulling a JSON answer out of a reply that may be fenced or chatty.

/** The first JSON object in the text. */
export function parseJsonLoose(text) {
	const fenced = String(text).match(/```(?:json)?\s*([\s\S]*?)```/i);
	const body = fenced ? fenced[1] : String(text);
	const start = body.indexOf('{');
	const end = body.lastIndexOf('}');
	if (start < 0 || end < start) throw new Error(`No JSON in reply: ${String(text).slice(0, 200)}`);
	return JSON.parse(body.slice(start, end + 1));
}
