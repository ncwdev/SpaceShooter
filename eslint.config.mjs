import globals from 'globals';
import pluginJs from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';

export default [
    {files: ['**/*.{js,mjs,cjs,vue}']},
    {languageOptions: { globals: globals.browser }},
    pluginJs.configs.recommended,
    ...pluginVue.configs['flat/essential'],
    {
        rules: {
            semi: 'error',
            quotes: ['error', 'single'],
            'prefer-const': 'error',
            'eol-last': 'error',
            'no-multiple-empty-lines': ['error', {'max': 1}],
            'brace-style': ['error', '1tbs'],
            'indent': ['error', 4, {'SwitchCase': 1}],
            'no-trailing-spaces': 'error',
            'padded-blocks': ['error', { 'classes': 'never' }],
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                BABYLON: 'readonly',
                HavokPhysics: 'readonly',
                getLocText: 'readonly',
            }
        }
    },
];
