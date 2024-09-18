import { getBaseRollupPlugin, getPackageJSON, resolvePkgPath } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
const { name, module } = getPackageJSON('react');
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
	{
		input: `${pkgPath}/${module}`,
		output: {
			format: 'umd',
			file: `${pkgDistPath}/index.js`,
			name: 'index.js'
		},
		plugins: [
			...getBaseRollupPlugin(),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version
				})
			})
		]
	},
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: {
			format: 'umd',
			file: `${pkgDistPath}/jsx-dev-runtime.js`,
			name: 'jsx-dev-runtime.js'
		},
		plugins: getBaseRollupPlugin()
	},
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: {
			format: 'umd',
			file: `${pkgDistPath}/jsx-rumtime.js`,
			name: 'jsx-rumtime.js'
		},
		plugins: getBaseRollupPlugin()
	}
];
