export interface MaskGenerator {
	rules: Map<string, RegExp>;
	generateMask: (value: string) => string;
	transform?: (value: string) => string;
	keepMask?: boolean;
}
