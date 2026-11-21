import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { nativeHash } from './scripts/native-hash.mjs';

const release = JSON.parse(readFileSync('./release.json', 'utf8'));
const buildDate = new Date().toISOString().slice(0, 10);
const NATIVE_HASH = nativeHash('.');
// ملاحظات كل نسخة لوحدها: التطبيق بيعرض بس ملاحظات النسخ اللي أحدث من اللي عنده
const history = (() => { const h = [...(release.history || [])]; if (!h.some((x) => x.v === release.version)) h.unshift({ v: release.version, notes: release.notes || [] }); return h.slice(0, 30); })();

// يكتب version.json وعامل الخدمة (sw.js) بقائمة كل ملفات البناء ليعمل التطبيق بدون إنترنت
function pwa() {
  return {
    name: 'alrafiq-pwa',
    apply: 'build',
    closeBundle() {
      const dist = 'dist';
      const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
      const files = walk(dist).map((p) => './' + relative(dist, p).split('\\').join('/')).filter((f) => !/\/(sw\.js|version\.json)$/.test(f) && !f.endsWith('.map') && !/\.woff$/.test(f) && !f.includes('/audio/stories/') && !f.includes('/tafsir/'));
      writeFileSync(join(dist, 'version.json'), JSON.stringify({ version: release.version, date: buildDate, notes: release.notes, history, native: NATIVE_HASH, manifest: 'update-manifest.json' }, null, 2));
      const sw = readFileSync('./src/sw.template.js', 'utf8').replace('__VERSION__', release.version).replace('__FILES__', JSON.stringify(['./', ...files]));
      writeFileSync(join(dist, 'sw.js'), sw);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), pwa()],
  define: { __APP_VERSION__: JSON.stringify(release.version), __BUILD_DATE__: JSON.stringify(buildDate), __NATIVE_HASH__: JSON.stringify(NATIVE_HASH) },
  build: { target: 'es2019', chunkSizeWarningLimit: 900, assetsInlineLimit: 0 },
});
