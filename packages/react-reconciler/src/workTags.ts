/**
 * WorkTag 是用于标识 Fiber 节点类型的联合类型。
 * 在 React 的协调过程中，这些类型用于确定如何处理和更新不同的组件。
 */
export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText;

/**
 * 函数组件
 *
 * 表示使用函数定义的 React 组件。
 * 例如：function MyComponent() { return <div>Hello</div>; }
 *
 * 在协调过程中，React 会调用这个函数来获取要渲染的元素。
 */
export const FunctionComponent = 0;

/**
 * 宿主根节点
 *
 * 表示渲染树的根节点，通常对应于 ReactDOM.render() 调用。
 * 这是整个 React 应用的起点，管理着全局状态和生命周期。
 *
 * 例如：ReactDOM.render(<App />, document.getElementById('root'));
 */
export const HostRoot = 3;

/**
 * 宿主组件
 *
 * 表示平台特定的原生元素，在 Web 环境中就是 DOM 元素。
 * 这些是 React 可以直接操作的最底层组件。
 *
 * 例如：<div>, <span>, <input> 等 HTML 标签。
 */
export const HostComponent = 5;

/**
 * 宿主文本
 *
 * 表示文本节点，即不包含在任何组件内的纯文本内容。
 * 这些节点在 DOM 中表现为 Text 节点。
 *
 * 例如：<div>Hello, world!</div> 中的 "Hello, world!" 文本。
 */
export const HostText = 6;
