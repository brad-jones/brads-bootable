import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { setOutput } from "./shared.ts";
dayjs.extend(utc);

const dateString = dayjs.utc().format("YYYYMMDD");
const nextCommitSha = Deno.env.get("GITHUB_SHA")!.substring(0, 8);
const fedoraVersion = (await Deno.readTextFile("src/Dockerfile")).split("\n")[0]
  .split(":")[1].trim();
const nextTag = `${fedoraVersion}-${dateString}-${nextCommitSha}`;
console.log(`Next Tag: ${nextTag}`);
await setOutput(`value=${nextTag}`);
