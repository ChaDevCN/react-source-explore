import { beginWork } from './beginWork';
import { completeWork } from './completeWork';
import { FiberNode } from './fiber';

// 正在工作的fiberNode
let workInProgress: FiberNode | null = null;

function renderRoot(root: FiberNode) {
	prepareRefreshStack(root);

	do {
		try {
			workLoop();
			break;
		} catch (error) {
			console.log(`workLoop 发生错误 `, error);
			workInProgress = null;
		}
	} while (true);
}

/**
 *  初始化
 *
 *  让 workInProgress 指向第一个工作的fiberNode
 **/
function prepareRefreshStack(fiber: FiberNode) {
	workInProgress = fiber;
}

function workLoop() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}
function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber); // 子fiber 或者 null
	next.memoizedProps = next.pendingProps;

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
