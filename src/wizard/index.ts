import { text, password, autocomplete, path, select, confirm, groupMultiselect, group, tasks, isCancel, progress, intro, outro, cancel, spinner, note, box, taskLog, stream, log, updateSettings, PathOptions } from '@clack/prompts';
import * as newPCVersion from "./newPCVersion";
import * as newPhoneVersion from "./newPhoneVersion";
import * as handlePC from "./handlePC";
import * as handlePhone from "./handlePhone";
import * as handleTrans from "./handleTrans";
import * as repackPC from "./repackPC";
import * as repackPhone from "./repackPhone";
import { resolve as resolvePath } from "node:path";
import iconv from "iconv-lite";
import { setAndroidBuildToolsDir, setDeflateUtilPath, setDistDir, setFFdecDir, setFontPCDir, setFontPhoneDir, setJavaDir, setKeystorePath, setManifestEditorPath, setNewApkPath, setOutDir, setPoeditDir, setResourceDir, setSwfPCPath, setTransPath, setV434ApkPath } from "./settings";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export enum FastLevel {
	none = 0,
	important = 1,
	step = 2,
	all = 3,
}

export interface RuntimeParams {
	fast: FastLevel;
	taskLogs: ReturnType<typeof taskLog>;
}

const ReturnKey = "**return**";
const ResetKey = "**reset**";

export type Options = newPCVersion.Options & newPhoneVersion.Options & handlePC.Options & handlePhone.Options & handleTrans.Options & repackPC.Options & repackPhone.Options;
export type RuntimeOptions = Options & RuntimeParams & newPCVersion.RuntimeParams & newPhoneVersion.RuntimeParams & handlePC.RuntimeParams & handlePhone.RuntimeParams & handleTrans.RuntimeParams & repackPC.RuntimeParams & repackPhone.RuntimeParams;

export function getDefaultOption() {
	let options: Options = {
		javaDir: resolvePath("jdk-17.0.2"),
		ffdecDir: resolvePath("FFdec2"),
		poeditDir: resolvePath("Poedit"),
		deflateUtilPath: resolvePath("deflateUtil.jar"),
		manifestEditorPath: resolvePath("ManifestEditor-2.0.jar"),
		androidBuildToolsDir: resolvePath("Android/Sdk/build-tools/34.0.0"),
		
		swfPCPath: resolvePath("resource/RealmGrinderDesktop.swf"),
		newApkPath: resolvePath("resource/RealmGrinder_new.apk"),
		v434ApkPath: resolvePath("resource/RealmGrinder_4.3.4_APKPure.apk"),
		transPath: resolvePath("resource/RG-翻译表.xlsx"),
		fontPCDir: resolvePath("resource/font_pc"),
		fontPhoneDir: resolvePath("resource/font_phone"),
		resourceDir: resolvePath("resource/other"),
		keystorePath: resolvePath("resource/realmgrinder.keystore"),

		outDir: resolvePath("out"),
		distDir: resolvePath("dist"),
	};
	return options;
}

async function main() {
	intro("RG汉化打包工具");

	const taskLogs = taskLog({
		title: '初始化',
		limit: 5,
	});

	let options = getDefaultOption();

	const configFile = "config.json";
	try {
		if (!existsSync(configFile)) {
			taskLogs.message("无配置文件");
		} else {
			let configStr = readFileSync(configFile, "utf-8");
			let json = JSON.parse(configStr) as Partial<Options>;
			options = {
				...options,
				
				...json,
			}
		}
	} catch (error) {
		taskLogs.error("加载配置文件失败: " + error);

		let overwrite = await confirm({
			message: "是否使用默认配置覆盖(配置文件将被覆盖)"
		});

		if (overwrite !== true) {
			taskLogs.message("请在修复后重启程序");
			return;
		}
	}

	const finalOptions: RuntimeOptions = {
		javaDir: resolvePath(options.javaDir),
		ffdecDir: resolvePath(options.ffdecDir),
		poeditDir: resolvePath(options.poeditDir),
		deflateUtilPath: resolvePath(options.deflateUtilPath),
		manifestEditorPath: resolvePath(options.manifestEditorPath),
		androidBuildToolsDir: resolvePath(options.androidBuildToolsDir),
		
		swfPCPath: resolvePath(options.swfPCPath),
		newApkPath: resolvePath(options.newApkPath),
		v434ApkPath: resolvePath(options.v434ApkPath),
		transPath: resolvePath(options.transPath),
		fontPCDir: resolvePath(options.fontPCDir),
		fontPhoneDir: resolvePath(options.fontPhoneDir),
		resourceDir: resolvePath(options.resourceDir),
		keystorePath: resolvePath(options.keystorePath),
		
		outDir: resolvePath(options.outDir),
		distDir: resolvePath(options.distDir),

		taskLogs,

		fast: FastLevel.important,

		swfPhonePath: "",
		newApkVersionName: "",
		newApkVersionCode: -1,
		patchPCParam: [],
		patchPhoneParam: [],
	};

	try {
		while (true) {
			if(await menu(finalOptions) === false) {
				break;
			}
		}
	} finally {
		writeConfig(finalOptions, configFile);
	}
}

