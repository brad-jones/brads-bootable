import $ from "@david/dax";
import { outdent } from "@cspotcode/outdent";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { buildDiff, getLatestCommitSha, getSbom, IMAGE } from "./shared.ts";
dayjs.extend(utc);

const dateString = dayjs.utc().format("YYYYMMDD");
const nextSbom = await getSbom(`${IMAGE}:next`);
const latestSbom = await getSbom(`${IMAGE}:latest`);
const sbomDiff = buildDiff(nextSbom, latestSbom);
const latestCommitSha = await getLatestCommitSha();
const nextCommitSha = Deno.env.get("GITHUB_SHA")!.substring(0, 8);
const fedoraVersion = (await Deno.readTextFile("Dockerfile")).split("\n")[0].split(":")[1].trim();
const releaseTitle = `Fedora ${fedoraVersion} - ${dateString} (sha: ${nextCommitSha})`;
const releaseTag = `${fedoraVersion}-${dateString}-${nextCommitSha}`;

let releaseNotes = "";
if (!latestCommitSha) {
  releaseNotes = outdent`
    ## Packages

    ### Initial
    ${nextSbom.map(({ name, version }) => `- ${name}: ${version}`).join("\n")}
  `;
} else {
  releaseNotes = outdent`
    **Build Changes:** ${latestCommitSha !== nextCommitSha ? `https://github.com/${Deno.env.get("GITHUB_REPOSITORY")!}/compare/${latestCommitSha}...${nextCommitSha}` : "n/a"}
    
    ## Packages
    ${sbomDiff.added.length === 0 && sbomDiff.updated.length === 0 && sbomDiff.deleted.length === 0 ? "No changes to installed packages." : ""}
    ${sbomDiff.added.length > 0 ? `### Added\n${sbomDiff.added.map(({ name, version }) => `- ${name}: ${version}`).join("\n")}` : ""}
    ${sbomDiff.updated.length > 0 ? `### Updated\n${sbomDiff.updated.map(({ name, oldV, newV }) => `- ${name}: ${oldV} => ${newV}`).join("\n")}` : ""}
    ${sbomDiff.deleted.length > 0 ? `### Deleted\n${sbomDiff.deleted.map(({ name, version }) => `- ${name}: ${version}`).join("\n")}`: ""}
  `;
}

const releaseNotesFile = "./dist/notes.md";
await Deno.writeTextFile(releaseNotesFile, releaseNotes);

await $`mv ./output/bootiso/install.iso ./output/bootiso/fedora-${releaseTag}.iso`;
await $`gh release create ${releaseTag} --title ${releaseTitle} -F ${releaseNotesFile} ${`./output/bootiso/fedora-${releaseTag}.iso`}`;

await $`docker buildx imagetools create --append --tag latest next`;
await $`docker buildx imagetools create --tag ${releaseTag} next`;
