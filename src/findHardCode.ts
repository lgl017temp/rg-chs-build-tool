import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { isAbsolute, join, resolve } from "path";
import { PcodeInfo, ReplaceInfo } from "./types";

export const replaceList1: ReplaceInfo[] = [
	//法术名走翻译
	{env: "pc", search: {str: `Großes Gleichge`, addi: [], type: "method"}, result: [], pcode: {name: "getSpellName.pcode", modify: [
		{oper: "find", out: "endLine", cond: {type: "comm", comm: "returnvalue", idx: -1}, result: 0},
		{oper: "find", out: "startDelLine", cond: {type: "comm", comm: "pushscope", idx: 1}, result: 0},
		{oper: "delete", start: "{startDelLine} + 1", end: "{endLine} - 3"},
		{oper: "find", out: "endLine", cond: {type: "comm", comm: "returnvalue", idx: -1}, result: 0},
		{oper: "insert", line: "{endLine} - 1", str: [`callproperty QName(PackageNamespace(""),"_"), 1`]},
		{oper: "insert", line: "{startDelLine}", str: [`findpropstrict QName(PackageNamespace(""),"_")`]},
	]}},
	//buy all升级去空格, 放大字号
	{env: "all", search: {str: `_("BUY ALL");`, addi: [{str: `Upgrade`, type: "y"}], type: "method"}, result: [], pcode: {name: "initializeElement_upgrade.pcode", modify: [
		{oper: "find", out: "fontSizeLine1", cond: {type: "comm", comm: "pushbyte", param: "26", idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine1}", str: [`pushbyte 30`]},
		{oper: "find", out: "fontSizeLine2", cond: {type: "comm", comm: "pushbyte", param: "24", idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine2}", str: [`pushbyte 30`]},
		{oper: "find", out: "fontSizePhoneLine1", cond: {type: "comm", comm: "pushbyte", param: "14", idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizePhoneLine1}", str: [`pushbyte 18`]},
		{oper: "find", out: "fontSizePhoneLine2", cond: {type: "comm", comm: "pushdouble", param: "14", idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizePhoneLine2}", str: [`pushdouble 18`]},
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `"BUY ALL"`, idx: 1}, result: 0},
		{oper: "insert", line: "{strLine} + 1", str: [`pushstring " "`, `pushstring ""`, `callproperty QName(Namespace("http://adobe.com/AS3/2006/builtin"),"replace"), 2`]},
	]}},
	//buy all研究去空格, 放大字号
	{env: "all", search: {str: `_("BUY ALL");`, addi: [{str: `Research`, type: "y"}], type: "method"}, result: [], pcode: {name: "initializeElement_research.pcode", modify: [
		{oper: "find", out: "fontSizeLine1", cond: {type: "comm", comm: "pushbyte", param: "26", idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine1}", str: [`pushbyte 30`]},
		{oper: "find", out: "fontSizePhoneLine1", cond: {type: "comm", comm: "pushbyte", param: "14", idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizePhoneLine1}", str: [`pushbyte 18`]},
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `"BUY ALL"`, idx: 1}, result: 0},
		{oper: "insert", line: "{strLine} + 1", str: [`pushstring " "`, `pushstring ""`, `callproperty QName(Namespace("http://adobe.com/AS3/2006/builtin"),"replace"), 2`]},
	]}},
	//语言-改"中文", 检测中文
	{env: "all", search: {str: `Español`, addi: [], type: "cinit"}, result: [], pcode: {name: "translation.pcode", modify: [
		{oper: "find", out: "langLine", cond: {type: "comm", comm: "pushstring", param: `"Español"`, idx: 1}, result: 0},
		{oper: "replace", line: "{langLine}", str: [`pushstring "中文"`]},
		{oper: "find", out: "langMappingLine", cond: {type: "comm", comm: "pushstring", param: `"es-es"`, idx: 1}, result: 0},
		{oper: "replace", line: "{langMappingLine}", str: [`pushstring "zh-cn"`]},
	]}},
	//建筑提示ctrl+shift+click走翻译
	{env: "pc", search: {str: `(CTRL+SHIFT+Click)`, addi: [], type: "method"}, result: [], pcode: {name: "getTooltip.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `", (CTRL+SHIFT+Click)"`, idx: 1}, result: 0},
		{oper: "insert", line: "{strLine}", str: [`callproperty QName(PackageNamespace(""),"_"), 1`]},
		{oper: "insert", line: "{strLine} - 1", str: [`findpropstrict QName(PackageNamespace(""),"_")`]},
	]}},
	//花费逗号substr(1) (，取代, )
	{env: "all", search: {str: `, %0 %1 Coin`, addi: [{str: `isSelected`, type: "y"}, {str: `", %0 Ruby"`, type: "n"}], type: "method"}, result: [], pcode: {name: "getCost1.pcode", modify: [
		{oper: "find", out: "substrLine", cond: {type: "comm", comm: "pushbyte", param: `2`, idx: -1}, result: 0},
		{oper: "replace", line: "{substrLine}", str: [`pushbyte 1`]},
	]}},
	//花费逗号substr(1) (，取代, )
	{env: "all", search: {str: `, %0 %1 Coin`, addi: [{str: `dispose()`, type: "y"}, {str: `", %0 Ruby"`, type: "n"}], type: "method"}, result: [], pcode: {name: "getCost2.pcode", modify: [
		{oper: "find", out: "substrLine", cond: {type: "comm", comm: "pushbyte", param: `2`, idx: -1}, result: 0},
		{oper: "replace", line: "{substrLine}", str: [`pushbyte 1`]},
	]}},
	//花费逗号substr(1) (，取代, )
	{env: "all", search: {str: `, %0 %1 Coin`, addi: [{str: `", %0 Ruby"`, type: "y"}], type: "method"}, result: [], pcode: {name: "getCost3.pcode", modify: [
		{oper: "find", out: "substrLine", cond: {type: "comm", comm: "pushbyte", param: `2`, idx: -1}, result: 0},
		{oper: "replace", line: "{substrLine}", str: [`pushbyte 1`]},
	]}},
	//缩小字体(建筑) (buy10000(PC), buysmart(phone))
	{env: "all", search: {str: `textRendererProperties.textAlign = "center"`, addi: [{str: `_("BUY 10000");`, type: "y"}], type: "method"}, result: [], pcode: {name: "initializeElement_buyN.pcode", modify: [
		{oper: "find", out: "fontSizeLine1", cond: {type: "comm", comm: "pushbyte", param: `38`, idx: -1}, result: 0},
		{oper: "replace", line: "{fontSizeLine1}", str: [`pushbyte 34`]},
		{oper: "find", out: "fontSizeLine2", cond: {type: "comm", comm: "pushbyte", param: `32`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine2}", str: [`pushbyte 28`]},
	]}},
	//Mute走翻译
	{env: "pc", search: {str: `"Mute";`, addi: [], type: "method"}, result: [], pcode: {name: "initializeElement_option.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `"Mute"`, idx: 1}, result: 0},
		{oper: "insert", line: "{strLine}", str: [`callproperty QName(PackageNamespace(""),"_"), 1`]},
		{oper: "insert", line: "{strLine} - 1", str: [`findpropstrict QName(PackageNamespace(""),"_")`]},
	]}},
	//缩小字体 (buyAll不居中)
	{env: "pc", search: {str: `_("BUY ALL").replace(" ","\\n");`, addi: [{str: `Buildings`, type: "n"}], type: "method"}, result: [], pcode: {name: "initializeElement_buyAllPC.pcode", modify: [
		{oper: "find", out: "fontSizeLine", cond: {type: "comm", comm: "pushbyte", param: `28`, idx: -1}, result: 0},
		{oper: "replace", line: "{fontSizeLine}", str: [`pushbyte 26`]},
		{oper: "find", out: "offsetYLine", cond: {type: "comm", comm: "pushbyte", param: `2`, idx: -1}, result: 0},
		{oper: "replace", line: "{offsetYLine}", str: [`pushbyte 0`]},
	]}},
	//Catalyst描述中改中文逗号
	{env: "all", search: {str: `> 0 ? ", " : ""`, addi: [], type: "method"}, result: [], pcode: {name: "catalystDescription.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `", "`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine}", str: [`pushstring "，"`]},
	]}},
	//Dragon's Breath描述中改中文逗号
	{env: "all", search: {str: `"\\n\\n" + _("Current Bonus: ");`, addi: [], type: "method"}, result: [], pcode: {name: "dragonsBreathDescription.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `", "`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine}", str: [`pushstring "，"`]},
	]}},
	//ResearchD描述中改中文逗号
	{env: "all", search: {str: `+= _("Increases %0 production by %1%."`, addi: [], type: "method"}, result: [], pcode: {name: "researchDDescription.pcode", modify: [
		{oper: "find", out: "strLine1", cond: {type: "comm", comm: "pushstring", param: `", "`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine1}", str: [`pushstring "，"`]},
		{oper: "find", out: "strLine2", cond: {type: "comm", comm: "pushstring", param: `", "`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine2}", str: [`pushstring "，"`]},
	]}},
	//A270描述中改中文逗号
	{env: "all", search: {str: `"\\n\\n" + _("Currently empowering:`, addi: [], type: "method"}, result: [], pcode: {name: "researchA270Description.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `", "`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine}", str: [`pushstring "，"`]},
	]}},
	//退位字号
	{env: "phone", search: {str: `_("Abdication");`, addi: [], type: "method"}, result: [], pcode: {name: "abdication.pcode", modify: [
		{oper: "find", out: "fontSizeLine1", cond: {type: "comm", comm: "pushbyte", param: `12`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine1}", str: [`pushbyte 18`]},
		{oper: "find", out: "fontSizeLine2", cond: {type: "comm", comm: "pushbyte", param: `12`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine2}", str: [`pushbyte 16`]},
	]}},
	//重生/飞升字号
	{env: "phone", search: {str: `.text = _("Reincarnation");`, addi: [], type: "method"}, result: [], pcode: {name: "reincarnation.pcode", modify: [
		{oper: "find", out: "fontSizeLine1", cond: {type: "comm", comm: "pushbyte", param: `12`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine1}", str: [`pushbyte 18`]},
		{oper: "find", out: "fontSizeLine2", cond: {type: "comm", comm: "pushbyte", param: `12`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine2}", str: [`pushbyte 16`]},
	]}},
	//高级选项框高度
	{env: "phone", search: {str: `"Scientific Notation"`, addi: [], type: "method"}, result: [], pcode: {name: "advOptions.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `"Mute"`, idx: 1}, result: 0},
		{oper: "insert", line: "{strLine}", str: [`callproperty QName(PackageNamespace(""),"_"), 1`]},
		{oper: "insert", line: "{strLine} - 1", str: [`findpropstrict QName(PackageNamespace(""),"_")`]},
		// {oper: "find", out: "heightLine1", cond: {type: "comm", comm: "pushshort", param: `580`, idx: 1}, result: 0},
		// {oper: "replace", line: "{heightLine1}", str: [`pushshort 610`]},
		// {oper: "find", out: "heightLine2", cond: {type: "comm", comm: "pushshort", param: `275`, idx: 1}, result: 0},
		// {oper: "replace", line: "{heightLine2}", str: [`pushshort 245`]},
	]}},
	//缩小字体(皇家交易) (buysmart)
	{env: "phone", search: {str: `textRendererProperties.textAlign = "center"`, addi: [{str: `_("BUY 10000");`, type: "n"}, {str: `_("BUY 1000");`, type: "y"}, {str: `includeInLayout`, type: "y"}], type: "method"}, result: [], pcode: {name: "initializeElement_buyN_exchange.pcode", modify: [
		{oper: "find", out: "fontSizeLine", cond: {type: "comm", comm: "pushbyte", param: `26`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine}", str: [`pushbyte 22`]},
	]}},
	//缩小字体(考古) (buysmart)
	{env: "phone", search: {str: `textRendererProperties.textAlign = "center"`, addi: [{str: `_("BUY 10000");`, type: "n"}, {str: `_("BUY 1000");`, type: "y"}, {str: `includeInLayout`, type: "n"}], type: "method"}, result: [], pcode: {name: "initializeElement_buyN_excavation.pcode", modify: [
		{oper: "find", out: "fontSizeLine", cond: {type: "comm", comm: "pushdouble", param: `18`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine}", str: [`pushdouble 16`]},
	]}},
	//建筑字号
	{env: "phone", search: {str: `.toPrecision(3) + "%";`, addi: [], type: "method"}, result: [], pcode: {name: "initializeElement_buildings.pcode", modify: [
		{oper: "find", out: "fontSizeLine1", cond: {type: "comm", comm: "pushbyte", param: `18`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine1}", str: [`pushbyte 20`]},
		{oper: "find", out: "fontSizeLine2", cond: {type: "comm", comm: "pushbyte", param: `18`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine2}", str: [`pushbyte 20`]},
		{oper: "find", out: "fontSizeLine3", cond: {type: "comm", comm: "pushbyte", param: `16`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine3}", str: [`pushbyte 20`]},
		{oper: "find", out: "fontSizeLine4", cond: {type: "comm", comm: "pushbyte", param: `16`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine4}", str: [`pushbyte 20`]},
		{oper: "find", out: "fontSizeLine5", cond: {type: "comm", comm: "pushbyte", param: `12`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine5}", str: [`pushbyte 20`]},
		{oper: "find", out: "fontSizeLine6", cond: {type: "comm", comm: "pushbyte", param: `12`, idx: 1}, result: 0},
		{oper: "replace", line: "{fontSizeLine6}", str: [`pushbyte 20`]},
		{oper: "find", out: "ySubLine1", cond: {type: "comm", comm: "pushbyte", param: `4`, idx: 1}, result: 0},
		{oper: "replace", line: "{ySubLine1}", str: [`pushbyte 8`]},
		{oper: "find", out: "ySubLine2", cond: {type: "comm", comm: "pushbyte", param: `6`, idx: 1}, result: 0},
		{oper: "replace", line: "{ySubLine2}", str: [`pushbyte 8`]},
		{oper: "find", out: "ySubLine3", cond: {type: "comm", comm: "pushbyte", param: `8`, idx: 1}, result: 0},
		{oper: "replace", line: "{ySubLine3}", str: [`pushbyte 8`]},
		{oper: "find", out: "ySubBoolLine1S", cond: {type: "comm", comm: "subtract", idx: 1}, result: 0},
		{oper: "find", out: "ySubBoolLine1", cond: {type: "comm", comm: "pushtrue", idx: 1, after: "{ySubBoolLine1S}"}, result: 0},
		{oper: "replace", line: "{ySubBoolLine1}", str: [`pushfalse`]},
		{oper: "find", out: "ySubBoolLine2S", cond: {type: "comm", comm: "subtract", idx: 2}, result: 0},
		{oper: "find", out: "ySubBoolLine2", cond: {type: "comm", comm: "pushtrue", idx: 1, after: "{ySubBoolLine2S}"}, result: 0},
		{oper: "replace", line: "{ySubBoolLine2}", str: [`pushfalse`]},
	]}},
	//E5625gold改coin
	{env: "all", search: {str: `_("Gold")`, addi: [{str: `_("Loan Sharking");`, type: "y"}], type: "method"}, result: [], pcode: {name: "researchE5625Progress.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `"Gold"`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine}", str: [`pushstring "Currencies"`]},
	]}},
	//统计最大助手去掉最后句号
	{env: "all", search: {str: `"Assistants (Max): %0"`, addi: [], type: "method"}, result: [], pcode: {name: "statistics.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `"."`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine}", str: [`pushstring ""`]},
	]}},
	//导出模板编码
	{env: "all", search: {str: `"iso-8859-1"`, addi: [], type: "method"}, result: [], pcode: {name: "exportTemplate.pcode", modify: [
		{oper: "find", out: "strLine", cond: {type: "comm", comm: "pushstring", param: `"iso-8859-1"`, idx: 1}, result: 0},
		{oper: "replace", line: "{strLine}", str: [`pushstring "utf-8"`]},
	]}},
	//红宝石确认
	{env: "all", search: {str: `["Yes","No"]`, addi: [], type: "method"}, result: [], pcode: {name: "buyRubyBoundsConfirm.pcode", modify: [
		{oper: "find", out: "yesLine", cond: {type: "comm", comm: "pushstring", param: `"Yes"`, idx: 2}, result: 0},
		{oper: "insert", line: "{yesLine}", str: [`callproperty QName(PackageNamespace(""),"_"), 1`]},
		{oper: "insert", line: "{yesLine} - 1", str: [`findpropstrict QName(PackageNamespace(""),"_")`]},
		{oper: "find", out: "noLine", cond: {type: "comm", comm: "pushstring", param: `"No"`, idx: 2}, result: 0},
		{oper: "insert", line: "{noLine}", str: [`callproperty QName(PackageNamespace(""),"_"), 1`]},
		{oper: "insert", line: "{noLine} - 1", str: [`findpropstrict QName(PackageNamespace(""),"_")`]},
	]}},
];

export const replaceList2: ReplaceInfo[] = [
	//TODO 关联多文件检索
	{env: "pc", search: {str: `§-!4§[param1].§<!7§`, addi: [], type: "method"}, result: [], pcode: {name: "showAllFactionUpgrades.pcode", modify: [
		{oper: "find", out: "startLine", cond: {type: "comm", comm: "pushscope", idx: 1}, result: 0},
		{oper: "find", out: "endLine", cond: {type: "comm", comm: "returnvalue", idx: 1}, result: 0},
		{oper: "delete", start: "{startLine} + 1", end: "{endLine} - 1"},
		{oper: "insert", line: "{startLine}", str: [`pushtrue`]},
	]}},
]

export function listFiles(path: string, filter: (name: string) => boolean, result: string[] = [], subPath: string[] = []) {
	let finalPath = [path, ...subPath].join("/");

	if (!existsSync(finalPath)) {
		console.log("源码目录不存在");
		return [];
	}

	let files = readdirSync(finalPath);

	files.forEach(file => {
		let filePath = finalPath + "/" + file;

		let stat = statSync(filePath);
		if (stat.isDirectory()) {
			listFiles(path, filter, result, [...subPath, file]);
		} else {
			if (filter(filePath)) {
				result.push(resolve(filePath));
			}
		}
	})
	

	return result;
}

export function findFuncs(replaceList: ReplaceInfo[], env: "pc" | "phone", path: string, abc: Record<string, string>, scriptPath: string) {
	let str = readFileSync(path, "utf-8");

	let lastFunc = "";
	let shortPath = path.substring(path.indexOf(scriptPath.replace(/\//g, "\\")) + scriptPath.length + 1);
	let classPath = shortPath.replace(/\\/g, ":").replace(/\.as$/, "");
	classPath = classPath.replace(/%[0-9A-F][0-9A-F]/g, (val) => {
		return decodeURIComponent(val);
	});
	let pureClassPath = classPath.replace(/§/g, "");

	let lines = str.split("\n");
	lines.forEach((line, i) => {
		let match = line.match(/function §(.*)§\(/);
		if (match) {
			lastFunc = match[1];
		}
		
		replaceList.filter(info => info.env === env || info.env === "all").forEach(info => {
			let find = line.includes(info.search.str);
			if (find) {
				let res = info.search.addi.every(addi => addi.type === "y" ? str.includes(addi.str) : !str.includes(addi.str));
				if (res) {
					let method = "";
					if (info.search.type === "method") {
						method = pureClassPath + ":" + lastFunc;
					} else {
						method = pureClassPath + ":" + "cinit";
					}
					info.result.push({
						filePath: path,
						class: classPath,
						method: method,
						methodBodyIdx: abc[method],
					});
				}
			}
		})
	});
}

export function readABC(abcPath: string) {
	let result: Record<string, string> = {};

	let str = readFileSync(abcPath, "utf-8");
	let lines = str.split("\n");
	lines.forEach(line => {
		if (line) {
			let [key, val] = line.split("\t");
			result[key] = val.replace("\r", "");
		}
	});

	return result;
}

export function genPcode(replace: ReplaceInfo, outPath: string) {
	let replaceResult = replace.result[0];

	let oriPcodesInfo: PcodeInfo[] = [];

	//#region 读取搜索pcode
	let str = readFileSync(replaceResult.filePath.replace(/\.as$/, ".pcode"), "utf-8");

	let find = replace.search.type === "cinit";
	let start = false;
	let findMethodName = replaceResult.method.split(":").pop();

	let lines = str.split("\n");
	lines.forEach((line, i) => {
		line = line.replace("\r", "");
		let match = line.match(/function (.*)\(/);
		if (match) {
			let methodName = match[1].replace(/§/g, "");
			if (replace.search.type === "cinit") {
				find = false;
			} else {
				if (methodName === findMethodName) {
					find = true;
				} else {
					find = false;
				}
			}
		}
		if (find && line.match(/^\s+?method$/)) {
			start = true;
			find = false;
		}
		
		if (start) {
			let comm = line.match(/\w+/)?.[0] ?? "";
			let paramPosi = line.indexOf(comm) + comm.length + 1;
			let params = line.length > paramPosi ? line.substring(paramPosi) : "";

			oriPcodesInfo.push({
				str: line,
				ascLine: 0,
				descLine: 0,
				comm: comm,
				params: params,
				commAscIdx: 0,
				commDescIdx: 0,
				commParamAscIdx: 0,
				commParamDescIdx: 0,
			});
		}

		if (start && line.includes("end ; method")) {
			start = false;
		}
	});
	//#endregion

	let resultPcodesInfo: PcodeInfo[] = oriPcodesInfo.map(info => ({...info}));
	indexPcode(resultPcodesInfo);
	
	//#region 修补pcode
	let variables: Record<string, string | number> = {};
	let finish = replace.pcode.modify.every(modify => {
		try {
			if (modify.oper === "find") {
				let result = 0;
				let afterIdx = 0;
				resultPcodesInfo.some((info) => {
					if (modify.cond.type === "line") {
						if (modify.cond.line === info.ascLine || modify.cond.line === info.descLine) {
							result = info.ascLine;
							return true;
						}
					} else if (modify.cond.type === "comm") {
						let after = 0;
						if (modify.cond.after) {
							let afterExpr = modify.cond.after.replace(/{(.+)}/g, (str, key) => {
								if (variables[key] === undefined) {
									throw new Error("no variables found: " + key);
								}
								return "" + variables[key];
							});
							after = eval(afterExpr);
						}

						if (info.ascLine < after) {
							return false;
						}
						if (!modify.cond.param) {
							if (modify.cond.comm === info.comm) {
								afterIdx++;

								if (modify.cond.idx === afterIdx || modify.cond.idx === info.commDescIdx) {
									result = info.ascLine;
									return true;
								}
							}
						} else if (modify.cond.param) {
							if (modify.cond.comm === info.comm && modify.cond.param === info.params.trim()) {
								afterIdx++;
								
								if (modify.cond.idx === afterIdx || modify.cond.idx === info.commParamDescIdx) {
									result = info.ascLine;
									return true;
								}
							}
						}
					}
				})
				if (result === 0) {
					throw new Error("can't find line: " + JSON.stringify(modify));
				}
				variables[modify.out] = result;
			} else if (modify.oper === "delete") {
				let startExpr = modify.start.replace(/{(.+)}/g, (str, key) => {
					if (variables[key] === undefined) {
						throw new Error("no variables found: " + key);
					}
					return "" + variables[key];
				});
				let endExpr = modify.end.replace(/{(.+)}/g, (str, key) => {
					if (variables[key] === undefined) {
						throw new Error("no variables found: " + key);
					}
					return "" + variables[key];
				});
				let start = eval(startExpr);
				let end = eval(endExpr);

				if (start === 0 || start > resultPcodesInfo.length
					|| end === 0 || end > resultPcodesInfo.length) {
					throw new Error(`lineIdx out of range: start: ${start}, end: ${end}, range: 1-${resultPcodesInfo.length}`);
				}
				if (end < start) {
					throw new Error(`end before start`);
				}

				resultPcodesInfo.splice(start - 1, end - start + 1);
				indexPcode(resultPcodesInfo);
			} else if (modify.oper === "insert") {
				let lineExpr = modify.line.replace(/{(.+)}/g, (str, key) => {
					if (variables[key] === undefined) {
						throw new Error("no variables found: " + key);
					}
					return "" + variables[key];
				});
				let str = modify.str.map(s => s.replace(/{(.+)}/g, (str, key) => {
					if (variables[key] === undefined) {
						throw new Error("no variables found: " + key);
					}
					return "" + variables[key];
				}));
				let line = eval(lineExpr);

				if (line < 0 || line > resultPcodesInfo.length) {
					throw new Error(`lineIdx out of range: line: ${line}, range: 0-${resultPcodesInfo.length}`);
				}

				let temp = str.map(s => {
					let comm = s.match(/\w+/)?.[0] ?? "";
					let paramPosi = s.indexOf(comm) + comm.length + 1;
					let params = s.length > paramPosi ? s.substring(paramPosi) : "";
					return {
						ascLine: 0,
						descLine: 0,
						comm: comm,
						params: params,
						commAscIdx: 0,
						commDescIdx: 0,
						commParamAscIdx: 0,
						commParamDescIdx: 0,
						str: s,
					}
				})
				resultPcodesInfo.splice(line, 0, ...temp);
				indexPcode(resultPcodesInfo);
			} else if (modify.oper === "replace") {
				let lineExpr = modify.line.replace(/{(.+)}/g, (str, key) => {
					if (variables[key] === undefined) {
						throw new Error("no variables found: " + key);
					}
					return "" + variables[key];
				});
				let str = modify.str.map(s => s.replace(/{(.+)}/g, (str, key) => {
					if (variables[key] === undefined) {
						throw new Error("no variables found: " + key);
					}
					return "" + variables[key];
				}));
				let line = eval(lineExpr);

				if (line < 0 || line > resultPcodesInfo.length) {
					throw new Error(`lineIdx out of range: line: ${line}, range: 0-${resultPcodesInfo.length}`);
				}

				let temp = str.map(s => {
					let comm = s.match(/\w+/)?.[0] ?? "";
					let paramPosi = s.indexOf(comm) + comm.length + 1;
					let params = s.length > paramPosi ? s.substring(paramPosi) : "";
					return {
						ascLine: 0,
						descLine: 0,
						comm: comm,
						params: params,
						commAscIdx: 0,
						commDescIdx: 0,
						commParamAscIdx: 0,
						commParamDescIdx: 0,
						str: s,
					}
				})
				resultPcodesInfo.splice(line - 1, 1, ...temp);
				indexPcode(resultPcodesInfo);
			}
			return true;
		} catch (error) {
			console.error(`patch pcode fail, rollback: ${replace.pcode.name},`, error);
			return false;
		}
	});
	if (!finish) {
		resultPcodesInfo = oriPcodesInfo;
	}
	//#endregion

	// if (replaceList.indexOf(replace) === replaceList.length - 1) {
	// 	console.log(replace, finish, variables);
	// }

	let outStr = resultPcodesInfo.map(info => info.str).join("\n");
	if (!existsSync(outPath)) {
		mkdirSync(outPath);
	}
	writeFileSync(outPath + "/" + replace.pcode.name, outStr, {encoding: "utf-8"});
}

export function indexPcode(pcodesInfo: PcodeInfo[]) {
	let commCount: Record<string, number> = {};
	let commParamCount: Record<string, number> = {};
	
	pcodesInfo.forEach((info, i) => {
		let comm = info.comm;
		if (!commCount[comm]) {
			commCount[comm] = 0;
		}
		commCount[comm]++;

		let commParam = info.comm + "|" + info.params.trim();
		if (!commParamCount[commParam]) {
			commParamCount[commParam] = 0;
		}
		commParamCount[commParam]++;

		info.ascLine = i + 1;
		info.descLine = -pcodesInfo.length + i;
		info.commAscIdx = commCount[comm];
		info.commParamAscIdx = commParamCount[commParam];
	})
	pcodesInfo.forEach((info, i) => {
		let comm = info.comm;
		let commParam = info.comm + "|" + info.params.trim();
		info.commDescIdx = -(commCount[comm] - info.commAscIdx + 1);
		info.commParamDescIdx = -(commParamCount[commParam] - info.commParamAscIdx + 1);
	})
}

export async function startFindHardCode(env: "pc" | "phone", abcPath: string, scriptPath: string, pcodeFilePrefix: string) {
	let args = await _startFindHardCode(env, abcPath, scriptPath, pcodeFilePrefix, true);
	return args.filter(d => d).map(d => {
		if (d![0].includes(" ") || d![0].includes("&0")) {
			return `\\"${d![0]}\\" ../${d![1]} ${d![2]}`;
		} else {
			return `${d![0]} ../${d![1]} ${d![2]}`;
		}
	}).join(" ");
}

export async function _startFindHardCode(env: "pc" | "phone", abcPath: string, scriptPath: string, pcodeFilePrefix: string, toPackageJson: boolean) {
	let args = process.argv.slice(2);
	let replaceList = replaceList1.slice();
	if (args[0] && args[0] === "cheat") {
		replaceList.push(...replaceList2);
	}
	replaceList = replaceList.map(d => ({...d, result: []}));

	let abcInfo = readABC(abcPath);

	let allFiles = listFiles(scriptPath, (name) => name.endsWith(".as"));

	allFiles.forEach(file => {
		findFuncs(replaceList, env, file, abcInfo, scriptPath);
	});

	let result = replaceList.filter(info => info.env === env || info.env === "all").map(replace => {
		if (!replace.result.length) {
			console.warn("find code fail: " + JSON.stringify(replace));
			return;
		}
		if (replace.result.length > 1) {
			console.warn("find code in multi place: " + JSON.stringify(replace));
			return;
		}

		let dup = replaceList.filter(r => r.result[0] && r.result[0].method === replace.result[0].method);
		if (dup.length > 1) {
			console.warn("multi replace in same place: " + JSON.stringify(dup));
			return;
		}

		// if (replace.pcode.name === "buyRubyBoundsConfirm.pcode") {
		// 	console.log(replace);
		// }
		genPcode(replace, pcodeFilePrefix);
		
		return [replace.result[0].class.replace(/:/g, ".").replace(/\"/g, "\\\\\\\""), toPackageJson ? pcodeFilePrefix + "/" + replace.pcode.name : join(pcodeFilePrefix, replace.pcode.name), replace.result[0].methodBodyIdx];
	});

	// console.log(JSON.stringify(replaceList));
	return result;
}

