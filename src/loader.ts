import { commands, Disposable, ExtensionContext, OutputChannel, StatusBarAlignment, ThemeColor, window } from 'vscode';

function wrapContext(context: ExtensionContext): ExtensionContext {
	const subscriptions: Disposable[] = [];
	return new Proxy(
		{},
		{
			get(_, p, receiver) {
				if (p === 'subscriptions') {
					return subscriptions;
				}
				return Reflect.get(context, p, receiver);
			},
			set(target, p, newValue, receiver) {
				return Reflect.set(target, p, newValue, receiver);
			},
		},
	) as any;
}

function nocacheRequire(file: string) {
	const abs = require.resolve(file);
	delete require.cache[abs];
	return require(abs);
}

function doActivate(context: ExtensionContext, channel: OutputChannel) {
	if (wrappedContext) {
		return;
	}
	const newContext = wrapContext(context);
	Promise.resolve()
		.then(() => {
			return nocacheRequire('./main.js').activate(newContext, channel);
		})
		.catch((e) => window.showErrorMessage(e.message));

	wrappedContext = newContext;
}

function doDeactive() {
	if (!wrappedContext) {
		return;
	}
	const context = wrappedContext;
	wrappedContext = undefined;
	require('./main').deactivate();
	for (const dis of context.subscriptions) {
		dis.dispose();
	}
}

let wrappedContext: ExtensionContext | undefined;
export function activate(context: ExtensionContext) {
	const channel = window.createOutputChannel('My Extension');
	context.subscriptions.push(channel);

	if (process.env.MY_EXTENSION_DEBUG_MODE) {
		console.log(context.extension.packageJSON);
		Object.assign(globalThis, { vscode: require('vscode'), environ: process.env, context });
		commands.executeCommand('setContext', 'my-extension.debug', true);
	}
	doActivate(context, channel);

	// not used
	context.subscriptions.push(
		commands.registerCommand('test-command-deactive', () => {
			doDeactive();
		}),
	);

	// reload button
	context.subscriptions.push(
		commands.registerCommand('test-command-hot-reload', () => {
			channel.clear();
			doDeactive();
			channel.appendLine('=====================================');
			channel.appendLine('==       re-active plugin          ==');
			channel.appendLine('=====================================');
			doActivate(context, channel);
		}),
	);
	const bar = window.createStatusBarItem('test-command-hot-reload', StatusBarAlignment.Right, 100000);
	context.subscriptions.push(bar);
	bar.text = '$(sync) SoftReload';
	bar.backgroundColor = new ThemeColor('statusBarItem.prominentBackground');
	bar.command = 'test-command-hot-reload';
	bar.show();
}
export function deactivate() {
	doDeactive();
}
