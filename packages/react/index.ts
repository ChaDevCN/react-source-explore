import currentDispatcher, {
	Dispatcher,
	resloveDispatcher
} from './src/currentDispatcher';
import { jsxDEV } from './src/jsx';

export default {
	createElement: jsxDEV,
	version: '0.0.0'
};

export const useState: Dispatcher['useState'] = (initialState) => {
	const dispatcher = resloveDispatcher();

	return dispatcher.useState(initialState);
};

/**暴露内部数据共享 */
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher
};
