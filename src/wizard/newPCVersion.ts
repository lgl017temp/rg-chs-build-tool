import { box, confirm, path, progress, spinner, taskLog, tasks } from "@clack/prompts";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { FastLevel, RuntimeOptions } from ".";
import { join, resolve } from "node:path";
import { setOutDir, setSwfPCPath, validOutDir, validSwfPCPath } from "./settings";
import { gb2312Str } from "./util";

export interface RuntimeParams {
}

export interface Options {
	javaDir: string,
	ffdecDir: string,
	
	swfPCPath: string,
	
	outDir: string,
}

let currLs: ChildProcessWithoutNullStreams | undefined;
export async function main(options: RuntimeOptions) {
	if (options.fast >= FastLevel.step) {
		const needRun = await confirm({
			message: "执行PC端反编译?",
		});
		
		if (!needRun) {
			return;
		}
	}
	
	box("PC端反编译");

	if ((options.fast >= FastLevel.all) || validOutDir(options.outDir)) {
		await setOutDir(options);
	}
	if ((options.fast >= FastLevel.all) || validSwfPCPath(options.swfPCPath)) {
		await setSwfPCPath(options);
	}

	process.on('exit', () => {
		currLs?.kill("SIGTERM");
	});

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
				await exportABC(options, message);
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
	//cd ./FFdec2 && ffdec.bat -config autoDeobfuscate=1 -timeout 120 -exportfiletimeout 600 -export script ../out/ ../resource/RealmGrinderDesktop.swf
	//java %MEMORY_PARAM% %STACK_SIZE_PARAM% -Djava.net.preferIPv4Stack=true -Djna.nosys=true -Djava.util.Arrays.useLegacyMergeSort=true -jar "%~dp0\ffdec.jar" %*
	return new Promise<void>(async (resolve, reject) => {
		try {
			const outDir = join(options.outDir);
			mkdirSync(outDir, {recursive: true});

			currLs = spawn(join(options.javaDir, "bin", "java.exe"), [
				"-Xmx2048m",
				"-Djava.net.preferIPv4Stack=true",
				"-Djna.nosys=true",
				"-Djava.util.Arrays.useLegacyMergeSort=true",
				"-jar",
				"ffdec.jar",
				"-config",
				"autoDeobfuscate=1",
				"-timeout", "120",
				"-exportfiletimeout", "600",
				"-export", "script",
				`${outDir}`,
				`${options.swfPCPath}`
			], { shell: false, cwd: options.ffdecDir });
		
			let files: number[] = [];
			currLs.stdout.on('data', (data: Buffer) => {
				let str = gb2312Str(data);
				// let match = str.match(/Exported script (\d+)\/(\d+)/g);
				let matches = str.match(/(\d+)\/(\d+)/g);
				if (matches) {
					matches.forEach(matchStr => {
						let match = matchStr.match(/(\d+)\/(\d+)/);
						if (match) {
							let idx = match[1];
							let max = match[2];
							if (!files.length) {
								files = new Array(+max).fill(0);
							}
							files[+idx - 1] = 1;
						}
					});
				}
				let finishedCount = files.filter(d => d).length;
				let notFinishedCount = files.length - finishedCount;
				let notFinish = () => `${files.map((d, i) => ({idx: i, finish: !!d})).filter(d => !d.finish).map(d => d.idx + 1).join(",")}`;
				message(`[${finishedCount}/${files.length}] (${notFinishedCount < 10 ? notFinish() : `...${notFinishedCount}项`}) ` + str);
				
				// console.log(`stdout: ${data}`);
			});

			currLs.stderr.on('data', (data: Buffer) => {
				options.taskLogs.error(gb2312Str(data));

				// console.error(`stderr: ${data}`);
				currLs?.kill("SIGTERM");
			});
			currLs.on('close', (code, signal) => {
				// console.error(`child process exited with signal ${signal}`);

				currLs = undefined;

				if (signal === "SIGTERM") {
					reject();
				} else {
					resolve();
				}
			});
		} catch (error) {
			options.taskLogs.error("" + error);
			reject(error);
		}
	});
}
async function exportPcode(options: RuntimeOptions, message: (string: string) => void) {
	//cd ./FFdec2 && ffdec.bat -config autoDeobfuscate=1 -timeout 120 -exportfiletimeout 600 -format script:pcode -export script ../out/ ../resource/RealmGrinderDesktop.swf
	return new Promise<void>(async (resolve, reject) => {
		try {
			const outDir = join(options.outDir);
			mkdirSync(outDir, {recursive: true});

			currLs = spawn(join(options.javaDir, "bin", "java.exe"), [
				"-Xmx2048m",
				"-Djava.net.preferIPv4Stack=true",
				"-Djna.nosys=true",
				"-Djava.util.Arrays.useLegacyMergeSort=true",
				"-jar",
				"ffdec.jar",
				"-config",
				"autoDeobfuscate=1",
				"-timeout", "120",
				"-exportfiletimeout", "600",
				"-format", "script:pcode",
				"-export", "script",
				`${outDir}`,
				`${options.swfPCPath}`
			], { shell: false, cwd: options.ffdecDir });
		
			let files: number[] = [];
			currLs.stdout.on('data', (data: Buffer) => {
				let str = gb2312Str(data);
				// let match = str.match(/Exported script (\d+)\/(\d+)/g);
				let matches = str.match(/(\d+)\/(\d+)/g);
				if (matches) {
					matches.forEach(matchStr => {
						let match = matchStr.match(/(\d+)\/(\d+)/);
						if (match) {
							let idx = match[1];
							let max = match[2];
							if (!files.length) {
								files = new Array(+max).fill(0);
							}
							files[+idx - 1] = 1;
						}
					});
				}
				let finishedCount = files.filter(d => d).length;
				let notFinishedCount = files.length - finishedCount;
				let notFinish = () => `${files.map((d, i) => ({idx: i, finish: !!d})).filter(d => !d.finish).map(d => d.idx + 1).join(",")}`;
				message(`[${finishedCount}/${files.length}] (${notFinishedCount < 10 ? notFinish() : `...${notFinishedCount}项`}) ` + str);
				
				// console.log(`stdout: ${data}`);
			});
		
			currLs.stderr.on('data', (data: Buffer) => {
				options.taskLogs.error(gb2312Str(data));

				// console.error(`stderr: ${data}`);
				currLs?.kill("SIGTERM");
			});
			currLs.on('close', (code, signal) => {
				// console.error(`child process exited with signal ${signal}`);

				currLs = undefined;

				if (signal === "SIGTERM") {
					reject();
				} else {
					resolve();
				}
			});
		} catch (error) {
			options.taskLogs.error("" + error);
			reject(error);
		}
	});
}
async function exportABC(options: RuntimeOptions, message: (string: string) => void) {
	//cd ./FFdec2 && ffdec.bat -dumpabc ../resource/RealmGrinderDesktop.swf ../out/abc > ../out/abc.dmp Translation
	return new Promise<void>(async (resolve, reject) => {
		try {
			const outDir = join(options.outDir);
			const outFile = join(options.outDir, "abc.dmp");
			mkdirSync(outDir, {recursive: true});

			currLs = spawn(join(options.javaDir, "bin", "java.exe"), [
				"-Xmx2048m",
				"-Djava.net.preferIPv4Stack=true",
				"-Djna.nosys=true",
				"-Djava.util.Arrays.useLegacyMergeSort=true",
				"-jar",
				"ffdec.jar",
				"-dumpabc",
				`${options.swfPCPath}`,
				`${outFile}`,
				"Translation",
			], { shell: false, cwd: options.ffdecDir });
		
			let outStr = "";
			currLs.stdout.on('data', (data: Buffer) => {
				// message(gb2312Str(data));
				let str = gb2312Str(data);
				outStr += str;
				
				// console.log(`stdout: ${data}`);
			});
		
			currLs.stderr.on('data', (data: Buffer) => {
				options.taskLogs.error(gb2312Str(data));

				// console.error(`stderr: ${data}`);
				currLs?.kill("SIGTERM");
			});
			currLs.on('close', (code, signal) => {
				// console.error(`child process exited with signal ${signal}`);

				currLs = undefined;

				if (signal === "SIGTERM") {
					reject();
				} else {
					writeFileSync(outFile, outStr, "utf-8");
					resolve();
				}
			});
		} catch (error) {
			options.taskLogs.error("" + error);
			reject(error);
		}
	});
}
