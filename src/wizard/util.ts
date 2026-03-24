import { isCancel, path, PathOptions } from "@clack/prompts";
import { Options, RuntimeOptions } from ".";
import { resolve } from "node:path";

export async function setPath(options: RuntimeOptions, key: keyof Options, pathOption: PathOptions) {
	const value = await path({
		...pathOption,

		initialValue: options[key],
	});

	if (isCancel(value)) {
		return null;
	}

	let fullPath = resolve(value);
	options[key] = fullPath;
	return fullPath;
}