import { REACT_ELEMENT_TYPE } from 'shared/ReactSymboles';
import type {
	Type,
	Key,
	ReactElement,
	Ref,
	Props,
	ElementType
} from 'shared/ReactTypes';
const createElement = function (
	type: Type,
	key: Key,
	ref: Ref,
	props: Props
): ReactElement {
	const element = {
		$$typeof: REACT_ELEMENT_TYPE,
		type,
		key,
		ref,
		props,
		__mark: 'Charlie'
	};
	return element;
};
/**
 * jsx实现
 * @param {ElementType}
 * @param {config}
 * */
export const jsx = (type: ElementType, config: any, ...maybeChildren: any) => {
	let key: any = null;
	let ref: any = null;
	const props: any = {};

	for (const prop in config) {
		const val = config[prop];
		if (prop === 'key' && val !== undefined) {
			key = val;
			continue;
		}
		if (prop === 'ref' && val !== undefined) {
			ref = val;
			continue;
		}
		if ({}.hasOwnProperty.call(config, prop)) {
			props[prop] = val;
		}
	}
	const maybeChildrenLength = maybeChildren.length;
	if (maybeChildrenLength) {
		if (maybeChildrenLength === 1) {
			props.children = maybeChildrenLength[0];
		} else {
			props.children = maybeChildren;
		}
	}
	return createElement(type, key, ref, props);
};
export const jsxDev = jsx;
