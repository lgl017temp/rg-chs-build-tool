import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { resolve } from "path";
import ExcelJS, { ValueType } from "exceljs";
import { TransData } from "./types";
import { fileURLToPath } from "url";

const scriptPath = "out/scripts";
const scriptPhonePath = "out/phone/scripts";
const transExcelPath = "resource/RG-翻译表.xlsx"
const outExcelPath = "out/结果.xlsx";

function listFiles(path: string, filter: (name: string) => boolean, result: string[] = [], subPath: string[] = []) {
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

function extractText(path: string, result: TransData[]) {
	let str = readFileSync(path, "utf-8");
	let lines = str.split("\n");
	lines.forEach((line, i) => {
		let matches = line.match(/_\("(?:[^"\\]|\\.)*"/g);
		if (matches) {
			matches.forEach(match => {
				let text = match.replace(/^_\(/, "");
				text = eval(text);
				result.push({oriId: result.length + 1, oriText: text, line: i + 1, file: path, get loc() {return this.file + ":" + this.line}, use: false, force: false});
			})
		}

		let matches2 = line.match(/_n\("(?:[^"\\]|\\.)*","(?:[^"\\]|\\.)*"/g);
		if (matches2) {
			matches2.forEach(match => {
				let text = match.replace(/^_n\(/, "");
				let textArr = eval("[" + text + "]") as string[];
				let id = result.length + 1;
				result.push({oriId: id, oriText: textArr[0] + " (Singular)", line: i + 1, file: path, get loc() {return this.file + ":" + this.line}, use: false, force: false});
				result.push({oriId: id, oriText: textArr[1] + " (Plural)", line: i + 1, file: path, get loc() {return this.file + ":" + this.line}, use: false, force: false});
			})
		}
	});
	

	return result;
}

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

				oriId: -1,
				oriText: row.getCell(1).text,
				transText: row.getCell(2).text,
				transFont: row.getCell(2).font,
				transStyle: row.getCell(2).style,
				transLine: rowIdx,

				use: false,

				force: !!row.getCell(3).text,
			})
		}
	}

	return result;
}

function matchTrans(ori: TransData[], trans: TransData[]) {
	let result = trans.slice();

	let oriMap: Record<string, TransData> = {};
	ori.forEach(d => {
		oriMap[d.oriText] = d;
	});

	result.forEach((d, i) => {
		if (oriMap[d.oriText]) {
			let oriData = oriMap[d.oriText];
			d.file = oriData.file;
			d.line = oriData.line;
			d.oriId = oriData.oriId;
			oriData.use = true;

			// if (oriData.oriText.endsWith(" (Singular)")) {
			// 	result[i + 1].oriId = oriData.oriId;
			// } else if (oriData.oriText.endsWith(" (Plural)")) {
			// 	result[i - 1].oriId = oriData.oriId;
			// }
		}
	});

	result.push(...ori.filter(d => !d.use));

	return result;
}

async function writeExcel(data: TransData[], outExcelPath: string) {
	let wb = new ExcelJS.Workbook();
	let sheet = wb.addWorksheet();

	sheet.columns = [
		{header: "原文", width: 100},
		{header: "译文", width: 100},
		{header: "位置"},
		{header: "id(匹配复数)"},
	];

	data.forEach((d, i) => {
		let row = sheet.getRow(i + 2);

		row.getCell(1).value = d.oriText;
		row.getCell(1).font = {};

		row.getCell(2).value = d.transText;
		row.getCell(2).style = d.transStyle ?? {};
		row.getCell(2).font = d.transFont ?? {};

		if (!d.loc) {
			if (!d.force) {
				row.getCell(1).font.strike = true;
				row.getCell(1).style.fill = { type: "pattern", pattern: "solid", fgColor: {argb: 'FFCCCCCC'} };
			}
		} else if (!d.transLine) {
			// row.getCell(1).font.color = { argb: 'FFFF0000' };
			row.getCell(1).style.fill = { type: "pattern", pattern: "solid", fgColor: {argb: 'FFCCFFCC'} };
		}

		let cell = row.getCell(3);
		if (data[i].loc) {
			cell.font = {
				underline: true,
				color: { argb: 'FF0000FF' },
			}
			// cell.value = {
			// 	text: data[i].loc,
			// 	hyperlink: "file:///" + data[i].file.replace(/%/g, "&#37;"),
			// };
			cell.value = data[i].loc;
		}

		row.getCell(4).value = d.oriId;
	})

	await wb.xlsx.writeFile(outExcelPath);
}

async function main() {
	_main(scriptPath, scriptPhonePath, transExcelPath, outExcelPath);
}

export async function _main(scriptPath: string, scriptPhonePath: string, transExcelPath: string, outExcelPath: string) {
	let allFiles = listFiles(scriptPath, (name) => name.endsWith(".as"));
	let allPhoneFiles = listFiles(scriptPhonePath, (name) => name.endsWith(".as"));

	let oriList: TransData[] = [];
	allFiles.forEach(file => {
		extractText(file, oriList);
	});
	allPhoneFiles.forEach(file => {
		extractText(file, oriList);
	});
	oriList = oriList.filter((d, i, arr) => arr.findIndex(dd => dd.oriText === d.oriText) === i);

	let transList = await readTransExcel(transExcelPath);

	let result = matchTrans(oriList, transList);

	await writeExcel(result, outExcelPath);
}

const moduleFilePath = fileURLToPath(import.meta.url);
const isDirectlyEvalByNode = moduleFilePath === process.argv[1];
if (isDirectlyEvalByNode) {
	main();
}