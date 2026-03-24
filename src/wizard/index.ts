import { text, password, autocomplete, path, select, confirm, groupMultiselect, group, tasks, isCancel, progress, intro, outro, cancel, spinner, note, box, taskLog, stream, log, updateSettings, PathOptions } from '@clack/prompts';
import * as newPCVersion from "./newPCVersion";
import * as handlePC from "./handlePC";
import { resolve as resolvePath } from "node:path";
import iconv from "iconv-lite";
import { setDistDir, setFFdecDir, setOutDir, setSwfPCPath } from "./settings";

interface RuntimeParams {
	run0PC: boolean;

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
		title: 'tasklog',
		limit: 5,
	});

	const options: Options = {
		swfPCPath: "resource/RealmGrinderDesktop.swf",

		ffdecDir: "FFdec2",

		outDir: "out",
		distDir: "dist",
	};

	//加载配置

	const finalOptions: RuntimeOptions = {
		swfPCPath: resolvePath(options.swfPCPath),

		ffdecDir: resolvePath(options.ffdecDir),
		
		outDir: resolvePath(options.outDir),
		distDir: resolvePath(options.distDir),

		taskLogs,

		fast: false,
		run0PC: false,
	};

	//菜单
	//0.修改配置
	//1.全量执行
	//2.从步骤开始

	while (true) {
		await menu(finalOptions);
	}

	await newPCVersion.main(finalOptions);

	outro("处理完成");
	note(`最终生成结果在${options.distDir}中`);
}

async function menu(options: RuntimeOptions) {
	const key = await select({
		message: '功能菜单',
		options: [
			{ value: 'settings', label: '修改配置', hint: '文件路径等, 也可以执行时临时修改'},
			{ value: 'startFast', label: '快速执行', hint: '仅询问关键步骤和信息'},
			{ value: 'start', label: '执行', hint: '每一步都会询问'},
		],
		maxItems: 10,
	});

	if (key === "settings") {
		while (true) {
			if(await settings(options) === false) {
				break;
			}
		}
	}
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

main();