import $ from "@david/dax";
import { z } from "zod";

export const IMAGE = "ghcr.io/brad-jones/brads-bootable";

const sbomSchema = z.object({
  packages: z.array(z.object({
    name: z.string(),
    versionInfo: z.string().optional(),
  })),
});

export type Sbom = { name: string; version: string; }[];

export const getSbom = async (img: string) => {
  const r = await $`docker buildx imagetools inspect ${img} --format "{{ json .SBOM.SPDX }}"`.json();

  if (img.endsWith("next")) {
    await Deno.writeTextFile("./sbom-next.json", JSON.stringify(r));
  } else {
    await Deno.writeTextFile("./sbom-latest.json", JSON.stringify(r));
  } 

  try {
    return filterPackages(sbomSchema.parse(r));
  } catch (e) {
    console.log(e);
    return undefined;
  }
};

const filterPackages = (sbom: z.infer<typeof sbomSchema>) =>
  Object.entries(
    sbom.predicate.packages
      .filter((_) => typeof _.versionInfo === "string")
      .map((_) => ({ name: _.name, version: _.versionInfo! }))
      .reduce((prev, cur) => {
        if (prev[cur.name]) {
          prev[cur.name] = `${prev[cur.name]},${cur.version}`;
        } else {
          prev[cur.name] = cur.version;
        }
        return prev;
      }, {} as Record<string, string>),
  ).map((_) => ({ name: _[0], version: _[1] }));

export const buildDiff = (nextSbom: Sbom, latestSbom: Sbom) => ({
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
});

export const getLatestCommitSha = async () => {
  const result = await $`gh release view --json tagName,assets`.noThrow()
    .captureCombined();
  if (result.code !== 0) {
    if (result.combined.includes("release not found")) return false;
    throw new Error(`failed to get gh release: ${result.combined}`);
  }

  const release = z.object({
    tagName: z.string(),
    assets: z.array(z.object({ url: z.string().url() })),
  }).parse(JSON.parse(result.combined));
  return z.object({ object: z.object({ sha: z.string() }) }).parse(
    await $`gh api ${`repos/${Deno.env.get(
      "GITHUB_REPOSITORY",
    )!}/git/ref/tags/${release.tagName}`}`.json(),
  ).object.sha;
};

export const setOutput = (value: string) =>
  Deno.writeTextFile(Deno.env.get("GITHUB_OUTPUT")!, value, { append: true });
