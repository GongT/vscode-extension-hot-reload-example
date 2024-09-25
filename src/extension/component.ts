import { commands, StatusBarAlignment, StatusBarItem, ThemeColor, window } from 'vscode';
import { context } from '../main';

const store = globalThis as any;
if (!store._not_disposed_value_dont_use) {
	store._not_disposed_value_dont_use = 0;
}

export class Component {
	private readonly bar: StatusBarItem;

	private readonly command = commands.registerCommand('test-button-action', () => {
		store._not_disposed_value_dont_use += 1;
		this.bar.text = '$(error) value: ' + store._not_disposed_value_dont_use;
	});

	constructor() {
		console.log('construct of component');

		const bar = window.createStatusBarItem('test-button', StatusBarAlignment.Right);
		context.subscriptions.push(bar);
		bar.text = '$(error) value: ' + store._not_disposed_value_dont_use;
		bar.backgroundColor = new ThemeColor('statusBarItem.');
		bar.command = 'test-button-action';
		bar.show();

		this.bar = bar;
	}

	dispose() {
		console.log('destruct of component');
		this.bar.dispose();
		this.command.dispose();
	}
}
