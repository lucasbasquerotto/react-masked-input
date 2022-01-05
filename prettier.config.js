module.exports = {
	semi: true,
	singleQuote: true,
	useTabs: true,
	bracketSpacing: true,
	trailingComma: 'all',
	overrides: [
		{
			files: '*.md',
			options: {
				useTabs: false,
				tabWidth: 4,
			},
		},
	],
};
