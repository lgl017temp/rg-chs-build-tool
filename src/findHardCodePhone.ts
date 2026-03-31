import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";
import { ReplaceInfo } from "./types";
import { startFindHardCode } from "./findHardCode";

const paramPrefix = `cd ./FFdec2 && ffdec.bat -replace ../resource/RealmGrinderMobile.swf ../out/assets/RealmGrinderMobile.swf 13 ../out/13_realmgrinder_es_ES_compress.mo 3 ../resource/font_phone/3_class_3_SourceSansProSemibold.ttf 16 ../resource/font_phone/16_class_1770_Liony2.ttf 21 ../resource/font_phone/21_class_1773_Liony2.ttf 15 ../resource/font_phone/MicrosoftYaHei.cff 17 ../resource/font_phone/SanJiDianHeiJianTi-Zhong-2.ttf 18 ../resource/font_phone/MicrosoftYaHei.cff 19 ../resource/font_phone/MicrosoftYaHei.cff 20 ../resource/font_phone/MicrosoftYaHei.cff `
const pcodeFilePrefix = "out/pcodePhone";
const scriptPath = "out/phone/scripts";
const abcPath = "out/abcPhone.dmp"

async function main() {
	let result = await startFindHardCode("phone", abcPath, scriptPath, pcodeFilePrefix);

	// console.log("用下面的输出替换package.json中replaceTransMobile的内容")
	// console.log("==============================================")
	// console.log(paramPrefix + result);
	// console.log("==============================================")

	let json = readFileSync("package.json", {encoding: "utf-8"});
	json = json.replace(/\n(\s+)\"replaceTransMobile\": [\s\S]+?\n/, `\n$1"replaceTransMobile": "${paramPrefix + result}",\n`);
	writeFileSync("package.json", json, {encoding: "utf-8"});
}

main();



