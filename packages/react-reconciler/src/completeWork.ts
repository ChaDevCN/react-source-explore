import {
	appendInitialChild,
	Container,
	createInstance,
	createTextInstance
} from 'hostConfig';
import { FiberNode } from './fiber';
import { HostComponent, HostRoot, HostText } from './workTags';
import { NoFlags } from './fiberFlags';

export const completeWork = (wip: FiberNode) => {
	// 递归中的归
	const newProps = wip.pendingProps;
	const current = wip.alternate;

	switch (wip.tag) {
		case HostComponent:
			// 构建离线DOM节点
			if (current !== null && wip.stateNode) {
				// 更新阶段
			} else {
				/**
				 * 首屏渲染的流程
				 *   1. 创建DOM节点
				 * 	 2. 挂载子节点
				 */
				const instance = createInstance(wip.type, newProps);
				appendAllChild(instance, wip);
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				// update
			} else {
				// 1. 构建DOM
				const instance = createTextInstance(newProps.content);
				// 2.不需要插入，HostText不存在childen
				wip.stateNode = instance;
			}
			bubbleProperties(wip);
			return null;
		case HostRoot:
			return null;
		default:
			if (__DEV__) {
				console.warn(`未处理的completeWork情况`, wip);
			}
			break;
	}
	// return null;
};

/**
 * 将DOM 节点添加到DOM树中
 * @param parent 接受的DOM节点
 * @param wip 被插入的节点
 * @returns
 */
function appendAllChild(parent: Container, wip: FiberNode) {
	let node = wip.child;
	// 遍历子节点
	while (node !== null) {
		// 如果节点是HostText或HostComponent，则添加到父节点
		if (node?.tag !== HostText && node?.tag !== HostComponent) {
			appendInitialChild(parent, node);
		} else if (node.child !== null) {
			// 如果节点有子节点，则将子节点添加到父节点
			node.child.return = node;
			// 将子节点赋值给node 继续遍历
			node = node.child;
			continue;
		}
		// 如果当前节点是workInProgress，则退出
		if (node === wip) {
			return;
		}
		// 如果当前节点没有兄弟节点，则向上遍历
		while (node.sibling === null) {
			if (node?.return === null || node.return === wip) {
				return;
			}
			// 如果当前节点有兄弟节点，则将兄弟节点赋值给node 继续遍历
			node = node.return;
		}
		node.sibling.return = node.return;

		node = node.sibling;
	}
}

/**
 * 将fiberNode flags 冒泡到父节点
 * @param wip
 */
function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;

	let node = wip.child;
	while (node !== null) {
		/**
		 *  |= 位或运算符
		 * 		按位或运算符的规则是：如果两个对应的二进制位中有一个为1，则结果为1，否则为0。
		 * 		例如：
		 * 		1010 | 1100 = 1110
		 * 		1010 | 0110 = 1110
		 * 		1010 | 0000 = 1010
		 * 		1010 | 1010 = 1010
		 *  将node.subtreeFlags 和 subtreeFlags 进行位或运算
		 *  将node.subtreeFlags 的值赋值给 subtreeFlags
		 */
		subtreeFlags |= node.subtreeFlags;
		node.subtreeFlags = subtreeFlags;

		node.return = wip; // 将node的父节点设置为wip
		node = node.sibling; // 便利兄弟节点
	}
	wip.subtreeFlags = subtreeFlags; // 最终的subtreeFlags 赋值给当前fiber
}
