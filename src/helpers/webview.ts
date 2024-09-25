import {
	CancellationToken,
	Disposable,
	ViewColumn,
	WebviewView,
	WebviewViewProvider,
	WebviewViewResolveContext,
	window,
} from 'vscode';
import { context } from '../main';

const defaultOptions = {
	webviewOptions: {
		retainContextWhenHidden: false,
	},
};

export abstract class AbstractViewProvider implements WebviewViewProvider, Disposable {
	private readonly _viewId: string;

	constructor(viewId?: string) {
		this._viewId = viewId ?? this.constructor.name;
		// console.log('init: %s', this._viewId);

		try {
			this.__restore();
		} catch {}
		if (this.view) {
			this.__initialize();
		} else {
		}
	}

	protected view!: WebviewView;
	protected context!: WebviewViewResolveContext;
	protected token!: CancellationToken;

	registerProvider(options: Parameters<typeof window.registerWebviewViewProvider>[2] = defaultOptions) {
		context.subscriptions.push(window.registerWebviewViewProvider(this._viewId, this, options));
		context.subscriptions.push(this);
	}

	get viewId() {
		return this._viewId;
	}

	private __restore() {
		const symbol_view_store = Symbol.for('@webview/view/' + this._viewId);
		const global = globalThis as any;
		// console.log('[restore] %s', symbol_view_store, global[symbol_view_store]);
		this.view = global[symbol_view_store].view;
		this.context = global[symbol_view_store].context;
		this.token = global[symbol_view_store].token;
		delete global[symbol_view_store];
	}
	private __save() {
		const symbol_view_store = Symbol.for('@webview/view/' + this._viewId);
		const global = globalThis as any;
		console.assert(!global[symbol_view_store], 'duplicate instance of webview %s', this._viewId);
		global[symbol_view_store] = { view: this.view, context: this.context, token: this.token };
		// console.log('[save] %s', symbol_view_store, global[symbol_view_store]);
	}

	resolveWebviewView(webviewView: WebviewView, context: WebviewViewResolveContext, token: CancellationToken) {
		// console.log('view %s creation requested', this._viewId);
		console.assert(!this.view, 'view not disposed before next resolve.');
		this.view = webviewView;
		this.context = context;
		this.token = token;
		return this.__initialize();
	}

	private _disposables: Disposable[] = [];
	protected _register<T extends Disposable>(disposable: T): T {
		this._disposables.push(disposable);
		return disposable;
	}

	dispose(): void {
		// console.log('view %s disposing %d items', this._viewId, this._disposables.length);
		if (this._disposables.length) {
			// never empty because __initialize()
			this._disposables.forEach((d) => d.dispose());
			this._disposables.length = 0;

			delete this.view.title, this.view.badge, this.view.description;
			this.view.webview.options = {};
			this.view.webview.html = '';
			this.__save();
		}
	}

	private __initialize(): void | Thenable<void> {
		this._register(
			this.view.onDidDispose(() => {
				// console.log('webview disposed by external');
				this.dispose();
			}),
		);
		this._register(
			this.token.onCancellationRequested(() => {
				// console.log('cancel resolve webview');
				this.dispose();
			}),
		);
		return this.initialize();
	}

	protected abstract initialize(): void | Thenable<void>;
}
