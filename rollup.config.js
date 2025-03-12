import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/main.js',
	output: {
		file: production ? 'public/assets/a2v10spreadsheet.min.js' : 'public/assets/a2v10spreadsheet.js',
		name: "A2v10-Spreadsheet",
		format: 'umd',
		sourcemap: true
	},
	plugins: [
		nodeResolve({
			browser: true
		}),
		commonjs(), // converts date-fns to ES modules
		production && terser()
	]
};