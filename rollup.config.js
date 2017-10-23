import riot from 'rollup-plugin-riot'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import buble from 'rollup-plugin-buble'
import postcss from 'postcss'
import postcssCssnext from 'postcss-cssnext'

/**
 * Transforms new CSS specs into more compatible CSS
 */
function cssnext (tagName, css) {
  // A small hack: it passes :scope as :root to PostCSS.
  // This make it easy to use css variables inside tags.
  css = css.replace(/:scope/g, ':root')
  css = postcss([postcssCssnext]).process(css).css
  css = css.replace(/:root/g, ':scope')
  return css
}

export default {
  entry: 'lib/index.js',
  dest: 'dist/bundle.js',
  external: ['riot'],
  globals: { riot: 'riot' },
  plugins: [
    riot({
      style: 'cssnext',
      parsers: {
        css: { cssnext }
      }
    }),
    nodeResolve({ jsnext: true }),
    commonjs(),
    buble()
  ],
  moduleName: 'RiotUtils',
  format: 'iife'
}
