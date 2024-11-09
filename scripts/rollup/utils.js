import path from 'path';
import fs from 'fs';

import cjs from '@rollup/plugin-commonjs';
import ts from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';

export const pkgPath = path.resolve(__dirname, '../../packages');

export const distPath = path.resolve(__dirname, '../../dist/node_modules');

export const resolvePkgPath = (pkgName, isDist) => {
	if (isDist) {
		return `${distPath}/${pkgName}`;
	}
	return `${pkgPath}/${pkgName}`;
};

export const getPackageJSON = (pkgName) => {
	const path = `${resolvePkgPath(pkgName)}/package.json`;
	const str = fs.readFileSync(path, { encoding: 'utf-8' });
	return JSON.parse(str);
};

export const getBaseRollupPlugin = ({
	alias = {
		__DEV__: true
	},
	typescript = {}
} = {}) => [replace(alias), cjs(), ts(typescript)];
