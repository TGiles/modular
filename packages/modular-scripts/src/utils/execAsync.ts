import execa from 'execa';

type Options = Omit<execa.Options, 'cleanup' | 'stderr' | 'stdout' | 'stdin'>;

export default function execSync(
  file: string,
  args: string[],
  options: Options,
): Promise<execa.ExecaReturnValue<string>> {
  return execa(file, args, {
    stdin: process.stdin,
    stderr: process.stderr,
    stdout: process.stdout,
    cleanup: true,
    ...options,
  });
}
