import { text, password, autocomplete, path, select, confirm, groupMultiselect, group, tasks, isCancel, progress, intro, outro, cancel, spinner, note, box, taskLog, stream, log, updateSettings, PathOptions } from '@clack/prompts';
import * as newPCVersion from "./newPCVersion";
import * as newPhoneVersion from "./newPhoneVersion";
import * as handlePC from "./handlePC";
import * as handlePhone from "./handlePhone";
import { resolve as resolvePath } from "node:path";
import iconv from "iconv-lite";
import { setDistDir, setFFdecDir, setJavaDir, setNewApkPath, setOutDir, setSwfPCPath } from "./settings";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

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

export type Options = newPCVersion.Options & newPhoneVersion.Options & handlePC.Options & handlePhone.Options;
export type RuntimeOptions = Options & RuntimeParams & newPCVersion.RuntimeParams & newPhoneVersion.RuntimeParams & handlePC.RuntimeParams & handlePhone.RuntimeParams;

export function gb2312Str(data: Buffer) {
	return iconv.decode(data, 'gb2312');
}

export function getDefaultOption() {
	let options: Options = {
		javaDir: resolvePath("jdk-17.0.2"),
		ffdecDir: resolvePath("FFdec2"),
		
		swfPCPath: resolvePath("resource/RealmGrinderDesktop.swf"),
		newApkPath: resolvePath("resource/RealmGrinder_new.apk"),

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
		
		swfPCPath: resolvePath(options.swfPCPath),
		newApkPath: resolvePath(options.newApkPath),
		
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

	// box(`处理完成, 最终生成结果在${options.distDir}中`);
}

async function settings(options: RuntimeOptions) {
	const key = await select<keyof Options | typeof ReturnKey | typeof ResetKey>({
		message: '选择一个配置',
		options: [
			{ value: ReturnKey, label: '返回'},
			{ value: 'javaDir', label: 'jdk目录', hint: options.javaDir},
			{ value: 'ffdecDir', label: 'ffdec目录', hint: options.ffdecDir},
			{ value: 'swfPCPath', label: 'pc端swf路径', hint: options.swfPCPath},
			{ value: 'newApkPath', label: '最新apk路径', hint: options.newApkPath},
			{ value: 'outDir', label: '中间文件输出目录', hint: options.outDir},
			{ value: 'distDir', label: '打包结果输出目录', hint: options.distDir},
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
	} else if (key === "swfPCPath") {
		await setSwfPCPath(options);
	} else if (key === "newApkPath") {
		await setNewApkPath(options);
	} else if (key === "outDir") {
		await setOutDir(options);
	} else if (key === "distDir") {
		await setDistDir(options);
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

main();
