import { box, confirm, isCancel, path, progress, spinner, taskLog, tasks, text } from "@clack/prompts";
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { FastLevel, RuntimeOptions } from ".";
import { join, resolve } from "node:path";
import { setOutDir, setSwfPhonePath, setTransPath, setV434ApkPath, validOutDir, validSwfPhonePath, validTransPath, validV434ApkPath } from "./settings";
import { gb2312Str } from "./util";

export interface RuntimeParams {
	swfPhonePath: string;
}

export interface Options {
	javaDir: string,
	ffdecDir: string,
	poeditDir: string,
	deflateUtilPath: string,
	
	v434ApkPath: string,
	fontPhoneDir: string,
	
	outDir: string,
	distDir: string,
}

let currLs: ChildProcessWithoutNullStreams | undefined;
export async function main(options: RuntimeOptions) {
	if (!options.patchPhoneParam.length) {
		box("无Android端修补代码信息, 打包跳过");
		return;
	}

	if (options.fast >= FastLevel.step) {
		const needRun = await confirm({
			message: "执行Android端打包?",
		});
		
		if (!needRun) {
			return;
		}
	}
	
	box("Android端打包");

	if ((options.fast >= FastLevel.all) || validOutDir(options.outDir)) {
		await setOutDir(options);
	}
	if ((options.fast >= FastLevel.all) || validV434ApkPath(options.v434ApkPath)) {
		await setV434ApkPath(options);
	}
	if ((options.fast >= FastLevel.all) || validSwfPhonePath(options.swfPhonePath)) {
		if (!options.swfPhonePath) {
			options.swfPhonePath = resolve(options.newApkPath, "..", "RealmGrinderMobile.swf");
		}
		await setSwfPhonePath(options);
	}
	if ((options.fast >= FastLevel.all) || !options.newApkVersionName) {
		let name = await text({
			message: "请输入新Android版本Name(示例: 4.3.4)",
			validate(val) {
				if (!val) {
					return "不能为空";
				}
			}
		});
		if (isCancel(name)) {
			return;
		}

		options.newApkVersionName = name;
	}
	//TODO 根据name自动
	if ((options.fast >= FastLevel.all) || options.newApkVersionCode < 0) {
		let code = await text({
			message: "请输入新Android版本Code(示例: 4.3.4为4003004)",
			validate(val) {
				if (!val || isNaN(+val) || +val <= 0 || Math.floor(+val) != +val) {
					return "版本Code应为正整数";
				}
			}
		});
		if (isCancel(code)) {
			return;
		}

		options.newApkVersionCode = Math.floor(+code);
	}

	process.on('exit', () => {
		currLs?.kill("SIGTERM");
	});

	//TODO
	// call npm run replaceTransMobile

	// call npm run modifyVersion

	// call npm run modifyVersionUUID

	// call npm run extractAssets

	// mkdir .\out\assets\fonts
	// copy .\resource\other\floating_bitmap.fnt .\out\assets\fonts
	// mkdir .\out\assets\images
	// copy .\resource\other\realmgrinderui_new.png .\out\assets\images
	// copy .\resource\other\realmgrinderui2_new.png .\out\assets\images

	// mkdir .\out\android
	// call npm run repackApk

	// call npm run alignApk

	// call npm run signApk

	// echo copyToDist
	// rmdir /s /q .\dist\phone
	// mkdir .\dist\phone
	// copy .\out\android\realmgrinder_signed.apk .\dist\phone

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
	//cd ./FFdec2 && ffdec.bat -replace ../resource/RealmGrinderMobile.swf ../out/assets/RealmGrinderMobile.swf 13 ../out/13_realmgrinder_es_ES_compress.mo 3 ../resource/font_phone/3_class_3_SourceSansProSemibold.ttf 16 ../resource/font_phone/16_class_1770_Liony2.ttf 21 ../resource/font_phone/21_class_1773_Liony2.ttf 15 ../resource/font_phone/MicrosoftYaHei.cff 17 ../resource/font_phone/SanJiDianHeiJianTi-Zhong-2.ttf 18 ../resource/font_phone/MicrosoftYaHei.cff 19 ../resource/font_phone/MicrosoftYaHei.cff 20 ../resource/font_phone/MicrosoftYaHei.cff §\\\"o§.§3w§ ../out/pcodePhone/initializeElement_upgrade.pcode 17307 §^#§.§+!3§ ../out/pcodePhone/initializeElement_research.pcode 5041 Translation ../out/pcodePhone/translation.pcode 60 §<!F§.§,!#§ ../out/pcodePhone/getCost1.pcode 17192 §<!F§.§^g§ ../out/pcodePhone/getCost2.pcode 18413 §<!F§.§7!G§ ../out/pcodePhone/getCost3.pcode 17042 §#c§.§]8§ ../out/pcodePhone/initializeElement_buyN.pcode 13920 §+!8§.§=!d§ ../out/pcodePhone/catalystDescription.pcode 13904 §+!8§.§5i§ ../out/pcodePhone/dragonsBreathDescription.pcode 5115 §=!#§.§1$§ ../out/pcodePhone/researchDDescription.pcode 7834 §=!#§.§95§ ../out/pcodePhone/researchA270Description.pcode 12381 §#c§.§&L§ ../out/pcodePhone/abdication.pcode 17016 §#c§.§'D§ ../out/pcodePhone/reincarnation.pcode 15412 \"§ x§.§6m§\" ../out/pcodePhone/advOptions.pcode 10089 §#c§.§^!+§ ../out/pcodePhone/initializeElement_buyN_exchange.pcode 13067 §#c§.§+f§ ../out/pcodePhone/initializeElement_buyN_excavation.pcode 9733 §<!F§.§5w§ ../out/pcodePhone/initializeElement_buildings.pcode 16322 §=!#§.§^!o§ ../out/pcodePhone/researchE5625Progress.pcode 15346 §@K§.§2!3§ ../out/pcodePhone/statistics.pcode 18759 §=!B§ ../out/pcodePhone/exportTemplate.pcode 1206 \"§\\\"o§.§&0§\" ../out/pcodePhone/buyRubyBoundsConfirm.pcode 18512
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
				`${options.swfPhonePath}`, `${join(outDir, "RealmGrinderMobile.swf")}`,
				"13", `${join(outDir, "13_realmgrinder_es_ES_compress.mo")}`,
				"3", `${join(options.fontPhoneDir, "3_class_3_SourceSansProSemibold.ttf")}`,
				"16", `${join(options.fontPhoneDir, "16_class_1770_Liony2.ttf")}`,
				"21", `${join(options.fontPhoneDir, "21_class_1773_Liony2.ttf")}`,
				"15", `${join(options.fontPhoneDir, "MicrosoftYaHei.cff")}`,
				"17", `${join(options.fontPhoneDir, "SanJiDianHeiJianTi-Zhong-2.ttf")}`,
				"18", `${join(options.fontPhoneDir, "MicrosoftYaHei.cff")}`,
				"19", `${join(options.fontPhoneDir, "MicrosoftYaHei.cff")}`,
				"20", `${join(options.fontPhoneDir, "MicrosoftYaHei.cff")}`,
				...options.patchPhoneParam.flat()
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
				message(`[${count}/${options.patchPhoneParam.length}] ` + str);
				
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