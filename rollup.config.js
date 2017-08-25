import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import riot  from 'rollup-plugin-riot';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		entry: 'lib/index.js',
		dest: pkg.browser,
		format: 'iife',
		moduleName: 'RiotUtilities',
		plugins: [
            riot(),
			resolve(),
			commonjs(),
            babel(babelrc()),
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// the `targets` option which can specify `dest` and `format`)
	{
		entry: 'lib/index.js',
		external: ['js-beautify'],
		targets: [
			{ dest: pkg.main, format: 'cjs' },
			{ dest: pkg.module, format: 'es' }
		]
	}
];