async function menu(options: RuntimeOptions) {
	const key = await select({
		message: '功能菜单',
		options: [
			{ value: 'start', label: '执行'},
			{ value: 'settings', label: '修改配置', hint: '文件路径等, 也可以执行时修改'},
			{ value: ReturnKey, label: '退出'},
		],
		maxItems: 10,
	});

	if (key === ReturnKey || isCancel(key)) {
		return false;
	} else if (key === "settings") {
		while (true) {
			if(await settings(options) === false) {
				break;
			}
		}
	} else if (key === "start") {
		await selectLevel(options);
	} else {
		let never: never = key;
	}
}

async function selectLevel(options: RuntimeOptions) {
	const key = await select<keyof typeof FastLevel | typeof ReturnKey>({
		message: '交互等级',
		options: [
			{ value: 'none', label: '全自动', hint: '完全使用配置, 仅配置无效时询问'},
			{ value: 'important', label: '仅关键步骤', hint: '+关键步骤询问'},
			{ value: 'step', label: '大步骤', hint: '+大步骤询问'},
			{ value: 'all', label: '所有', hint: '所有参数均询问'},
			{ value: ReturnKey, label: '返回'},
		],
	});

	if (key === ReturnKey || isCancel(key)) {
		return false;
	} else if (key === "none" || key === "important" || key === "step" || key === "all") {
		options.fast = FastLevel[key];
		await start(options);
	} else {
		let never: never = key;
	}
}

async function start(options: RuntimeOptions) {
	await newPCVersion.main(options);
	await newPhoneVersion.main(options);
	await handlePC.main(options);
	await handlePhone.main(options);
	await handleTrans.main(options);
	await repackPC.main(options);
	await repackPhone.main(options);

	box(`处理完成`);
}

async function settings(options: RuntimeOptions) {
	const key = await select<keyof Options | typeof ReturnKey | typeof ResetKey>({
		message: '选择一个配置',
		options: [
			{ value: ReturnKey, label: '返回'},
			{ value: 'javaDir', label: 'JDK目录', hint: options.javaDir},
			{ value: 'ffdecDir', label: 'FFDec目录', hint: options.ffdecDir},
			{ value: 'poeditDir', label: 'Poedit目录', hint: options.poeditDir},
			{ value: 'deflateUtilPath', label: 'deflateUtil.jar路径', hint: options.deflateUtilPath},
			{ value: 'manifestEditorPath', label: 'ManifestEditor-2.0.jar路径', hint: options.manifestEditorPath},
			{ value: 'androidBuildToolsDir', label: '安卓编译工具目录', hint: options.androidBuildToolsDir},
			{ value: 'swfPCPath', label: 'PC端swf路径', hint: options.swfPCPath},
			{ value: 'newApkPath', label: '最新apk路径', hint: options.newApkPath},
			{ value: 'v434ApkPath', label: '4.3.4版本apk路径', hint: options.newApkPath},
			{ value: 'fontPCDir', label: 'PC端字体目录', hint: options.fontPCDir},
			{ value: 'fontPhoneDir', label: 'Android端字体目录', hint: options.fontPhoneDir},
			{ value: 'resourceDir', label: '图片资源目录', hint: options.resourceDir},
			{ value: 'keystorePath', label: '签名密钥路径', hint: options.keystorePath},
			{ value: 'outDir', label: '中间文件输出目录', hint: options.outDir},
			{ value: 'distDir', label: '打包结果输出目录', hint: options.distDir},
			{ value: 'transPath', label: '翻译文件路径', hint: options.transPath},
			{ value: ResetKey, label: '重置'},
		],
		maxItems: 10,
	});

	if (key === ReturnKey || isCancel(key)) {
		return false;
	} else if (key === ResetKey) {
		options = {
			...options,

			...getDefaultOption(),
		}
	} else if (key === "javaDir") {
		await setJavaDir(options);
	} else if (key === "ffdecDir") {
		await setFFdecDir(options);
	} else if (key === "poeditDir") {
		await setPoeditDir(options);
	} else if (key === "deflateUtilPath") {
		await setDeflateUtilPath(options);
	} else if (key === "manifestEditorPath") {
		await setManifestEditorPath(options);
	} else if (key === "androidBuildToolsDir") {
		await setAndroidBuildToolsDir(options);
	} else if (key === "swfPCPath") {
		await setSwfPCPath(options);
	} else if (key === "newApkPath") {
		await setNewApkPath(options);
	} else if (key === "v434ApkPath") {
		await setV434ApkPath(options);
	} else if (key === "outDir") {
		await setOutDir(options);
	} else if (key === "distDir") {
		await setDistDir(options);
	} else if (key === "transPath") {
		await setTransPath(options);
	} else if (key === "fontPCDir") {
		await setFontPCDir(options);
	} else if (key === "fontPhoneDir") {
		await setFontPhoneDir(options);
	} else if (key === "resourceDir") {
		await setResourceDir(options);
	} else if (key === "keystorePath") {
		await setKeystorePath(options);
	} else {
		let never: never = key;
	}
}

async function writeConfig(options: RuntimeOptions, configFile: string) {
	try {
		let json = getDefaultOption();
		(Object.keys(json) as (keyof Options)[]).forEach(key => {
			json[key] = options[key];
		})
		writeFileSync(configFile, JSON.stringify(json, null, 4), "utf-8");
	} catch (error) {
		options.taskLogs.error("写入配置文件失败: " + error);
	}
}

const moduleFilePath = fileURLToPath(import.meta.url);
const isDirectlyEvalByNode = moduleFilePath === process.argv[1];
if (isDirectlyEvalByNode) {
	main();
}
