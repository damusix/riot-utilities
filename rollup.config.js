import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
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
            // resolve(), // so Rollup can find `ms`
            // commonjs(), // so Rollup can convert `ms` to an ES module
            riot(),
            babel(babelrc())
        ]
    },

    // CommonJS (for Node) and ES module (for bundlers) build.
    // (We could have three entries in the configuration array
    // instead of two, but it's quicker to generate multiple
    // builds from a single configuration where possible, using
    // the `targets` option which can specify `dest` and `format`)
    {
        entry: 'lib/index.js',
        // external: ['ms'],
        targets: [
            { dest: pkg.module, format: 'es' }
        ]
    }
];
