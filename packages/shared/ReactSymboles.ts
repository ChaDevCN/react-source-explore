// 为了防止滥用reactElement，将reactElment定义为一个独一无二的值

// 判断当前环境有没有symbol
const supportSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;
