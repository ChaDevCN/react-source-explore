import { getBaseRollupPlugin, getPackageJSON, resolvePkgPath } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
const { name, module, peerDependencies } = getPackageJSON('react-dom');
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				format: 'umd',
				file: `${pkgDistPath}/index.js`,
				name: 'index.js'
			},
			{
				format: 'umd',
				file: `${pkgDistPath}/client.js`,
				name: 'client.js'
			}
		],
		external: [...Object.keys(peerDependencies)],
		plugins: [
			...getBaseRollupPlugin(),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version
					},
					main: 'index.js'
				})
			})
		]
	}
];
