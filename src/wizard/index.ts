import { text, password, autocomplete, path, select, confirm, groupMultiselect, group, tasks, isCancel, progress, intro, outro, cancel, spinner, note, box, taskLog, stream, log, updateSettings, PathOptions } from '@clack/prompts';
import * as newPCVersion from "./newPCVersion";
import * as handlePC from "./handlePC";
import { resolve as resolvePath } from "node:path";
import iconv from "iconv-lite";
import { setDistDir, setFFdecDir, setOutDir, setSwfPCPath } from "./settings";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

interface RuntimeParams {
	fast: boolean;
	taskLogs: ReturnType<typeof taskLog>;
}

type ReturnKey = "**return**";

export type Options = newPCVersion.Options & handlePC.Options;
export type RuntimeOptions = Options & RuntimeParams;

export function gb2312Str(data: Buffer) {
	return iconv.decode(data, 'gb2312');
}

async function main() {
	intro("RG汉化打包工具");

	const taskLogs = taskLog({
		title: '初始化',
		limit: 5,
	});

	let options: Options = {
		swfPCPath: resolvePath("resource/RealmGrinderDesktop.swf"),

		ffdecDir: resolvePath("FFdec2"),

		outDir: resolvePath("out"),
		distDir: resolvePath("dist"),
	};

	const configFile = "config.json";
	try {
		if (!existsSync(configFile)) {
			taskLogs.message("无配置文件");
		} else {
			let configStr = readFileSync(configFile, "utf-8");
			let json = JSON.parse(configStr) as Partial<Options>;
			options = {
				...json,

				...options,
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
		swfPCPath: resolvePath(options.swfPCPath),

		ffdecDir: resolvePath(options.ffdecDir),
		
		outDir: resolvePath(options.outDir),
		distDir: resolvePath(options.distDir),

		taskLogs,

		fast: false,
	};

	try {
		while (true) {
			if(await menu(finalOptions) === false) {
				break;
			}
		}
	} finally {
		writeConfig(finalOptions, options, configFile);
	}
}

async function menu(options: RuntimeOptions) {
	const key = await select({
		message: '功能菜单',
		options: [
			{ value: 'settings', label: '修改配置', hint: '文件路径等, 也可以执行时临时修改'},
			{ value: 'startFast', label: '快速执行', hint: '仅询问关键步骤和信息'},
			{ value: 'start', label: '执行', hint: '每一步都询问'},
			{ value: '**return**', label: '退出'},
		],
		maxItems: 10,
	});

	if (key === "**return**" || isCancel(key)) {
		return false;
	} else if (key === "settings") {
		while (true) {
			if(await settings(options) === false) {
				break;
			}
		}
	} else if (key === "startFast") {
		options.fast = true;
		start(options);
	} else if (key === "start") {
		options.fast = false;
		start(options);
	} else {
		let never: never = key;
	}
}

async function start(options: RuntimeOptions) {
	await newPCVersion.main(options);

	outro("处理完成");
	note(`最终生成结果在${options.distDir}中`);
}

async function settings(options: RuntimeOptions) {
	const key = await select<keyof Options | ReturnKey>({
		message: '选择一个配置',
		options: [
			{ value: '**return**', label: '返回'},
			{ value: 'swfPCPath', label: 'swfPCPath', hint: 'PC端steam的swf文件路径(RealmGrinderDesktop.swf)'},
			{ value: 'ffdecDir', label: 'ffdecDir', hint: 'ffdec路径'},
			{ value: 'outDir', label: 'outDir', hint: '中间文件输出路径'},
			{ value: 'distDir', label: 'distDir', hint: '打包结果输出路径'},
		],
		maxItems: 10,
	});

	if (key === "**return**" || isCancel(key)) {
		return false;
	} else if (key === "swfPCPath") {
		await setSwfPCPath(options);
	} else if (key === "ffdecDir") {
		await setFFdecDir(options);
	} else if (key === "outDir") {
		await setOutDir(options);
	} else if (key === "distDir") {
		await setDistDir(options);
	} else {
		let never: never = key;
	}
}

async function writeConfig(options: RuntimeOptions, fakeOptions: Options, configFile: string) {
	try {
		let json = fakeOptions;
		(Object.keys(json) as (keyof Options)[]).forEach(key => {
			json[key] = options[key];
		})
		writeFileSync(configFile, JSON.stringify(json, null, 4), "utf-8");
	} catch (error) {
		options.taskLogs.error("写入配置文件失败: " + error);
	}
}

main();
