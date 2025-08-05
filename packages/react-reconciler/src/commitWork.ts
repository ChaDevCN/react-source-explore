import { appendChildToContainer, Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { MutationMask, Placement } from './fiberFlags';
import { NoFlags } from './fiberFlags';
import { HostComponent, HostRoot, HostText } from './workTags';

// 指向在一个需要执行的Effect
let nextEffect: FiberNode | null = null;

/**
 * 提交 Mutation 类型的副作用（比如 Placement 插入 DOM）
 * @param finishedWork 当前完成的 fiber 树
 */
export function commitMutationEffects(finishedWork: FiberNode) {
	nextEffect = finishedWork; // 从根节点开始遍历

	while (nextEffect !== null) {
		// 获取当前节点的子节点
		const child: FiberNode | null = nextEffect.child;
		// 如果子树上存在 Mutation 副作用，且存在子节点，则向下遍历
		if (
			(nextEffect?.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child; // 继续遍历子节点
		} else {
			// 向上回溯，执行当前节点的副作用，再看是否有兄弟节点
			up: while (nextEffect !== null) {
				// 处理当前节点的副作用（如插入 DOM）
				commitMutationEffectsOnFiber(nextEffect);
				// 查找兄弟节点
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					// 有兄弟则遍历兄弟
					nextEffect = sibling;
					break up;
				}
				// 没有兄弟则向上
				nextEffect = nextEffect.return;
			}
		}
	}
}
/**
 * 处理单个 Fiber 节点的副作用（目前只处理 Placement）
 */
const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	// 当前节点的副作用标记
	const flags = finishedWork.flags;

	if ((flags & Placement) !== NoFlags) {
		// 如果包含 Placement 标记，执行插入逻辑
		commitPlacement(finishedWork);

		// 清除已经执行的 Placement 标记，避免重复处理
		finishedWork.flags &= ~Placement;
	}
	// flags update
};

/**
 * 执行 Placement 插入操作
 * 包含两件事：
 * 1. 找到需要插入的真实 DOM
 * 2. 找到插入的父级 DOM 节点并执行插入
 * @param finishedWork 当前要插入的 Fiber 节点（可能是 HostComponent 或其嵌套结构）
 */
const commitPlacement = (finishedWork: FiberNode) => {
	if (__DEV__) {
		console.warn('执行Placement操作');
	}
	// 获取要插入的父节点
	const hostParent = getHostParent(finishedWork);
	// 执行插入
	if (hostParent !== null) {
		appendPlacementNodeIntoContainer(finishedWork, hostParent);
	}
};

/**
 * 查找最近的宿主父节点（即真实 DOM 容器）
 * @param fiber 当前 Fiber 节点，从它开始向上查找
 * @returns  返回一个真实 DOM 节点容器（可能是 DOM 元素或根节点的 container）
 */
function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return; // 向上查找父节点

	while (parent) {
		const parentTag = parent.tag;

		// hostComponent
		if (parentTag === HostComponent) {
			// 如果找到原生 DOM 节点，返回它的 stateNode（真实 DOM）
			return parent.stateNode as Container;
		}

		if (parentTag === HostRoot) {
			// 如果是根节点，返回根容器
			return (parent.stateNode as FiberRootNode).container;
		}
		// 继续向上查找
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到hostParent');
	}
	return null;
}

/**
 * 将某个 Fiber 对应的 DOM 节点插入到指定的宿主父容器中
 * 注意：该函数会向下递归查找 fiber 树中所有可以插入的 DOM 节点（HostComponent 或 HostText）
 *
 * @param finishedWork 当前的 Fiber 节点（可以是嵌套的 container）
 * @param hostParent 宿主环境的父容器节点（即最终插入到的 DOM 容器）
 */
function appendPlacementNodeIntoContainer(
	finishedWork: FiberNode,
	hostParent: Container
) {
	// 如果当前节点是原生 DOM 或文本节点，直接插入
	if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
		appendChildToContainer(finishedWork.stateNode, hostParent);
		return;
	}
	// 否则向下查找子节点，找到可插入的真实 DOM 节点
	const child = finishedWork.child;
	if (child !== null) {
		// 插入第一个子节点
		appendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling;

		while (sibling !== null) {
			// 插入其兄弟节点
			appendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}
