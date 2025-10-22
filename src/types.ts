import ExcelJS, { ValueType } from "exceljs";

export interface TransData {
	oriId: number;
	oriText: string;
	oriTextPlural?: string;
	line: number;
	file: string;
	readonly loc: string;

	transText?: string;
	transTextPlural?: string;
	transStyle?: Partial<ExcelJS.Style>;
	transFont?: Partial<ExcelJS.Font>;
	transLine?: number;

	use: boolean;

	force: boolean;
}

export interface ReplaceInfo {
	env: "pc" | "phone" | "all",

	search: {
		str: string;
		addi: {str: string, type: "y" | "n"}[];
		type: "method" | "cinit";
	};

	pcode: {
		name: string;
		modify: PcodeModify[];
	};

	result: {
		filePath: string;
		class: string;
		method: string;
		methodBodyIdx: string;
	}[];
}

export type PcodeModify = PcodeModifyFind | PcodeModifyDelete | PcodeModifyInsert | PcodeModifyReplace;
export interface PcodeModifyFind {
	oper: "find";
	cond: {
		type: "line";
		line: number;
	} | {
		type: "comm";
		comm: string;
		idx: number;
		param?: string;
		after?: string;
	};
	out: string;

	result: number;
}
export interface PcodeModifyDelete {
	oper: "delete";
	start: string;
	end: string;
}
export interface PcodeModifyInsert {
	oper: "insert";
	line: string;
	str: string[];
}
export interface PcodeModifyReplace {
	oper: "replace";
	line: string;
	str: string[];
}

export interface PcodeInfo {
	str: string;
	ascLine: number;
	descLine: number;
	comm: string;
	params: string;
	commAscIdx: number;
	commDescIdx: number;
	commParamAscIdx: number;
	commParamDescIdx: number;
}