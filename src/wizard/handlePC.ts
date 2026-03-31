// rmdir /s /q .\out\scripts

import { box, confirm, path, progress, spinner, taskLog, tasks } from "@clack/prompts";
import { exec } from "node:child_process";
import { rm } from "node:fs";
import { RuntimeOptions } from ".";
import { startFindHardCode } from "../findHardCode";
import { join } from "node:path";
import { setOutDir, validOutDir } from "./settings";

export interface RuntimeParams {
	patchPCParam: string;
}

export interface Options {
	distDir: string,
}

export async function main(options: RuntimeOptions) {
	if (!options.fast) {
		const needRun1PC = await confirm({
			message: "执行PC端?",
		});
		
		if (!needRun1PC) {
			return;
		}
	}
	
	box("生成PC端修补代码");

	if (!options.fast || validOutDir(options.outDir)) {
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
		let result = await startFindHardCode("pc", join(options.outDir, "abc.dmp"), join(options.outDir, "scripts"), join(options.outDir, "pcode"));
	
		options.taskLogs.success("参数：" + result);
	
		options.patchPCParam = result;
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}

