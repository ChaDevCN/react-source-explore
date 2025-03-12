/**
 *  实现 React 的更新队列机制，主要功能包括：
 * 1. 创建更新：通过 createUpdate 函数创建单个更新。
 * 2. 创建更新队列：通过 createUpdateQueue 函数创建更新队列。
 * 3. 将更新加入队列：通过 enqueueUpdate 函数将更新加入队列。
 * 4. 处理更新：通过 processUpdateQueue 函数处理队列中的更新，计算新的 state。
 */
import { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>; // 更新的动作，可以是一个函数或新的 state 值
}

export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null; // 待处理的更新
	};
}
/**
 * 创建一个新的更新
 */
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action // 返回包含 action 的更新对象
	};
};

/**
 * 创建一个新的更新队列
 */
export const createUpdateQueue = <State>() => {
	return {
		shared: {
			pending: null // 初始化时没有待处理的更新
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
	updateQueue.shared.pending = update; // 将更新设置为待处理状态
};

/**
 *  处理更新队列，计算新的 state
 *  @param baseState 初始状态
 *  @param pendingUpdate 待处理的更新
 *  @returns 返回包含 memoizedState 的对象，memoizedState 是计算后的新状态
 *  @description 这个函数通常在组件的 state 需要更新时使用。React 会在组件接收到新的更新时调用此函数，
 *  以便根据当前的 baseState 和待处理的更新计算出新的 state。
 *
 *
 *  具体来说，当组件的 state 发生变化时，React 会将这个变化作为一个更新对象（Update）加入到更新队列中。
 *  然后，React 会调用 processUpdateQueue 函数来处理这个更新对象。函数首先会检查是否有待处理的更新，
 *  如果有，则获取更新的动作（action）。如果这个动作是一个函数，函数会被执行并传入当前的 baseState，
 *  其返回值将作为新的 state。如果动作不是函数，则直接将其作为新的 state。最后，函数返回包含新 state 的对象。
 * */
export const processUpdateQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdateQueue<State>> = {
		memoizedState: baseState // 初始状态为 baseState
	};
	if (pendingUpdate !== null) {
		// 如果有待处理的更新
		const action = pendingUpdate.action; // 获取更新的动作
		if (action instanceof Function) {
			// 如果动作是一个函数
			result.memoizedState = action(baseState); // 执行函数并传入 baseState，结果作为新的状态
		} else {
			result.memoizedState = action; // 如果动作不是函数，直接将其作为新的状态
		}
	}
	return result; // 返回包含新状态的对象
};
