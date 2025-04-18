import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { createWorkInProgress, FiberNode, FiberRootNode } from './fiber';
import { MutationMask } from './fiberFlags';
import { NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

// 正在工作的fiberNode
let workInProgress: FiberNode | null = null;

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	//  当前fiber 有可能不是根节点
	//  因为dispatch 也会触发更新 不只是ReactDOM.createRoot().render
	const root = markUpdateFromToRoot(fiber);
	// 找到根节点 触发更新
	renderRoot(root);
}
/**
 * 找到根节点
 * */
function markUpdateFromToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		// 非根节点 继续向上遍历
		node = parent;
		parent = node.return;
	}
	// 根节点
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}
function renderRoot(root: FiberRootNode) {
	prepareRefreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (error) {
			if (__DEV__) {
				console.warn(`workLoop 发生错误 `, error);
			}
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate; // 获取上一次的fiberNode
	root.finishedWork = finishedWork; // 将上一次的fiberNode 赋值给finishedWork

	commitRoot(root);
}

/**
 *  初始化
 *
 *  让 workInProgress 指向第一个工作的fiberNode
 **/
function prepareRefreshStack(root: FiberRootNode) {
	workInProgress = createWorkInProgress(root.current, {});
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}
function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber); // 子fiber 或者 null
	fiber.memoizedProps = fiber.pendingProps; // 将fiber的pendingProps 赋值给memoizedProps

	if (next === null) {
		// 说明没有子 已经到最深处
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next; // 继续向下遍历
	}
}

// 这里已经没有子节点, 应该遍历兄弟节点
function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);

		const sibling = node.sibling;
		if (sibling !== null) {
			// 有兄弟节点
			workInProgress = sibling;
			return;
		}
		// 这里没有兄弟节点了
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}

/**
 * commit 阶段所需要执行的方法
 * @param root
 * @returns
 */
function commitRoot(root: FiberRootNode) {
	// 获取上一次的fiberNode
	const finishedWork = root.finishedWork;

	// 如果上一次的fiberNode 为空 则直接返回
	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.log('commit阶段开始,finishedWork: ', finishedWork);
	}

	// 将finishedWork 赋值为null 重置
	root.finishedWork = null;
	// 判断是否需要3个子阶段执行的操作
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation Placement
		root.current = finishedWork; // fiber树切换
	} else {
		root.current = finishedWork;
	}
}
