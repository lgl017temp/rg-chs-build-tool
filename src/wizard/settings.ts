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

export async function setSwfPhonePath(options: RuntimeOptions) {
	await setPath(options, "swfPhonePath", {
		message: "选择RealmGrinderMobile.swf路径",
		validate: validSwfPhonePath,
	});
}
export function validSwfPhonePath(val?: string) {
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

export async function setV434ApkPath(options: RuntimeOptions) {
	await setPath(options, "v434ApkPath", {
		message: "选择4.3.4版本apk路径",
		validate: validV434ApkPath,
	});
}
export function validV434ApkPath(val?: string) {
	if (!val || !existsSync(val)) {
		return "文件不存在";
	}
	if (statSync(val).isDirectory() || !val.endsWith(".apk")) {
		return "不是.apk文件";
	}
}

export async function setJavaDir(options: RuntimeOptions) {
	await setPath(options, "javaDir", {
		message: "选择JDK目录",
		directory: true,
		validate: validJavaDir,
	});
}
export function validJavaDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory() || !existsSync(resolve(val, "bin", "java.exe"))) {
		return "不是JDK目录";
	}
}

export async function setFFdecDir(options: RuntimeOptions) {
	await setPath(options, "ffdecDir", {
		message: "选择FFDec目录",
		directory: true,
		validate: validFFdecDir,
	});
}
export function validFFdecDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory() || !existsSync(resolve(val, "ffdec.exe"))) {
		return "不是FFDec目录";
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

export async function setTransPath(options: RuntimeOptions) {
	await setPath(options, "transPath", {
		message: "选择翻译文件路径",
		validate: validTransPath,
	});
}
export function validTransPath(val?: string) {
	if (!val || !existsSync(val)) {
		return "文件不存在";
	}
	if (statSync(val).isDirectory() || (!val.endsWith(".xls") && !val.endsWith(".xlsx"))) {
		return "不是excel文件";
	}
}

export async function setDeflateUtilPath(options: RuntimeOptions) {
	await setPath(options, "deflateUtilPath", {
		message: "选择deflateUtil.jar路径",
		validate: validDeflateUtilPath,
	});
}
export function validDeflateUtilPath(val?: string) {
	if (!val || !existsSync(val)) {
		return "文件不存在";
	}
	if (statSync(val).isDirectory() || !val.endsWith(".jar")) {
		return "不是.jar文件";
	}
}

export async function setManifestEditorPath(options: RuntimeOptions) {
	await setPath(options, "manifestEditorPath", {
		message: "选择ManifestEditor-2.0.jar路径",
		validate: validManifestEditorPath,
	});
}
export function validManifestEditorPath(val?: string) {
	if (!val || !existsSync(val)) {
		return "文件不存在";
	}
	if (statSync(val).isDirectory() || !val.endsWith(".jar")) {
		return "不是.jar文件";
	}
}

export async function setPoeditDir(options: RuntimeOptions) {
	await setPath(options, "poeditDir", {
		message: "选择Poedit目录",
		directory: true,
		validate: validPoeditDir,
	});
}
export function validPoeditDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory() || !existsSync(resolve(val, "GettextTools", "bin", "msgfmt.exe"))) {
		return "不是Poedit目录";
	}
}

export async function setAndroidBuildToolsDir(options: RuntimeOptions) {
	await setPath(options, "androidBuildToolsDir", {
		message: "选择安卓编译工具目录",
		directory: true,
		validate: validAndroidBuildToolsDir,
	});
}
export function validAndroidBuildToolsDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory() || !existsSync(resolve(val, "zipalign.exe"))) {
		return "不是安卓编译工具目录";
	}
}

export async function setFontPCDir(options: RuntimeOptions) {
	await setPath(options, "fontPCDir", {
		message: "选择PC端字体目录",
		directory: true,
		validate: validFontPCDir,
	});
}
export function validFontPCDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory()) {
		return "不是目录";
	}
}

export async function setFontPhoneDir(options: RuntimeOptions) {
	await setPath(options, "fontPhoneDir", {
		message: "选择Android端字体目录",
		directory: true,
		validate: validFontPhoneDir,
	});
}
export function validFontPhoneDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory()) {
		return "不是目录";
	}
}

export async function setResourceDir(options: RuntimeOptions) {
	await setPath(options, "resourceDir", {
		message: "选择图片资源目录",
		directory: true,
		validate: validResourceDir,
	});
}
export function validResourceDir(val?: string) {
	if (!val || !existsSync(val)) {
		return "目录不存在";
	}
	if (!statSync(val).isDirectory()) {
		return "不是目录";
	}
}

export async function setKeystorePath(options: RuntimeOptions) {
	await setPath(options, "keystorePath", {
		message: "选择签名密钥路径",
		validate: validKeystorePath,
	});
}
export function validKeystorePath(val?: string) {
	if (!val || !existsSync(val)) {
		return "文件不存在";
	}
	if (statSync(val).isDirectory() || !val.endsWith(".keystore")) {
		return "不是.keystore文件";
	}
}