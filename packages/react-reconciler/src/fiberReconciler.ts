import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import {
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	UpdateQueue
} from './updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';

/**
 *  创建 React 应用的容器
 * */
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null); // 创建 Fiber 树的根节点
	const root = new FiberRootNode(container, hostRootFiber); // 创建 FibeRootNode 这是整个 React 应用的顶层节点
	hostRootFiber.updateQueue = createUpdateQueue(); // 为根节点创建跟新队列
	return root; // 返回创建的根节点
}
/**
 *  更新容器的内容
 * */
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current; // 获取当前 fiber 树的根节点
	const update = createUpdate<ReactElementType | null>(element); // 创建一个新的更新，包含要渲染的元素
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	); // 将创建的更新加入到更新队列中
	scheduleUpdateOnFiber(hostRootFiber);
	return element; // 返回传入的元素
}
