import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";
import { ReplaceInfo } from "./types";
import { startFindHardCode } from "./findHardCode";

const paramPrefix = `cd ./FFdec2 && ffdec.bat -replace ../resource/RealmGrinderDesktop.swf ../out/RealmGrinderDesktop.swf 13 ../out/13_realmgrinder_es_ES_compress.mo 3 ../resource/font_pc/3_SourceSansSmall.ttf 15 ../resource/font_pc/15_Tkachev-Liony-Bold.ttf 20 ../resource/font_pc/20_Tkachev-Liony.ttf 14 ../resource/font_pc/MicrosoftYaHei.ttf 16 ../resource/font_pc/MicrosoftYaHei.ttf 17 ../resource/font_pc/MicrosoftYaHei.ttf 18 ../resource/font_pc/MicrosoftYaHei.ttf 19 ../resource/font_pc/MicrosoftYaHei.ttf `
// const pcodeFilePrefix = "../resource/script/";
const pcodeFilePrefix = "out/pcode";
const scriptPath = "out/scripts";
const abcPath = "out/abc.dmp"

async function main() {
	let result = await startFindHardCode("pc", abcPath, scriptPath, pcodeFilePrefix);

	// console.log("用下面的输出替换package.json中replaceTrans的内容")
	// console.log("==============================================")
	// console.log(paramPrefix + result);
	// console.log("==============================================")

	let json = readFileSync("package.json", {encoding: "utf-8"});
	json = json.replace(/\n(\s+)\"replaceTrans\": [\s\S]+?\n/, `\n$1"replaceTrans": "${paramPrefix + result}",\n`);
	writeFileSync("package.json", json, {encoding: "utf-8"});
}

main();

