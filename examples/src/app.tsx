import { DEFAULT_MASK_RULES, mask } from 'react-hook-mask';
import CurrencyMaskedInput from './examples/currency-masked-input';
import CustomDOMComponent from './examples/custom-dom-component';
import CustomRules from './examples/custom-rules';
import DynamicMask from './examples/dynamic-mask';
import DynamicNumberMask from './examples/dynamic-number-mask';
import Issue3 from './examples/issues/issue-3';
import Quickstart from './examples/quickstart';
import useMyMask from './examples/use-my-mask';
import './styles.css';

const customDOMMask = '???-????';
const customDOMMaskGenerator = {
	rules: DEFAULT_MASK_RULES,
	generateMask: () => customDOMMask,
};

const customHookMask = '(999) 9999-9999';
const customHookMaskGenerator = {
	rules: DEFAULT_MASK_RULES,
	generateMask: () => customHookMask,
};

const CustomHookComponent = () => {
	const { value, onChange, ref } = useMyMask({
		maskGenerator: customHookMaskGenerator,
		value: '12345678901',
	});

	return (
		<input
			value={value ?? ''}
			onChange={(e) => onChange(e?.target?.value)}
			ref={ref}
		/>
	);
};

const value = '12345678901';

export default function App() {
	return (
		<div className="app">
			<h1 className="main-title">Examples</h1>

			<div className="info-section">
				<p>
					<code>npm install react-hook-mask</code>
				</p>
				<p>
					Package:{' '}
					<a href="https://www.npmjs.com/package/react-hook-mask">
						https://www.npmjs.com/package/react-hook-mask
					</a>
				</p>
				<p>
					Repository:{' '}
					<a href="https://github.com/lucasbasquerotto/react-masked-input">
						https://github.com/lucasbasquerotto/react-masked-input
					</a>
				</p>
			</div>

			<div className="section" data-testid="quickstart">
				<h2 className="title">Quickstart</h2>

				<div className="content">
					<Quickstart />
				</div>
			</div>

			<div className="section" data-testid="custom-rules">
				<h2 className="title">Custom Rules</h2>

				<div className="content">
					<CustomRules />
				</div>
			</div>

			<div className="section" data-testid="dynamic-number-mask">
				<h2 className="title">Dynamic Number Mask</h2>

				<div className="content">
					<DynamicNumberMask />
				</div>
			</div>

			<div className="section" data-testid="dynamic-mask">
				<h2 className="title">Dynamic Mask</h2>

				<div className="content">
					<DynamicMask />
				</div>
			</div>

			<div className="section" data-testid="custom-dom-component">
				<h2 className="title">Custom DOM Component</h2>

				<div className="content">
					<CustomDOMComponent maskGenerator={customDOMMaskGenerator} />
					<div className="info">Mask: {customDOMMask}</div>
				</div>
			</div>

			<div className="section" data-testid="custom-mask-hook">
				<h2 className="title">Custom Mask Hook</h2>

				<div className="content">
					<CustomHookComponent />
					<div className="info">Mask: {customHookMask}</div>
				</div>
			</div>

			<div className="section" data-testid="currency-mask">
				<h2 className="title">Currency Mask</h2>

				<div className="content">
					<CurrencyMaskedInput />
				</div>
			</div>

			<div className="section" data-testid="masked-string">
				<h2 className="title">Masked Value as String</h2>

				<div className="content">
					<div className="info">Value: {value}</div>
					<div className="info">
						Masked: {mask(value, customHookMaskGenerator)}
					</div>
				</div>
			</div>

			<div className="section issue" data-testid="issue-3">
				<h2 className="title">Issue #3</h2>

				<div className="content">
					<Issue3 />
				</div>
			</div>
		</div>
	);
}
