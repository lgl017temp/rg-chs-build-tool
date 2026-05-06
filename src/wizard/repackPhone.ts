import { box, confirm, isCancel, path, progress, spinner, taskLog, tasks, text } from "@clack/prompts";
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "node:child_process";
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { FastLevel, RuntimeOptions } from ".";
import { join, resolve } from "node:path";
import { setAndroidBuildToolsDir, setFontPhoneDir, setKeystorePath, setManifestEditorPath, setOutDir, setResourceDir, setSwfPhonePath, setTransPath, setV434ApkPath, validAndroidBuildToolsDir, validFontPCDir, validFontPhoneDir, validKeystorePath, validManifestEditorPath, validOutDir, validResourceDir, validSwfPhonePath, validTransPath, validV434ApkPath } from "./settings";
import { gb2312Str } from "./util";
import * as changeVersionUUID from "../changeVersionUUID";
import JSZip from "jszip";

export interface RuntimeParams {
	swfPhonePath: string;
}

export interface Options {
	javaDir: string,
	ffdecDir: string,
	poeditDir: string,
	deflateUtilPath: string,
	manifestEditorPath: string,
	androidBuildToolsDir: string,
	
	v434ApkPath: string,
	fontPhoneDir: string,
	resourceDir: string,
	keystorePath: string,
	
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
	if ((options.fast >= FastLevel.all) || validManifestEditorPath(options.manifestEditorPath)) {
		await setManifestEditorPath(options);
	}
	if ((options.fast >= FastLevel.all) || validAndroidBuildToolsDir(options.androidBuildToolsDir)) {
		await setAndroidBuildToolsDir(options);
	}
	if ((options.fast >= FastLevel.all) || validSwfPhonePath(options.swfPhonePath)) {
		if (!options.swfPhonePath) {
			options.swfPhonePath = resolve(options.newApkPath, "..", "RealmGrinderMobile.swf");
		}
		await setSwfPhonePath(options);
	}
	if ((options.fast >= FastLevel.all) || validFontPhoneDir(options.fontPhoneDir)) {
		await setFontPhoneDir(options);
	}
	if ((options.fast >= FastLevel.all) || validResourceDir(options.resourceDir)) {
		await setResourceDir(options);
	}
	if ((options.fast >= FastLevel.all) || validKeystorePath(options.keystorePath)) {
		await setKeystorePath(options);
	}
	if ((options.fast >= FastLevel.all) || !options.newApkVersionName) {
		let name = await text({
			message: "请输入新Android版本Name(示例: 4.3.4)",
			validate(val) {
				if (!val) {
					return "不能为空";
				}
				if (!val.match(/\d+\.\d+\.\d+/)) {
					return "格式不正确"
				}
			}
		});
		if (isCancel(name)) {
			return;
		}

		let match = name.match(/(\d+)\.(\d+)\.(\d+)/)!;
		let code = +match[1] * 1e6 + +match[2] * 1e3 + +match[3];
		options.newApkVersionName = name;
		options.newApkVersionCode = code;
	}

	process.on('exit', () => {
		currLs?.kill("SIGTERM");
	});

	options.taskLogs.success(`打包版本号: ${options.newApkVersionName}(${options.newApkVersionCode})`);

