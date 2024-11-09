/**
 *  实现 React 的更新队列机制，主要功能包括：
 * 1. 创建更新：通过 createUpdate 函数创建单个更新。
 * 2. 创建更新队列：通过 createUpdateQueue 函数创建更新队列。
 * 3. 将更新加入队列：通过 enqueueUpdate 函数将更新加入队列。
 * 4. 处理更新：通过 processUpdateQueue 函数处理队列中的更新，计算新的 state。
 */
import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>;
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
}
/**
 * 创建一个新的更新
 */
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action
	};
};

/**
 * 创建一个新的更新队列
 */
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null
		}
	} as UpdateQueue<State>;
};

/**
 * 将更新添加到更新队列中
 */
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};

/**
 *  处理更新队列，计算新的 state
 * */
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState
	};
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			result.memoizedState = action(baseState);
		} else {
			result.memoizedState = action;
		}
	}
	return result;
};
