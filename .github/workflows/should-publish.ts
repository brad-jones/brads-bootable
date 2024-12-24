import $ from "@david/dax";
import { getLatestCommitSha, setOutput, getSbom, IMAGE, buildDiff } from "./shared.ts";

const latestSbom = await getSbom(`${IMAGE}:latest`);
const nextSbom = await getSbom(`${IMAGE}:next`);
if (!nextSbom) {
  $.logError(`next image does not have an sbom`);
  Deno.exit(1);
}

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


if (!latestSbom) {
  $.log("should publish: latest image does not contain an sbom");
  await setOutput(`value=true`);
  Deno.exit(0);
}

const diff = buildDiff(nextSbom, latestSbom);

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
