import { Props, Key, ReactElementType } from 'shared/ReactTypes';
import { Container } from 'hostConfig';
import { FunctionComponent, HostComponent, WorkTag } from './workTags';
import { Flags, NoFlags } from './fiberFlags';

export class FiberNode {
	// Fiber 节点的标识和关键属性
	tag: WorkTag; // 标识 Fiber 节点类型
	key: Key; // 用于优化的唯一标识
	type: any; // 元素的类型（如函数组件、类组件、宿主组件）
	stateNode: any; // 指向实际 DOM 节点或组件实例

	// Fiber 树结构
	return: FiberNode | null; // 指向父 Fiber 节点
	sibling: FiberNode | null; // 指向下一个兄弟 Fiber 节点
	child: FiberNode | null; // 指向第一个子 Fiber 节点
	index: number; // 当前 Fiber 在兄弟节点中的索引

	// 作为工作单元
	pendingProps: Props; // 新的待处理属性
	memoizedProps: Props | null; // 上一次渲染时的属性
	menmoizeState: any; // 用来存储在上次渲染过程中最终获得的节点的`state`的
	updateQueue: unknown; // 用来存储更新队列的

	alternate: FiberNode | null; // 当前树 (current tree) 和 工作树 (workInProgress tree) 对应节点的建立. 上一次渲染的fiber
	flags: Flags; // 标识插入删除的标记
	subtreeFlags: Flags; // 子树中存在的flags
	deletions: FiberNode[] | null;

	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		// 初始化标识和关键属性
		this.tag = tag;
		this.key = key;
		this.type = null;
		this.stateNode = null;

		// 初始化 Fiber 树结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		// 初始化工作单元属性
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.updateQueue = null;
		this.menmoizeState = null;

		this.alternate = null;
		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

/**
 *  整个应用的顶层节点
 *  持有对 DOM 容器的引用
 *  管理整个 Fiber 树的状态
 *  FiberRootNode.current 指向 根FiberNode （tag 为 HostRoot）
 *  根FiberNode（tag 为 HostRoot）的stateNode 指向 FiberRootNode
 *
 */
export class FiberRootNode {
	container: Container; //挂在节点 比如 getElementById(#app)
	current: FiberNode; // 指向当前正在渲染或已渲染的fiber树的根节点
	finishedWork: FiberNode | null; // 指向已完成工作（但还未提交到DOM）的新 Fiber 树的根节点
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this; // 建立 FiberRootNode 和 FiberNode 双向连接
		this.finishedWork = null;
	}
}

/**
 * 根据 current Fiber 创建或复用本轮 render 要使用的 workInProgress Fiber。
 *
 * 什么时候调用：
 * - 当某个 Fiber 收到更新后，会从根节点开始进入 render/reconcile 流程。
 * - render 阶段需要构建一棵新的 Fiber 树时，会针对 current 树上的节点调用这个函数。
 * - 首次更新某个节点时，如果还没有 alternate，就创建一个新的 wip。
 * - 后续更新同一个节点时，如果 alternate 已经存在，就复用旧的 wip。
 *
 * 作用：
 * - 实现 Fiber 的“双缓存”结构：current 表示屏幕上已经提交的旧树，wip 表示本轮正在计算的新树。
 * - 把 current 上可以复用的信息复制到 wip 上，例如 type、updateQueue、child、memoizedState。
 * - 清理本轮 render 需要重新收集的副作用标记，例如 flags、subtreeFlags、deletions。
 */
export const createWorkInProgress = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	// alternate 指向另一棵 Fiber 树中和 current 对应的节点。
	// 如果 current 是旧树节点，那么 current.alternate 就是本轮可以使用的 wip 节点。
	let wip = current.alternate;

	if (wip === null) {
		// 第一次为这个 current 创建对应的 wip，建立双缓存关系。
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;

		wip.alternate = current;
		current.alternate = wip;
	} else {
		// 已经存在 wip 时，直接复用它，并写入本轮 render 的新 props。
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
	}

	// 这些字段来自 current，是本轮计算新结果时需要继承的基础信息。
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.menmoizeState = current.menmoizeState;
	wip.memoizedProps = current.memoizedProps;

	return wip;
};

export function createFiberFromELment(element: ReactElementType) {
	const { type, props, key } = element;
	let fiberTag: WorkTag = FunctionComponent;
	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;

	return fiber;
}
