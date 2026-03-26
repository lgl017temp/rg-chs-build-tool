import { existsSync, statSync } from "node:fs";
import { RuntimeOptions } from ".";
import { setPath } from "./util";
import { resolve } from "node:path";

export async function setSwfPCPath(options: RuntimeOptions) {
	await setPath(options, "swfPCPath", {
		message: "RealmGrinderDesktop.swf路径",
		validate: validSwfPCPath,
	});
}
export function validSwfPCPath(val?: string) {
	if (!val || !existsSync(val)) {
		return "文件不存在";
	}
	if (statSync(val).isDirectory() || !val.endsWith(".swf")) {
		return "不是.swf文件";
	}
}

export async function setFFdecDir(options: RuntimeOptions) {
	await setPath(options, "ffdecDir", {
		message: "ffdec目录",
		directory: true,
		validate: validFFdecDir,
	});
}
export function validFFdecDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory() || !existsSync(resolve(val, "ffdec.exe"))) {
		return "不是ffdec目录";
	}
}

export async function setOutDir(options: RuntimeOptions) {
	await setPath(options, "outDir", {
		message: "中间文件输出目录",
		directory: true,
		exists: false,
		validate: validOutDir,
	});
}
export function validOutDir(val?: string) {
	if (val && existsSync(val) && !statSync(val).isDirectory()) {
		return "不是目录";
	}
}

export async function setDistDir(options: RuntimeOptions) {
	await setPath(options, "distDir", {
		message: "打包结果输出目录",
		directory: true,
		exists: false,
		validate: validDistDir,
	});
}
export function validDistDir(val?: string) {
	if (val && existsSync(val) && !statSync(val).isDirectory()) {
		return "不是目录";
	}
}