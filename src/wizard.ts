import { text, select, confirm, isCancel, progress } from '@clack/prompts';
import { exec } from 'node:child_process';

async function main() {
	run0();
	return;

	// Get user's name
	const name = await text({
		message: 'What is your name?',
		placeholder: 'John Doe',
	}) as string;

	progress({
		
	});

	if (isCancel(name)) {
		console.log('Operation cancelled');
		process.exit(0);
	}

	// Get user's preferred framework
	const framework = await select({
		message: 'Choose a framework:',
		options: [
			{ value: 'react', label: 'React' },
			{ value: 'vue', label: 'Vue' },
			{ value: 'svelte', label: 'Svelte' },
		],
	});

	if (isCancel(framework)) {
		console.log('Operation cancelled');
		process.exit(0);
	}

	// Confirm the selection
	const shouldProceed = await confirm({
		message: `Create a ${framework} project for ${name}?`,
	});

	if (shouldProceed) {
		console.log('Creating project...');
	}
}


async function run0() {
	const ls = exec("0-newVersion.bat");

	ls.stdout?.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	ls.stderr?.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	ls.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});

}

main();