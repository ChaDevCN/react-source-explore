/**
 * Type: 元素的类型
 * 可以是字符串（对于原生 DOM 元素）或函数/类（对于自定义组件）
 */
export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
/**
 * ElementType: 可以渲染的 React 元素类型
 *  包括字符串（原生DOM元素）、函数组件 或 类组件
 */
export type ElementType = any;

/**
 * ReactElementType: 描述 React 元素的接口
 * 这个结构反映了 React.createElement() 创建的对象的形状
 */
export interface ReactElementType {
	/**
	 * $$typeof: 用于标识这是一个 React 元素的符号
	 * 帮助 React 区分 ReactElements 和其他普通对象
	 */
	$$typeof: symbol | number;
	key: Key;
	ref: Ref;
	props: Props;
	type: Type;
	__mark: string;
}

export type Action<State> = State | ((prevState: State) => State);
