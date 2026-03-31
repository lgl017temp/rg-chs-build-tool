import { existsSync, statSync } from "node:fs";
import { RuntimeOptions } from ".";
import { setPath } from "./util";
import { resolve } from "node:path";

export async function setSwfPCPath(options: RuntimeOptions) {
	await setPath(options, "swfPCPath", {
		message: "选择RealmGrinderDesktop.swf路径",
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

export async function setNewApkPath(options: RuntimeOptions) {
	await setPath(options, "newApkPath", {
		message: "选择最新apk路径",
		validate: validNewApkPath,
	});
}
export function validNewApkPath(val?: string) {
	if (!val || !existsSync(val)) {
		return "文件不存在";
	}
	if (statSync(val).isDirectory() || !val.endsWith(".apk")) {
		return "不是.apk文件";
	}
}

export async function setJavaDir(options: RuntimeOptions) {
	await setPath(options, "javaDir", {
		message: "选择jdk目录",
		directory: true,
		validate: validJavaDir,
	});
}
export function validJavaDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory() || !existsSync(resolve(val, "bin", "java.exe"))) {
		return "不是jdk目录";
	}
}

export async function setFFdecDir(options: RuntimeOptions) {
	await setPath(options, "ffdecDir", {
		message: "选择ffdec目录",
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
		message: "选择中间文件输出目录",
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
		message: "选择打包结果输出目录",
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