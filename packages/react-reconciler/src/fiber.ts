import { Props, Key } from 'shared/ReactTypes';
import { Container } from 'hostConfig';
import { WorkTag } from './workTags';
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

	alternate: FiberNode | null; // 当前树 (current tree) 和 工作树 (workInProgress tree) 对应节点的建立.
	flags: Flags;

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

		this.alternate = null;
		// 副作用
		this.flags = NoFlags;
	}
}

export class FiberRootNode {
	container: Container; //挂在节点 比如 getElementById(#app)
	current: FiberNode;
	finisheWork: FiberNode | null;
	constructor(container: Container, hostRootFiber: FiberNode) {
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finisheWork = null;
	}
}
