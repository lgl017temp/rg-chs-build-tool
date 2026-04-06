import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

/**
 * 生成id
 * @param format 格式： standard: 有短杠， short： 无短杠
 */
export function uuid(format: "standard" | "short" = "short") {
	let id = (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
	if (format === "short") {
		id = id.replace(/-/g, "");
	}
	return id;
}
function S4() {
	return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

//6b74971c-3456-4fc5-a2cc-c6543274cfa1
const path = "out/AndroidManifest_.xml";
const outpath = "out/AndroidManifest.xml";

function main() {
	_main(path, outpath);
}

export function _main(path: string, outpath: string) {
	let buffer = readFileSync(path);
	let uuidIdx = buffer.findIndex((b, i) => {
		return buffer[i] === 0x36
		 && buffer[i + 1] === 0x62
		 && buffer[i + 2] === 0x37
		 && buffer[i + 3] === 0x34
		 && buffer[i + 4] === 0x39;
	});
	if (uuidIdx === -1) {
		console.error("未找到版本ID");
	} else {
		let newUUID = uuid("standard");
		console.log("新版本ID: " + newUUID);
		
		let bytes = newUUID.split("").map(c => c.charCodeAt(0));
		bytes.forEach((b, i) => {
			buffer[uuidIdx + i] = b;
		});
		writeFileSync(outpath, buffer);
	}
}

const moduleFilePath = fileURLToPath(import.meta.url);
const isDirectlyEvalByNode = moduleFilePath === process.argv[1];
if (isDirectlyEvalByNode) {
	main();
}
