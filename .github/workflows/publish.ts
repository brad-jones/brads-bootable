import { outdent } from "@cspotcode/outdent";
import $ from "@david/dax";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { buildDiff, getLatestCommitSha, getSbom, IMAGE } from "./shared.ts";
dayjs.extend(utc);

const BOOTABLE_ISO = `ghcr.io/brad-jones/brads-bootable/iso`;

const dateString = dayjs.utc().format("YYYYMMDD");
const latestCommitSha = await getLatestCommitSha();
const nextCommitSha = Deno.env.get("GITHUB_SHA")!.substring(0, 8);
const fedoraVersion = (await Deno.readTextFile("src/Dockerfile")).split("\n")[0]
  .split(":")[1].trim();
const releaseTitle =
  `Fedora ${fedoraVersion} - ${dateString} (sha: ${nextCommitSha})`;
const releaseTag = `${fedoraVersion}-${dateString}-${nextCommitSha}`;

const latestSbom = await getSbom(`${IMAGE}:latest`);
const nextSbom = await getSbom(`${IMAGE}:next`);
if (!nextSbom) {
  $.logError(`next image does not have an sbom`);
  Deno.exit(1);
}

let releaseNotes = "";
if (!latestCommitSha || !latestSbom) {
  releaseNotes = outdent`
    ## Bare Metal Iso

    Download with [ORAS](https://oras.land)

    \`\`\`
    oras pull ${BOOTABLE_ISO}:${releaseTag}
    \`\`\`

    ## Packages

    ### Initial
    ${nextSbom.map(({ name, version }) => `- ${name}: ${version}`).join("\n")}
  `;
} else {
  const sbomDiff = buildDiff(nextSbom, latestSbom);
  releaseNotes = outdent`
    **Build Changes:** ${
    latestCommitSha !== nextCommitSha
      ? `https://github.com/${Deno.env.get(
        "GITHUB_REPOSITORY",
      )!}/compare/${latestCommitSha}...${nextCommitSha}`
      : "n/a"
  }

    ## Bare Metal Iso

    Download with [ORAS](https://oras.land)

    \`\`\`
    oras pull ${BOOTABLE_ISO}:${releaseTag}
    \`\`\`

    ## Packages
    ${
    sbomDiff.added.length === 0 && sbomDiff.updated.length === 0 &&
      sbomDiff.deleted.length === 0
      ? "No changes to installed packages."
      : ""
  }
    ${
    sbomDiff.added.length > 0
      ? `### Added\n${
        sbomDiff.added.map(({ name, version }) => `- ${name}: ${version}`).join(
          "\n",
        )
      }`
      : ""
  }
    ${
    sbomDiff.updated.length > 0
      ? `### Updated\n${
        sbomDiff.updated.map(({ name, oldV, newV }) =>
          `- ${name}: ${oldV} => ${newV}`
        ).join("\n")
      }`
      : ""
  }
    ${
    sbomDiff.deleted.length > 0
      ? `### Deleted\n${
        sbomDiff.deleted.map(({ name, version }) => `- ${name}: ${version}`)
          .join("\n")
      }`
      : ""
  }
  `;
}

const releaseNotesFile = "./output/notes.md";
await Deno.writeTextFile(releaseNotesFile, releaseNotes);

const isoFileName = `fedora-${releaseTag}.iso`;
const isoFile = `./output/bootiso/${isoFileName}`;
await Deno.rename("./output/bootiso/install.iso", isoFile);
await $`oras push ${`${BOOTABLE_ISO}:latest,${releaseTag}`} ${isoFile}`;

await $`docker buildx imagetools create --tag ${`${IMAGE}:latest`} ${`${IMAGE}:next`}`;
await $`docker buildx imagetools create --tag ${`${IMAGE}:${releaseTag}`} ${`${IMAGE}:next`}`;

await $`gh release create ${releaseTag} --title ${releaseTitle} -F ${releaseNotesFile}`;
