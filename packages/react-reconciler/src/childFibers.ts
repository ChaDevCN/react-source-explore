import { ReactElementType } from 'shared/ReactTypes';
import { createFiberFromELment, FiberNode } from './fiber';
import { REACT_ELEMENT_TYPE } from 'shared/ReactSymbols';
import { HostText } from './workTags';
import { Placement } from './fiberFlags';

/**
 * 创建Child Reconciler（子节点协调器）
 * @param shouldTrackEffects - 是否追踪副作用，用于区分mount和update阶段
 * @returns 返回reconcilerChildFibers函数用于协调子节点
 */
export function ChildReconciler(shouldTrackEffects: boolean) {
	/**
	 * 协调单个React元素
	 * @param returnFiber - 父级Fiber节点
	 * @param currentFiber - 当前存在的Fiber节点（如果有的话）
	 * @param element - 需要协调的React元素
	 * @returns 返回新创建的Fiber节点
	 */
	function reconcilSingleELement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		// 根据React元素创建新的Fiber节点
		const fiber = createFiberFromELment(element);
		// 设置父级Fiber的引用
		fiber.return = returnFiber;
		return fiber;
	}

	/**
	 * 协调单个文本节点
	 * @param returnFiber - 父级Fiber节点
	 * @param currentFiber - 当前存在的Fiber节点（如果有的话）
	 * @param content - 文本内容（字符串或数字）
	 * @returns 返回新创建的文本类型Fiber节点
	 */
	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		// 创建文本类型的Fiber节点
		const fiber = new FiberNode(HostText, { content }, null);
		// 设置父级Fiber的引用
		fiber.return = returnFiber;
		return fiber;
	}

	/**
	 * 处理单个子节点的放置
	 * @param fiber - 需要放置的Fiber节点
	 * @returns 处理完成的Fiber节点
	 * 说明：该方法用于标记节点是否需要插入到DOM中
	 */
	function placeSingleChild(fiber: FiberNode) {
		// 如果需要追踪副作用且是首次渲染（没有alternate）
		// 则标记该节点需要插入到DOM中
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	/**
	 * 协调子Fiber的核心方法
	 * @param returnFiber - 父级Fiber节点
	 * @param currentFiber - 当前存在的Fiber节点（如果有的话）
	 * @param newChild - 新的子节点（可能是React元素、文本、数组等）
	 * @returns 返回协调后的Fiber节点
	 */
	return function reconcilerChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 处理对象类型的子节点（比如React元素）
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					// 处理React元素类型
					return placeSingleChild(
						reconcilSingleELement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未实现的reconcile类型', newChild);
					}
					break;
			}
		}

		// 处理文本节点（字符串或数字）
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		return null;
	};
}

// 创建两个协调器实例：
// reconcileChildFibers：用于update时，会追踪副作用
export const reconcileChildFibers = ChildReconciler(true);
// mountChildFibers：用于mount时，不追踪副作用
export const mountChildFibers = ChildReconciler(false);
