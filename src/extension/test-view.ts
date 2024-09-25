import { commands, window } from 'vscode';
import { AbstractViewProvider } from '../helpers/webview';

export class TestViewProvider extends AbstractViewProvider {
	constructor() {
		super('test-container.test-webview');
	}

	override initialize() {
		this._register(
			this.view.onDidChangeVisibility(() => {
				window.showInformationMessage('don\'t hide me! 🥺');
				this.view.show(false);
			}),
		);

		this._register(
			commands.registerCommand('show-hello', () => {
				window.showInformationMessage('wow, such doge!!!!');
			}),
		);
		this.view.webview.html = `<h1>${Date.now()}</h1><a href="command:show-hello">show hello</a>`;
		this.view.show(true);
		this.view.webview.options = {
			enableCommandUris: true,
		};
	}
}
