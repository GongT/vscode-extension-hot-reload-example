import { context } from '../main';

export function theWorld() {
	return 'world';
}

context.subscriptions.push({
	dispose() {
		console.log('disposed!');
	},
});
