import { spawn } from 'node:child_process';
// Usa o fallback Sass JavaScript suportado pelo Angular no Windows e na CI.
const processoAngular = spawn(
  process.execPath,
  ['node_modules/@angular/cli/bin/ng.js', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: { ...process.env, NG_BUILD_SASS_EMBEDDED: 'false' },
  },
);
processoAngular.on('error', (erro) => {
  console.error(erro.message);
  process.exitCode = 1;
});
processoAngular.on('exit', (codigo) => {
  process.exitCode = codigo ?? 1;
});
