import { box, confirm, path, progress, spinner, taskLog, tasks } from "@clack/prompts";
import { exec } from "node:child_process";
import { rm } from "node:fs";
import { FastLevel, RuntimeOptions } from ".";
import { _startFindHardCode, startFindHardCode } from "../findHardCode";
import { join } from "node:path";
import { setOutDir, validOutDir } from "./settings";

export interface RuntimeParams {
	patchPCParam: string[][];
}

export interface Options {
	distDir: string,
}

export async function main(options: RuntimeOptions) {
	if (options.fast >= FastLevel.step) {
		const needRun1PC = await confirm({
			message: "执行生成PC端修补代码?",
		});
		
		if (!needRun1PC) {
			return;
		}
	}
	
	box("生成PC端修补代码");

	if ((options.fast >= FastLevel.all) || validOutDir(options.outDir)) {
		await setOutDir(options);
	}

	await tasks([
		{
			title: '生成修补代码',
			task: async (message) => {
				await patchPC(options);
				return '生成修补代码完成';
			},
		},
	]);
}

async function patchPC(options: RuntimeOptions) {
	try {
		let result = await _startFindHardCode("pc", join(options.outDir, "abc.dmp"), join(options.outDir, "scripts"), join(options.outDir, "pcode"), false);
		let finalResult = result.filter(d => d) as string[][];
	
		// options.taskLogs.success("参数：" + finalResult);
	
		options.patchPCParam = finalResult;
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}

