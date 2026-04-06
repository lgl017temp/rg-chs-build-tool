import { box, confirm, path, progress, spinner, taskLog, tasks } from "@clack/prompts";
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { FastLevel, RuntimeOptions } from ".";
import { join, resolve } from "node:path";
import { setOutDir, setSwfPCPath, setTransPath, validOutDir, validSwfPCPath, validTransPath } from "./settings";
import { gb2312Str } from "./util";
import * as extract from "../extract";
import * as toPo from "../toPo";

export interface RuntimeParams {
}

export interface Options {
	javaDir: string,
	poeditDir: string,
	deflateUtilPath: string,
	
	transPath: string,
	
	outDir: string,
}

export async function main(options: RuntimeOptions) {
	if (options.fast >= FastLevel.step) {
		const needRun = await confirm({
			message: "执行处理翻译文件?",
		});
		
		if (!needRun) {
			return;
		}
	}
	
	box("处理翻译文件");

	if ((options.fast >= FastLevel.all) || validOutDir(options.outDir)) {
		await setOutDir(options);
	}
	if ((options.fast >= FastLevel.important) || validTransPath(options.transPath)) {
		await setTransPath(options);
	}

	let spin = spinner();
	while(true) {
		spin.start("提取翻译文件");

		await extractTrans(options);

		spin.stop(`提取翻译文件完成, 请打开${join(options.outDir, "翻译处理结果.xlsx")}, 检查是否需要调整`);

		if ((options.fast >= FastLevel.important)) {
			if (await confirm({message: `是否需要重新读取翻译`}) !== true) {
				break;
			}
		} else {
			break;
		}
	}

	await tasks([
		{
			title: '生成po文件',
			task: async (message) => {
				await genPo(options);
				return '生成po文件完成';
			},
		},
		{
			title: '生成mo文件',
			task: async (message) => {
				await genMo(options);
				return '生成mo文件完成';
			},
		},
		//TODO 检测资源变动，自动重新修改
	]);
}

async function extractTrans(options: RuntimeOptions) {
	try {
		await extract._main(join(options.outDir, "scripts"), join(options.outDir, "phone", "scripts"), options.transPath, join(options.outDir, "翻译处理结果.xlsx"));
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}
async function genPo(options: RuntimeOptions) {
	try {
		await toPo._main(join(options.outDir, "翻译处理结果.xlsx"), join(options.outDir, "13_realmgrinder_es_ES.po"));
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}
async function genMo(options: RuntimeOptions) {
	//cd ./Poedit/GettextTools/bin && msgfmt.exe ../../../out/13_realmgrinder_es_ES.po -o ../../../out/13_realmgrinder_es_ES.mo
	//cd ../../../jdk-17.0.2/bin && java -jar ../../deflateUtil.jar y ../../out/13_realmgrinder_es_ES.mo ../../out/13_realmgrinder_es_ES_compress.mo
	try {
		const outDir = join(options.outDir);
		mkdirSync(outDir, {recursive: true});

		spawnSync(join(options.poeditDir, "GettextTools", "bin", "msgfmt.exe"), [
			`${join(outDir, "13_realmgrinder_es_ES.po")}`,
			"-o",
			`${join(outDir, "13_realmgrinder_es_ES.mo")}`,
		], { shell: false, cwd: options.poeditDir });

		spawnSync(join(options.javaDir, "bin", "java.exe"), [
			"-jar",
			`${options.deflateUtilPath}`,
			"y",
			`${join(outDir, "13_realmgrinder_es_ES.mo")}`,
			`${join(outDir, "13_realmgrinder_es_ES_compress.mo")}`,
		], { shell: false });
	} catch (error) {
		options.taskLogs.error("" + error);
		throw error;
	}
}
