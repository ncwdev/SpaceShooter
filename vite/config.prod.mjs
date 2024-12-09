import { defineConfig } from 'vite';

const repoName = '/SpaceShooter/';

function replaceUrlsPlugin() {
    return {
        name: 'replace-urls',
        transform(code, id) {
            if (id.endsWith('.js')) {
                code = code.replace(/\/images\//g, repoName + 'images/');
                code = code.replace(/\/models\//g, repoName + 'models/');
                code = code.replace(/\/particles\//g, repoName + 'particles/');
                code = code.replace(/\/sounds\//g, repoName + 'sounds/');
                return {
                    code: code,
                    map: null // Inline source map is not supported
                };
            }
        }
    };
}

export default defineConfig({
    base: repoName,
    publicDir: 'assets',
    plugins: [replaceUrlsPlugin()]
});
