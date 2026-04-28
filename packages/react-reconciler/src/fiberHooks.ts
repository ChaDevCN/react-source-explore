import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

const { currentDispatcher } = internals;
// 当前正在render的fiberNode
let currentlyRenderingFibe: FiberNode | null = null;
// 当前正在处理的hook
let workInProgressHook: Hook | null = null;
interface Hook {
	menmoizeState: any;
	updateQueue: unknown;
	next: Hook | null;
}

/**
 * 执行function component 返回真实的节点
 * @param wip 工作节点
 */
export function renderWithHooks(wip: FiberNode) {
	// 赋值
	currentlyRenderingFibe = wip;
	wip.menmoizeState = null;
	const current = wip.alternate;
	if (current !== null) {
		// update
	} else {
		// mount
		// workInProgressHook =
		currentDispatcher.current = HooksDispatcherOnMonut;
	}
	const Component = wip.type;
	const props = wip.pendingProps;
	const child = Component(props);

	// 重置
	currentlyRenderingFibe = null;
	return child;
}
// mount hook list
const HooksDispatcherOnMonut: Dispatcher = {
	useState: mountState
};

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前useState对应的hook数据
	const hook = mountWorkInProgresHook();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.menmoizeState = memoizedState;

	// @ts-ignore
	const dispatcher = dispatcherSetState.bind(
		null,
		currentlyRenderingFibe as FiberNode,
		queue
	);
	queue.dispatcher = dispatcher;
	return [memoizedState, dispatcher];
}

function mountWorkInProgresHook(): Hook {
	// 初始化一份hook
	const hook: Hook = {
		menmoizeState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		if (currentlyRenderingFibe === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = hook;
			currentlyRenderingFibe.menmoizeState = workInProgressHook;
		}
	} else {
		// 更改旧hook next
		workInProgressHook.next = hook;
		// 当前工作的hook 指向新的hook
		workInProgressHook = hook;
	}

	return workInProgressHook;
}

function dispatcherSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate<State>(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
}