	await tasks([
		{
			title: '生成替换后swf文件',
			task: async (message) => {
				await replaceTrans(options, message);
				return '生成替换后swf文件完成';
			},
		},
		{
			title: '生成AndroidManifest.xml文件',
			task: async (message) => {
				await modifyVersion(options);
				return '生成AndroidManifest.xml文件完成';
			},
		},
		{
			title: '替换apk资源文件',
			task: async (message) => {
				await replaceAssets(options);
				return '替换apk资源文件完成';
			},
		},
		{
			title: '签名apk文件',
			task: async (message) => {
				await signApk(options);
				return '签名apk文件完成';
			},
		},
		{
			title: '复制apk到打包结果目录',
			task: async (message) => {
				await copyToDist(options);
				return '复制apk到打包结果目录完成';
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
async function modifyVersion(options: RuntimeOptions) {
	//java -jar ../../ManifestEditor-2.0.jar ../../resource/AndroidManifest.xml -vc 4003006 -vn 4.3.6 -o ../../out/AndroidManifest_.xml --force
	try {
		let zipData = readFileSync(options.v434ApkPath);
		let jszip = await JSZip.loadAsync(zipData);
		let xmlFile = jszip.file("AndroidManifest.xml");
		if (!xmlFile) {
			throw new Error("apk内无AndroidManifest.xml文件");
		}

		let buffer = await xmlFile.async("uint8array");
		let outPath = join(options.v434ApkPath, "..", "AndroidManifest.xml");
		writeFileSync(outPath, buffer);

		spawnSync(join(options.javaDir, "bin", "java.exe"), [
			"-jar",
			`${options.manifestEditorPath}`,
			`${outPath}`,
			"-vc", `${options.newApkVersionCode}`,
			"-vn", `${options.newApkVersionName}`,
			"-o", `${join(options.outDir, "AndroidManifest_.xml")}`,
			"--force",
		], { shell: false });

		changeVersionUUID._main(join(options.outDir, "AndroidManifest_.xml"), join(options.outDir, "AndroidManifest.xml"));

	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}
async function replaceAssets(options: RuntimeOptions) {
	// unzip -o -d out .\\resource\\RealmGrinder_new.apk assets/images/*

	// mkdir .\out\assets\fonts
	// copy .\resource\other\floating_bitmap.fnt .\out\assets\fonts
	// mkdir .\out\assets\images
	// copy .\resource\other\realmgrinderui_new.png .\out\assets\images
	// copy .\resource\other\realmgrinderui2_new.png .\out\assets\images

	// mkdir .\out\android
	// copy /y .\\resource\\RealmGrinder_4.3.4_APKPure.apk .\\out\\android\\realmgrinder_repack.apk
	// ..\\zip ./android/realmgrinder_repack.apk ./assets/RealmGrinderMobile.swf ./assets/fonts/floating_bitmap.fnt ./assets/images/* ./AndroidManifest.xml
	try {
		let androidDir = join(options.outDir, "android");

		rmSync(androidDir, { recursive: true, force: true });
		mkdirSync(androidDir, { recursive: true });

		let zipData = readFileSync(options.newApkPath);
		let jszip = await JSZip.loadAsync(zipData);
		let assetsDir = jszip.folder("assets/images");
		if (!assetsDir) {
			throw new Error("新apk内无assets/images目录");
		}

		let files = assetsDir.files;
		let fileKeys = Object.keys(files);

		let repackZipData = readFileSync(options.v434ApkPath);
		let repackJszip = await JSZip.loadAsync(repackZipData);
		let repackAssetsDir = repackJszip.folder("assets");
		if (!repackAssetsDir) {
			throw new Error("v3.4.3 apk内无assets/images目录");
		}

		repackAssetsDir.file("RealmGrinderMobile.swf", readFileSync(join(options.outDir, "RealmGrinderMobile.swf")));
		let repackImagesDir = repackAssetsDir.folder("images")!;
		let repackFontsDir = repackAssetsDir.folder("fonts")!;
		for (let i = 0; i < fileKeys.length; i++) {
			const fileName = fileKeys[i];
			const file = files[fileName];
			
			let buffer = await file.async("uint8array");
			repackImagesDir.file(fileName, buffer);
		}
		repackImagesDir.file("realmgrinderui_new.png", readFileSync(join(options.resourceDir, "realmgrinderui_new.png")));
		repackImagesDir.file("realmgrinderui2_new.png", readFileSync(join(options.resourceDir, "realmgrinderui2_new.png")));
		repackFontsDir.file("floating_bitmap.fnt", readFileSync(join(options.resourceDir, "floating_bitmap.fnt")));
		repackJszip.file("AndroidManifest.xml", readFileSync(join(options.outDir, "AndroidManifest.xml")));

		await new Promise<void>((resolve, reject) => {
			try {
				repackJszip.generateNodeStream({type:'nodebuffer', streamFiles:true})
				.pipe(createWriteStream(join(androidDir, "realmgrinder_repack.apk"), {}))
				.on('finish', () => {
					resolve();
				});
			} catch (error) {
				reject(error);
			}
		})
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}

async function signApk(options: RuntimeOptions) {
	// zipalign -f -p 4 ../../../../out/android/realmgrinder_repack.apk ../../../../out/android/realmgrinder_aligned.apk",
    // apksigner sign -verbose --ks ../../../../resource/realmgrinder.keystore --ks-key-alias realmgrinder --ks-pass pass:123456 --key-pass pass:123456 --out  ../../../../out/android/realmgrinder_signed.apk ../../../../out/android/realmgrinder_aligned.apk",
	try {
		let androidDir = join(options.outDir, "android");

		spawnSync("zipalign.exe", [
			"-f",
			"-p", "4",
			`${join(androidDir, "realmgrinder_repack.apk")}`,
			`${join(androidDir, "realmgrinder_aligned.apk")}`,
		], { shell: false, cwd: options.androidBuildToolsDir });

		spawnSync(join(options.javaDir, "bin", "java.exe"), [
			"-jar",
			"lib/apksigner.jar",
			"sign",
			"-verbose",
			"--ks", `${options.keystorePath}`,
			"--ks-key-alias", "realmgrinder",
			"--ks-pass", "pass:123456",
			"--key-pass", "pass:123456",
			"--out", `${join(androidDir, "realmgrinder_signed.apk")}`,
			`${join(androidDir, "realmgrinder_aligned.apk")}`,
		], { shell: false, cwd: options.androidBuildToolsDir });
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}

async function copyToDist(options: RuntimeOptions) {
	// rmdir /s /q .\dist\phone
	// mkdir .\dist\phone
	// copy .\out\android\realmgrinder_signed.apk .\dist\phone
	try {
		let distDir = join(options.distDir, "phone");

		rmSync(distDir, { recursive: true, force: true });

		mkdirSync(distDir, { recursive: true });
		copyFileSync(join(options.outDir, "android", "realmgrinder_signed.apk"), join(distDir, `realmgrinder_${options.newApkVersionName}.apk`));
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}
