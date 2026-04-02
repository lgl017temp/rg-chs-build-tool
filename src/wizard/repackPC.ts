import { box, confirm, path, progress, spinner, taskLog, tasks } from "@clack/prompts";
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { FastLevel, RuntimeOptions } from ".";
import { join, resolve } from "node:path";
import { setOutDir, setSwfPCPath, setTransPath, validOutDir, validSwfPCPath, validTransPath } from "./settings";
import { gb2312Str } from "./util";

export interface RuntimeParams {
	patchPCParam: string[][];
}

export interface Options {
	javaDir: string,
	ffdecDir: string,
	poeditDir: string,
	deflateUtilPath: string,
	
	swfPCPath: string,
	fontPCDir: string,
	
	outDir: string,
	distDir: string,
}

let currLs: ChildProcessWithoutNullStreams | undefined;
export async function main(options: RuntimeOptions) {
	if (!options.patchPCParam.length) {
		box("无PC端修补代码信息, 打包跳过");
		return;
	}

	if (options.fast >= FastLevel.step) {
		const needRun = await confirm({
			message: "执行PC端打包?",
		});
		
		if (!needRun) {
			return;
		}
	}
	
	box("PC端打包");

	if ((options.fast >= FastLevel.all) || validOutDir(options.outDir)) {
		await setOutDir(options);
	}
	if ((options.fast >= FastLevel.all) || validSwfPCPath(options.swfPCPath)) {
		await setSwfPCPath(options);
	}

	process.on('exit', () => {
		currLs?.kill("SIGTERM");
	});

	//TODO
	// echo copyToDist
	// rmdir /s /q .\dist\pc
	// mkdir .\dist\pc
	// copy .\out\RealmGrinderDesktop.swf .\dist\pc
	// mkdir .\dist\pc\fonts
	// copy .\resource\other\floating_bitmap.fnt .\dist\pc\fonts
	// mkdir .\dist\pc\images
	// copy .\resource\other\realmgrinderui_new.png .\dist\pc\images
	// copy .\resource\other\realmgrinderui2_new.png .\dist\pc\images

	await tasks([
		{
			title: '生成替换后swf文件',
			task: async (message) => {
				await replaceTrans(options, message);
				return '生成替换后swf文件完成';
			},
		},
	]);
}

async function replaceTrans(options: RuntimeOptions, message: (string: string) => void) {
	//cd ./FFdec2 && ffdec.bat -replace ../resource/RealmGrinderDesktop.swf ../out/RealmGrinderDesktop.swf 13 ../out/13_realmgrinder_es_ES_compress.mo 3 ../resource/font_pc/3_SourceSansSmall.ttf 15 ../resource/font_pc/15_Tkachev-Liony-Bold.ttf 20 ../resource/font_pc/20_Tkachev-Liony.ttf 14 ../resource/font_pc/MicrosoftYaHei.ttf 16 ../resource/font_pc/MicrosoftYaHei.ttf 17 ../resource/font_pc/MicrosoftYaHei.ttf 18 ../resource/font_pc/MicrosoftYaHei.ttf 19 ../resource/font_pc/MicrosoftYaHei.ttf §\\\"#§.§5W§ ../out/pcode/getSpellName.pcode 17650 §'?§.§[0§ ../out/pcode/initializeElement_upgrade.pcode 18693 §]!6§.§>O§ ../out/pcode/initializeElement_research.pcode 15755 Translation ../out/pcode/translation.pcode 60 §\\\"#§.§[!2§ ../out/pcode/getTooltip.pcode 18348 §\\\"#§.§3]§ ../out/pcode/getCost1.pcode 18640 §\\\"#§.§4]§ ../out/pcode/getCost2.pcode 19274 §\\\"#§.§7!B§ ../out/pcode/getCost3.pcode 17700 §4X§.§2!C§ ../out/pcode/initializeElement_buyN.pcode 13726 §1Z§.§?K§ ../out/pcode/initializeElement_option.pcode 9729 §]!6§.§!M§ ../out/pcode/initializeElement_buyAllPC.pcode 15150 §?7§.§'\\\"%§ ../out/pcode/catalystDescription.pcode 13710 §?7§.§5!3§ ../out/pcode/dragonsBreathDescription.pcode 4962 §;!J§.§1!7§ ../out/pcode/researchDDescription.pcode 7494 §;!J§.§#!#§ ../out/pcode/researchA270Description.pcode 12277 §;!J§.§'\\\"3§ ../out/pcode/researchE5625Progress.pcode 15081 §4&§.§1F§ ../out/pcode/statistics.pcode 19460 §8G§ ../out/pcode/exportTemplate.pcode 1222 §'?§.§,S§ ../out/pcode/buyRubyBoundsConfirm.pcode 18916
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
				"-replace",
				`${options.swfPCPath}`, `${join(outDir, "RealmGrinderDesktop.swf")}`,
				"13", `${join(outDir, "13_realmgrinder_es_ES_compress.mo")}`,
				"3", `${join(options.fontPCDir, "3_SourceSansSmall.ttf")}`,
				"15", `${join(options.fontPCDir, "15_Tkachev-Liony-Bold.ttf")}`,
				"20", `${join(options.fontPCDir, "20_Tkachev-Liony.ttf")}`,
				"14", `${join(options.fontPCDir, "MicrosoftYaHei.ttf")}`,
				"16", `${join(options.fontPCDir, "MicrosoftYaHei.ttf")}`,
				"17", `${join(options.fontPCDir, "MicrosoftYaHei.ttf")}`,
				"18", `${join(options.fontPCDir, "MicrosoftYaHei.ttf")}`,
				"19", `${join(options.fontPCDir, "MicrosoftYaHei.ttf")}`,
				...options.patchPCParam.flat()
			], { shell: false, cwd: options.ffdecDir });
		
			let count = 0;
			currLs.stdout.on('data', (data: Buffer) => {
				let str = gb2312Str(data);

				// let match = str.match(/Exported script (\d+)\/(\d+)/g);
				let matches = str.match(/Replace AS3 PCode/g);
				if (matches) {
					matches.forEach(matchStr => {
						let match = matchStr.match(/Replace AS3 PCode/);
						if (match) {
							count++;
						}
					});
				}
				// let finishedCount = files.filter(d => d).length;
				// let notFinishedCount = files.length - finishedCount;
				// let notFinish = () => `${files.map((d, i) => ({idx: i, finish: !!d})).filter(d => !d.finish).map(d => d.idx + 1).join(",")}`;
				message(`[${count}/${options.patchPCParam.length}] ` + str);
				
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