// .kiro/scripts/secret-scan.mjs
// PreToolUse guard for PGMate (design §18.2). Blocks writes that appear to
// embed secrets. Reads the PreToolUse JSON from stdin, inspects the new file
// content, and exits 2 (blocking; stderr shown to the agent) when a secret
// pattern is found. Exits 0 otherwise. Any parse/IO failure defaults to allow
// so it never blocks legitimate work by accident.

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => resolve(data), 3000);
    if (typeof timer.unref === 'function') timer.unref();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });
    process.stdin.on('error', () => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// Conservative patterns; tuned to limit false positives.
const PATTERNS = [
  { name: 'AWS access key id', re: /AKIA[0-9A-Z]{16}/ },
  {
    name: 'PEM private key',
    re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/,
  },
  {
    name: 'JWT-like token',
    re: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/,
  },
  {
    name: 'secret in assignment',
    re: /\b(secret_access_key|aws_secret_access_key|private_key|client_secret|db_password|password|api[_-]?key|access[_-]?token)\b\s*[:=]\s*["'][^\s"']{12,}["']/i,
  },
];

function collectContent(toolInput) {
  if (!toolInput || typeof toolInput !== 'object') return '';
  const fields = ['content', 'newStr', 'text', 'oldStr', 'path'];
  return fields
    .map((f) => (typeof toolInput[f] === 'string' ? toolInput[f] : ''))
    .join('\n');
}

const main = async () => {
  const raw = await readStdin();
  if (!raw || raw.trim() === '') process.exit(0);

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    process.exit(0); // not JSON we understand -> allow
  }

  const toolInput =
    event && (event.tool_input ?? event.toolInput ?? event.input ?? {});
  const path =
    toolInput && typeof toolInput.path === 'string' ? toolInput.path : '';

  // Don't scan our own script (avoids self-reference false positives).
  if (path && path.includes('secret-scan.mjs')) process.exit(0);

  const content = collectContent(toolInput);
  if (!content) process.exit(0);

  for (const { name, re } of PATTERNS) {
    const m = content.match(re);
    if (m) {
      const snippet = String(m[0]).slice(0, 20);
      process.stderr.write(
        '[secret-scan] Blocked: potential secret detected (' +
          name +
          '). Remove it before writing. Use AWS Secrets Manager / SSM Parameter ' +
          'Store for real secrets. Match starts with: ' +
          snippet +
          '\n'
      );
      process.exit(2);
    }
  }

  process.exit(0);
};

main();
