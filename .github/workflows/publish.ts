import $ from "@david/dax";
import { outdent } from "@cspotcode/outdent";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { getSbom, IMAGE } from "./shared.ts";
dayjs.extend(utc);

const dateString = dayjs.utc().format("YYYYMMDD");
const nextSbom = await getSbom(`${IMAGE}:next`);
const nextCommitSha = Deno.env.get("GITHUB_SHA")!.substring(0, 8);
const fedoraVersion = (await Deno.readTextFile("Dockerfile")).split("\n")[0].split(":")[1].trim();
const releaseTitle = `Fedora ${fedoraVersion} - ${dateString} (sha: ${nextCommitSha})`;
const releaseTag = `${fedoraVersion}-${dateString}-${nextCommitSha}`;

const releaseNotesFile = "./dist/notes.md";
await Deno.writeTextFile(releaseNotesFile, outdent`
    ## Packages

    ### Initial
    ${nextSbom.map(({ name, version }) => `- ${name}: ${version}`).join("\n")}
`);

await $`mv ./output/bootiso/install.iso ./output/bootiso/fedora-${releaseTag}.iso`;
await $`gh release create ${releaseTag}
    --title ${releaseTitle}
    -F ${releaseNotesFile}
    ${`./output/bootiso/fedora-${releaseTag}.iso`}
`;

await $`docker buildx imagetools create --append --tag latest next`;
await $`docker buildx imagetools create --tag ${releaseTag} next`;