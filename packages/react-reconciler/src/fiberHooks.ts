import internals from 'shared/internals';
import { FiberNode } from './fiber';
import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue,
	UpdateQueue
} from './updateQueue';
import { Action } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

const { currentDispatcher } = internals;
// 当前正在render的fiberNode
let currentlyRenderingFibe: FiberNode | null = null;
// 当前正在处理的hook
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;
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
		currentDispatcher.current = HooksDispatcherOnUpdate;
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
	workInProgressHook = null;
	currentHook = null;
	return child;
}
// mount hook list
const HooksDispatcherOnMonut: Dispatcher = {
	useState: mountState
};

// update hook list
const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};
function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前useState对应的hook

	const hook = updateWorkInProgresHook();

	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;
	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.menmoizeState, pending);
		hook.menmoizeState = memoizedState;
	}
	return [hook.menmoizeState, queue.dispatcher as Dispatch<State>];
}

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

function updateWorkInProgresHook(): Hook {
	let nextCurrentHook: Hook | null = null;
	if (currentHook === null) {
		const current = currentlyRenderingFibe?.alternate; // 这里是处理的wip

		if (current !== null) {
			nextCurrentHook = current?.menmoizeState;
		} else {
			// mount
			nextCurrentHook = null;
		}
	} else {
		// 第二次
		nextCurrentHook = currentHook.next;
	}
	if (nextCurrentHook === null) {
		throw new Error('update与mount时 hook数量不一致');
	}

	currentHook = nextCurrentHook as Hook; // 改变指针
	const newHook: Hook = {
		menmoizeState: currentHook.menmoizeState,
		updateQueue: currentHook.updateQueue,
		next: null
	};

	if (workInProgressHook === null) {
		if (currentlyRenderingFibe === null) {
			throw new Error('请在函数组件内调用hook');
		} else {
			workInProgressHook = newHook;
			currentlyRenderingFibe.menmoizeState = workInProgressHook;
		}
	} else {
		// 更改旧hook next
		workInProgressHook.next = newHook;
		// 当前工作的hook 指向新的hook
		workInProgressHook = newHook;
	}

	return workInProgressHook;
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
