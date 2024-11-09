import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText } from './workTags';

export const beginWork = (wip: FiberNode) => {
	// 比较 ReactElement 和 fiberNode 生成子并返回fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);
		case HostComponent:
			return;
		case HostText:
			return;
		default:
			if (__DEV__) {
				console.warn(`workInProgress为实现的类型`, wip.tag);
			}
			return;
	}
};

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.menmoizeState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;

	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null; // 清除
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.menmoizeState = memoizedState;

	const nextChildren = wip.menmoizeState;
}
