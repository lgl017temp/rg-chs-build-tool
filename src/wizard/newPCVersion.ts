import { confirm, path, progress, spinner, taskLog, tasks } from "@clack/prompts";
import { spawn } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { gb2312Str, RuntimeOptions } from ".";
import * as iconv from 'iconv-lite';
import { join, resolve } from "node:path";
import { setOutDir, setSwfPCPath } from "./settings";

export interface Options {
	outDir: string,
	ffdecDir: string,

	swfPCPath: string,
}

export async function main(options: RuntimeOptions) {
	if (!options.fast) {
		const needRun0PC = await confirm({
			message: "执行PC端更新?",
		});

		if (!needRun0PC) {
			return;
		}

		await setOutDir(options);
		await setSwfPCPath(options);
	}

	await tasks([
		{
			title: '删除旧文件',
			task: async (message) => {
				await deleteOldFile(options);
				return '删除旧文件完成';
			},
		},
		{
			title: '生成反编译代码',
			task: async (message) => {
				await exportScript(options, message);
				return '生成反编译代码完成';
			},
		},
		{
			title: '生成反编译PCode',
			task: async (message) => {
				await exportPcode(options, message);
				return '生成反编译PCode完成';
			},
		},
		{
			title: '生成方法声明索引',
			task: async (message) => {
				await exportPcode(options, message);
				return '生成方法声明索引完成';
			},
		},
	]);

}

async function deleteOldFile(options: RuntimeOptions) {
	//rmdir /s /q .\out\scripts
	try {
		rmSync(options.outDir + "/scripts", { recursive: true, force: true });
	} catch (error) {
		options.taskLogs.error("" + error);
	}
}
async function exportScript(options: RuntimeOptions, message: (string: string) => void) {
	//TODO ffdec.bat中内联了java
	//cd ./FFdec2 && ffdec.bat -config autoDeobfuscate=1 -timeout 120 -exportfiletimeout 600 -export script ../out/ ../resource/RealmGrinderDesktop.swf
	return new Promise<void>(async (resolve, reject) => {
		try {
			const outDir = join(options.outDir);
			mkdirSync(outDir, {recursive: true});

			const ls = spawn(`cmd`, [
				"/c",
				"ffdec.bat",
				"-config",
				"autoDeobfuscate=1",
				"-timeout", "120",
				"-exportfiletimeout", "600",
				"-export", "script",
				`${outDir}`,
				`${options.swfPCPath}`
			], { shell: false, cwd: options.ffdecDir });
		
			ls.stdout.on('data', (data: Buffer) => {
				message(gb2312Str(data));
				
				// console.log(`stdout: ${data}`);
			});
		
			ls.stderr.on('data', (data: Buffer) => {
				options.taskLogs.error(gb2312Str(data));

				// console.error(`stderr: ${data}`);
				ls.kill("SIGKILL");
			});
			ls.on('close', (code, signal) => {
				console.error(`child process exited with signal ${signal}`);

				if (signal === "SIGKILL") {
					reject();
				} else {
					resolve();
				}
			});
		} catch (error) {
			options.taskLogs.error("" + error);
			reject();
		}
	});
}
async function exportPcode(options: RuntimeOptions, message: (string: string) => void) {
	//TODO ffdec.bat中内联了java
	//cd ./FFdec2 && ffdec.bat -config autoDeobfuscate=1 -timeout 120 -exportfiletimeout 600 -format script:pcode -export script ../out/ ../resource/RealmGrinderDesktop.swf
	return new Promise<void>(async (resolve, reject) => {
		try {
			const outDir = join(options.outDir);
			mkdirSync(outDir, {recursive: true});

			const ls = spawn(`cmd`, [
				"/c",
				"ffdec.bat",
				"-config",
				"autoDeobfuscate=1",
				"-timeout", "120",
				"-exportfiletimeout", "600",
				"-format", "script:pcode",
				"-export", "script",
				`${outDir}`,
				`${options.swfPCPath}`
			], { shell: false, cwd: options.ffdecDir });
		
			ls.stdout.on('data', (data: Buffer) => {
				message(gb2312Str(data));
				
				// console.log(`stdout: ${data}`);
			});
		
			ls.stderr.on('data', (data: Buffer) => {
				options.taskLogs.error(gb2312Str(data));

				// console.error(`stderr: ${data}`);
				ls.kill("SIGKILL");
			});
			ls.on('close', (code, signal) => {
				console.error(`child process exited with signal ${signal}`);

				if (signal === "SIGKILL") {
					reject();
				} else {
					resolve();
				}
			});
		} catch (error) {
			options.taskLogs.error("" + error);
			reject();
		}
	});
}
async function exportABC(options: RuntimeOptions, message: (string: string) => void) {
	//TODO ffdec.bat中内联了java
	//cd ./FFdec2 && ffdec.bat -config autoDeobfuscate=1 -timeout 120 -exportfiletimeout 600 -format script:pcode -export script ../out/ ../resource/RealmGrinderDesktop.swf
	//cd ./FFdec2 && ffdec.bat -dumpabc ../resource/RealmGrinderDesktop.swf ../out/abc > ../out/abc.dmp Translation
	return new Promise<void>(async (resolve, reject) => {
		try {
			const outDir = join(options.outDir, "abc");
			const outFile = join(options.outDir, "abc.dmp");
			mkdirSync(outDir, {recursive: true});

			const ls = spawn(`cmd`, [
				"/c",
				"ffdec.bat",
				"-dumpabc",
				`${options.swfPCPath}`,
				`${outDir}`,
				">",
				`${outFile}`,
				"Translation",
			], { shell: false, cwd: options.ffdecDir });
		
			ls.stdout.on('data', (data: Buffer) => {
				message(gb2312Str(data));
				
				// console.log(`stdout: ${data}`);
			});
		
			ls.stderr.on('data', (data: Buffer) => {
				options.taskLogs.error(gb2312Str(data));

				// console.error(`stderr: ${data}`);
				ls.kill("SIGKILL");
			});
			ls.on('close', (code, signal) => {
				console.error(`child process exited with signal ${signal}`);

				if (signal === "SIGKILL") {
					reject();
				} else {
					resolve();
				}
			});
		} catch (error) {
			options.taskLogs.error("" + error);
			reject();
		}
	});
}
