// rmdir /s /q .\out\scripts

import { confirm, path, progress, spinner, taskLog, tasks } from "@clack/prompts";
import { exec } from "node:child_process";
import { rm } from "node:fs";
import { RuntimeOptions } from ".";

export interface Options {
	distDir: string,
}

export async function main(options: RuntimeOptions) {
	const needRun0PC = await confirm({
		message: "执行PC端更新?",
	});

	if (!needRun0PC) {
		return;
	}

	await tasks([
		{
			title: '删除旧文件',
			task: async () => {
				await deleteOldFile(options);
				return '删除旧文件完成';
			},
		},
	]);
}

