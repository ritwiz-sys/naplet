const { spawn } = require('child_process');

function npmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

function run(name, script) {
  const child = spawn(npmCommand(), ['run', script], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      process.exitCode = code;
    }
  });

  child.on('error', (err) => {
    console.error(`Failed to start ${name}:`, err.message);
    process.exitCode = 1;
  });

  return child;
}

const server = run('server', 'server');
const client = run('client', 'start');

function shutdown() {
  if (server && !server.killed) server.kill();
  if (client && !client.killed) client.kill();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
