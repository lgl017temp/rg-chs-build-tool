import { isCancel, path, PathOptions } from "@clack/prompts";
import { Options, RuntimeOptions } from ".";
import { resolve } from "node:path";
import iconv from "iconv-lite";

export async function setPath(options: RuntimeOptions, key: keyof Options | "swfPhonePath", pathOption: PathOptions) {
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

export function gb2312Str(data: Buffer) {
	return iconv.decode(data, 'gb2312');
}