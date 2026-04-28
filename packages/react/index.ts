import currentDispatcher, {
	Dispatcher,
	resloveDispatcher
} from './src/currentDispatcher';
import { jsxDEV, isValidElement as isValidElementFn } from './src/jsx';

export const version = '0.0.0';
export const createElement = jsxDEV;
export const isValidElement = isValidElementFn;
export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resloveDispatcher();

	return dispatcher.useState(initialState);
};

/**暴露内部数据共享 */
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};
