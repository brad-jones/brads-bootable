import $ from "@david/dax";
import { getLatestCommitSha, setOutput, getSbom, IMAGE } from "./shared.ts";

const latestCommitSha = await getLatestCommitSha();
if (!latestCommitSha) {
  $.log("should publish: no prior release");
  await setOutput(`value=true`);
  Deno.exit(0);
}

const nextCommitSha = Deno.env.get("GITHUB_SHA");
if (latestCommitSha !== nextCommitSha) {
  $.log("should publish: new commit");
  await setOutput(`value=true`);
  Deno.exit(0);
}

const latestSbom = await getSbom(`${IMAGE}:latest`);
const nextSbom = await getSbom(`${IMAGE}:next`);
const diff = {
  added: nextSbom.filter((next) =>
    latestSbom.find((latest) => latest.name === next.name) === undefined
  ),
  updated: nextSbom
    .filter((next) =>
      latestSbom.find((latest) =>
        latest.name === next.name && latest.version !== next.version
      )
    )
    .map((next) => ({
      name: next.name,
      newV: next.version,
      oldV: latestSbom.find((latest) => latest.name === next.name)?.version,
    })),
  deleted: latestSbom.filter((latest) =>
    nextSbom.find((next) => next.name === latest.name) === undefined
  ),
};

if (
  diff.added.length === 0 && diff.updated.length === 0 &&
  diff.deleted.length === 0
) {
  $.log(`should NOT publish: no difference in installed packages`);
  await setOutput(`value=false`);
  Deno.exit(0);
}

$.log("should publish: found differences in installed packages");
await setOutput(`value=true`);
Deno.exit(0);
