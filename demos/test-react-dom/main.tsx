import { useState } from 'react';
import ReactDOM from 'react-dom/client';
function Child() {
	return <h1>child</h1>;
}
function APP() {
	const [num, setNum] = useState(100);
	window.setNum = setNum;
	return num === 3 ? <Child /> : <div>{num}</div>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<APP />);
