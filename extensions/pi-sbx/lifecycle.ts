import { existsSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

/** Prefix for sandboxes this extension creates. Used to find abandoned ones. */
export const SANDBOX_NAME_PREFIX = "pi-";

function nameSegment(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Sandbox name for one pi session: pi-<project>-<token>. */
export function sandboxNameFor(projectDir: string, token: string): string {
	const project = nameSegment(basename(resolve(projectDir))) || "workspace";
	const suffix = nameSegment(token) || String(process.pid);
	return `${SANDBOX_NAME_PREFIX}${project}-${suffix}`;
}

/** Short, stable token for a session id. Falls back to the pi process id. */
export function sessionToken(sessionId: string | undefined): string {
	const compact = (sessionId ?? "").replace(/[^a-zA-Z0-9]/g, "");
	return compact.slice(-8) || String(process.pid);
}

/**
 * Nearest sbxenv.yaml at or above `dir`.
 * `sbx env` resolves a directory to <directory>/sbxenv.yaml, and mounts the
 * file read-only, so the file has to sit at the root of a mounted workspace.
 */
export function findEnvironmentFile(dir: string): string | undefined {
	let current = resolve(dir);
	for (;;) {
		const candidate = join(current, "sbxenv.yaml");
		if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
		const parent = dirname(current);
		if (parent === current) return undefined;
		current = parent;
	}
}

/** Names of this extension's running sandboxes, excluding `keep`. */
export function leftoverSandboxNames(sandboxes: { name: string; status?: string }[], keep?: string): string[] {
	return sandboxes
		.filter(
			(sandbox) =>
				sandbox.name.startsWith(SANDBOX_NAME_PREFIX) && sandbox.status === "running" && sandbox.name !== keep,
		)
		.map((sandbox) => sandbox.name)
		.sort();
}
