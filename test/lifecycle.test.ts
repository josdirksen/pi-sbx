import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
	findEnvironmentFile,
	leftoverSandboxNames,
	sandboxNameFor,
	sessionToken,
} from "../extensions/pi-sbx/lifecycle.ts";

test("builds a sandbox name from the project directory and the session token", () => {
	assert.equal(sandboxNameFor("/Users/jos/dev/git/work/dhl/dfm-fleet-service", "ab12cd34"), "pi-dfm-fleet-service-ab12cd34");
	assert.equal(sandboxNameFor("/tmp/My Project!", "9f8e"), "pi-my-project-9f8e");
});

test("derives a short session token and falls back to the process id", () => {
	assert.equal(sessionToken("4f2a-9c11-bb03-77de"), "bb0377de");
	assert.equal(sessionToken(undefined), String(process.pid));
	assert.equal(sessionToken("!!!"), String(process.pid));
});

test("finds the nearest sbxenv.yaml above the working directory", () => {
	const root = path.join(tmpdir(), `pi-sbx-lifecycle-${process.pid}`);
	const nested = path.join(root, "src", "main");
	mkdirSync(nested, { recursive: true });
	assert.equal(findEnvironmentFile(nested), undefined);
	writeFileSync(path.join(root, "sbxenv.yaml"), "schemaVersion: \"1\"\nagent: shell\n");
	assert.equal(findEnvironmentFile(nested), path.join(root, "sbxenv.yaml"));
	assert.equal(findEnvironmentFile(path.join(root, "missing-dir")), path.join(root, "sbxenv.yaml"));
});

test("lists only running sandboxes created by this extension, excluding the session's own", () => {
	const leftovers = leftoverSandboxNames(
		[
			{ name: "pi-repo-a1b2", status: "running" },
			{ name: "pi-repo-c3d4", status: "running" },
			{ name: "pi-repo-mine", status: "running" },
			{ name: "pi-repo-stopped", status: "stopped" },
			{ name: "shell-abcd", status: "running" },
		],
		"pi-repo-mine",
	);
	assert.deepEqual(leftovers, ["pi-repo-a1b2", "pi-repo-c3d4"]);
});
