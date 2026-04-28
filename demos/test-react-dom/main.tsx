import { useState } from 'react';
import ReactDOM from 'react-dom/client';
function APP() {
	const [num, pdateNum] = useState(100);

	return (
		<div>
			<span>{num}</span>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById('root')!).render(<APP />);
