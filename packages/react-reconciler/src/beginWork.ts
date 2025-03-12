import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode } from './fiber';
import { processUpdateQueue, UpdateQueue } from './updateQueue';
import { HostComponent, HostRoot, HostText } from './workTags';
import { mountChildFibers, reconcileChildFibers } from './childFibers';

/**
 * beginWork是递归构建Fiber树的核心函数
 * 主要职责：
 * 1. 根据fiber.tag对不同类型节点进行更新
 * 2. 创建子Fiber节点
 * 3. 返回子Fiber节点用于下一次循环
 *
 * @param wip - 当前工作中的Fiber节点(workInProgress)
 * @returns 返回子Fiber节点或null
 */
export const beginWork = (wip: FiberNode) => {
	// 比较 ReactElement 和 fiberNode 生成子并返回fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.warn(`workInProgress为实现的类型`, wip.tag);
			}
			return;
	}
};

/**
 * 更新HostRoot类型的Fiber节点
 * 执行顺序：
 * 1. 获取基础状态和更新队列
 * 2. 处理更新队列得到新状态
 * 3. 与子节点进行协调
 *
 * @param wip - 当前工作中的Fiber节点
 * @returns 返回子Fiber节点
 */
function updateHostRoot(wip: FiberNode) {
	// 获取上一次渲染的状态
	const baseState = wip.menmoizeState;
	// 获取更新队列
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;

	// 获取待处理的更新
	const pending = updateQueue.shared.pending;
	// 清空待处理的更新，防止重复处理
	updateQueue.shared.pending = null;

	// 处理更新队列，计算新的状态
	const { memoizedState } = processUpdateQueue(baseState, pending);
	// 保存新的状态
	wip.menmoizeState = memoizedState;

	const nextChildren = wip.menmoizeState;

	// 与子节点进行协调
	reconcileChildren(wip, nextChildren);

	return wip.child;
}
/**
 * 更新HostComponent类型的Fiber节点（如div、span等DOM元素）
 * 特点：
 * - 没有更新逻辑，只负责创建子Fiber节点
 * - props中的children作为新的子节点内容
 *
 * @param wip - 当前工作中的Fiber节点
 * @returns 返回子Fiber节点
 */
function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;

	reconcileChildren(wip, nextChildren);

	return wip.child;
}

/**
 * 协调子节点的核心函数
 * 执行逻辑：
 * 1. 判断是首次渲染(mount)还是更新(update)
 * 2. mount: 使用mountChildFibers创建子Fiber
 * 3. update: 使用reconcileChildFibers进行对比更新
 *
 * @param wip - 当前工作中的Fiber节点
 * @param children - 新的子节点
 */
function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;

	if (current !== null) {
		// update阶段：需要将新的子节点与旧的子节点进行对比
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount阶段：首次渲染，直接创建新的子Fiber节点
		wip.child = mountChildFibers(wip, null, children);
	}
}
