import { spawn } from 'child_process';
import { ExtensionContext, OutputChannel } from 'vscode';
import { TestViewProvider } from './extension/test-view';

console.log('plugin load: ', require('@@buildtime')); // this is an example esbuild plugin

export let channel: OutputChannel;
export let context: ExtensionContext;

export async function activate(_context: ExtensionContext, _channel: OutputChannel) {
	context = _context;
	channel = _channel;

	channel.appendLine(`[startup] plugin built at ${require('@@buildtime')}`);

	const { Component } = await import('./extension/component');
	const obj = new Component();
	context.subscriptions.push(obj);

	const script = context.asAbsolutePath('dist/standalone/binary-main.js');
	const proc = spawn(process.execPath, [script], {
		stdio: 'inherit',
	});
	context.subscriptions.push({
		dispose() {
			proc.kill('SIGKILL');
		},
	});

	const provider = new TestViewProvider();
	provider.registerProvider();
}

export function deactivate() {}
