import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// All git commands run with cwd = repo root (passed in). Using execFile (not exec) avoids
// shell-injection risk since arguments are passed as an array, not interpolated into a string.
async function runGit(args, repoRoot) {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, { cwd: repoRoot });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err) {
    return { ok: false, stdout: err.stdout?.trim() || '', stderr: err.stderr?.trim() || err.message };
  }
}

export async function gitStatus(repoRoot) {
  const result = await runGit(['status', '--porcelain'], repoRoot);
  if (!result.ok) return result;
  const files = result.stdout
    .split('\n')
    .filter(Boolean)
    .map(line => ({ code: line.slice(0, 2).trim(), path: line.slice(3) }));
  return { ok: true, files };
}

export async function gitCommit(repoRoot, message) {
  const add = await runGit(['add', '-A'], repoRoot);
  if (!add.ok) return add;
  const commit = await runGit(['commit', '-m', message], repoRoot);
  return commit;
}

export async function gitPush(repoRoot) {
  return runGit(['push'], repoRoot);
}

export async function gitCommitAndPush(repoRoot, message) {
  const commitResult = await gitCommit(repoRoot, message);
  if (!commitResult.ok) {
    // "nothing to commit" is not a real failure — treat it as informational, still try push
    if (!/nothing to commit/i.test(commitResult.stdout + commitResult.stderr)) {
      return { commit: commitResult, push: null };
    }
  }
  const pushResult = await gitPush(repoRoot);
  return { commit: commitResult, push: pushResult };
}
