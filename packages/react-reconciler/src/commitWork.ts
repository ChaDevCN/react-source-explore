import { FiberNode } from './fiber';
import { MutationMask } from './fiberFlags';
import { NoFlags } from './fiberFlags';

// 指向在一个需要执行的Effect
let nextEffect: FiberNode | null = null;

/**
 *  提交HostComponent的side effect，也就是DOM节点的操作(增删改)
 * @param finishedWork
 */
export function commitMutationEffects(finishedWork: FiberNode) {
	nextEffect = finishedWork;

	while (nextEffect !== null) {
		// 向下便利
		const child: FiberNode | null = nextEffect.child;

		if (
			(nextEffect?.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child; // 继续遍历子节点
		} else {
			// 向上遍历
			up: while (nextEffect !== null) {
				// commitMutaitonEffectsOnFiber(nextEffect);
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return; // 指向到父节点 继续向上遍历
			}
		}
	}
}
