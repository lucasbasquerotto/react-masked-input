import { DEFAULT_MASK_RULES } from '../../lib/esm';
import CustomDOMComponent from './examples/custom-dom-component';
import CustomRules from './examples/custom-rules';
import DynamicMask from './examples/dynamic-mask';
import Quickstart from './examples/quickstart';
import useMyMask from './examples/use-my-mask';
import './styles.css';

const customDOMMaskGenerator = {
	rules: DEFAULT_MASK_RULES,
	generateMask: () => '???-????',
};

const customHookMaskGenerator = {
	rules: DEFAULT_MASK_RULES,
	generateMask: () => '???-????',
};

const CustomHookComponent = () => {
	const { value, onChange, ref } = useMyMask({
		maskGenerator: customHookMaskGenerator,
	});

	return (
		<input
			value={value}
			onChange={(e) => onChange(e?.target?.value)}
			ref={ref}
		/>
	);
};

export default function App() {
	return (
		<div className="App">
			<h1>Examples</h1>

			<hr />

			<h2>Quickstart</h2>
			<Quickstart />

			<hr />

			<h2>Custom Rules</h2>
			<CustomRules />

			<hr />

			<h2>Dynamic Mask</h2>
			<DynamicMask />

			<hr />

			<h2>Custom DOM Component</h2>
			<CustomDOMComponent maskGenerator={customDOMMaskGenerator} />

			<hr />

			<h2>Custom Mask Hook</h2>
			<CustomHookComponent />
		</div>
	);
}
