import { FiberNode } from './fiber';

/**
 * 执行function component 返回真实的节点
 * @param wip 工作节点
 */
export function renderWithHooks(wip: FiberNode) {
	const Component = wip.type;
	const props = wip.pendingProps;
	const child = Component(props);
	return child;
}
