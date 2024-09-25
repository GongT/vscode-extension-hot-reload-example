/**
 * @type {import('esbuild').Plugin}
 */
exports.injectTimePlugin = {
	name: 'time-inject',
	setup(build) {
		let time = 0;
		build.onStart(() => {
			time = Date.now();
		});
		build.onResolve({ filter: /^@@buildtime$/ }, () => {
			return {
				path: '@@buildtime',
				namespace: 'my-build-time',
				sideEffects: true,
				pluginData: {},
			};
		});
		build.onLoad({ filter: /^@@buildtime$/, namespace: 'my-build-time' }, () => {
			return {
				contents: time.toString(),
				loader: 'text',
			};
		});
	},
};
