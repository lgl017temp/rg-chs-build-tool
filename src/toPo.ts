import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";
import ExcelJS, { ValueType } from "exceljs";
import { TransData } from "./types";
import { fileURLToPath } from "url";

const transExcelPath = "out/结果.xlsx";
const poPath = "out/13_realmgrinder_es_ES.po"

async function readTransExcel(transExcelPath: string) {
	if (!existsSync(transExcelPath)) {
		console.log("翻译文件不存在");
		return [];
	}

	let wb = new ExcelJS.Workbook();
	await wb.xlsx.readFile(transExcelPath)
	
	let result: TransData[] = [];

	let sheet = wb.getWorksheet(1);
	if (sheet) {
		for (let rowIdx = 2; rowIdx <= sheet.lastRow!.number; rowIdx++) {
			let row = sheet.getRow(rowIdx);
			result.push({
				file: "",
				line: 0,
				get loc() {return this.line ? this.file + ":" + this.line : ""},

				oriText: row.getCell(1).text,
				oriId: +row.getCell(4).text,
				transText: row.getCell(2).text,
				transFont: row.getCell(2).font,
				transStyle: row.getCell(2).style,
				transLine: rowIdx,

				use: false,

				force: false,
			})
		}
	}

	return result;
}

function handlePlural(data: TransData[]) {
	let dataMap: Record<number, TransData> = {};

	let notMatchIdx = -10;
	data.forEach(d => {
		if (d.oriId === -1) {
			d.oriId = notMatchIdx;
			notMatchIdx--;
		}
		if (!dataMap[d.oriId]) {
			dataMap[d.oriId] = d;
		}

		if (d.oriText.endsWith(" (Singular)")) {
			dataMap[d.oriId].oriText = d.oriText.replace(/ \(Singular\)$/, "");
			dataMap[d.oriId].transText = d.transText || dataMap[d.oriId].oriText;
		} else if (d.oriText.endsWith(" (Plural)")) {
			dataMap[d.oriId].oriTextPlural = d.oriText.replace(/ \(Plural\)$/, "");
			dataMap[d.oriId].transTextPlural = d.transText || dataMap[d.oriId].oriTextPlural;

			if (!dataMap[d.oriId].transText) {
				dataMap[d.oriId].transText = d.transText || dataMap[d.oriId].oriText;
			}
		} else {
			dataMap[d.oriId].oriText = d.oriText;
			dataMap[d.oriId].transText = d.transText || dataMap[d.oriId].oriText;
		}
	})

	let dupMap: Record<string, TransData> = {};
	let newData = Object.values(dataMap);
	newData.forEach(d => {
		if (!dupMap[d.oriText]) {
			dupMap[d.oriText] = d;
		} else {
			if (d.oriTextPlural) {
				dupMap[d.oriText] = d;
			}
		}
	});

	return Object.values(dupMap);
}

function writePo(data: TransData[], poPath: string) {
	let result: string[] = [`msgid ""
msgstr ""
"Project-Id-Version: \\n"
"PO-Revision-Date: \\n"
"Last-Translator: \\n"
"Language-Team: \\n"
"Language: es_ES\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"X-Generator: Poedit 3.4.2\\n"`];

	data.forEach(d => {
		result.push("");
		if (d.oriText.includes("\n")) {
			result.push(`msgid ""`);
			result.push(`${handleMultiLine(d.oriText)}`);
		} else {
			result.push(`msgid ${handleStr(d.oriText)}`);
		}
		if (d.oriTextPlural) {
			if (d.oriTextPlural.includes("\n")) {
				result.push(`msgid_plural ""`);
				result.push(`${handleMultiLine(d.oriTextPlural)}`);
			} else {
				result.push(`msgid_plural ${handleStr(d.oriTextPlural)}`);
			}
		}
		if (d.transText) {
			let key = "msgstr";
			if (d.transTextPlural) {
				key = "msgstr[0]"
			}

			if (d.transText.includes("\n")) {
				result.push(`${key} ""`);
				result.push(`${handleMultiLine(d.transText)}`);
			} else {
				result.push(`${key} ${handleStr(d.transText)}`);
			}
		}
		if (d.transTextPlural) {
			if (d.transTextPlural.includes("\n")) {
				result.push(`msgstr[1] ""`);
				result.push(`${handleMultiLine(d.transTextPlural)}`);
			} else {
				result.push(`msgstr[1] ${handleStr(d.transTextPlural)}`);
			}
		}
	})

	writeFileSync(poPath, result.join("\n"), {encoding: "utf-8"});
}

function handleMultiLine(str: string) {
	let lines = str.split("\n");
	return lines.map((line, i) => {
		return handleStr(line + (i === lines.length - 1 ? "" : "\n"));
	}).join("\n");
}

function handleStr(str: string) {
	return "\"" + str.replace(/\\/g, "\\\\").replace(/\"/g, "\\\"").replace(/\n/g, "\\n").replace(/\t/g, "\\t") + "\"";
}

async function main() {
	_main(transExcelPath, poPath);
}

export async function _main(transExcelPath: string, poPath: string) {
	let transList = await readTransExcel(transExcelPath);
	transList = handlePlural(transList);

	writePo(transList, poPath);
}

const moduleFilePath = fileURLToPath(import.meta.url);
const isDirectlyEvalByNode = moduleFilePath === process.argv[1];
if (isDirectlyEvalByNode) {
	main();
}
