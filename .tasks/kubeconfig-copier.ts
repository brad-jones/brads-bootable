import { $ } from "@david/dax";
import * as yaml from "@std/yaml";
import * as path from "@std/path";
import { deepMerge } from "@std/collections";

const remoteConfig = yaml.parse(
  await $`ssh brad-jones@192.168.254.4 cat /var/lib/k0s/pki/admin.conf`.text(),
);

const server = remoteConfig.clusters[0];
server.name = "mini1";
const user = remoteConfig.users[0];
user.name = "root@mini1";

const newConfig = {
  clusters: [
    server,
  ],
  users: [
    user,
  ],
  contexts: [{
    name: "mini1",
    context: {
      cluster: server.name,
      user: user.name,
    },
  }],
};

const localConfig = yaml.parse(
  await Deno.readTextFile(path.join(Deno.env.get("HOME")!, ".kube/config")),
);

localConfig.clusters = localConfig.clusters.filter((_) =>
  _.name !== server.name
);
localConfig.users = localConfig.users.filter((_) => _.name !== user.name);
localConfig.contexts = localConfig.contexts.filter((_) => _.name !== "mini1");

const mergedConfig = deepMerge(localConfig, newConfig);

await Deno.writeTextFile(
  path.join(Deno.env.get("HOME")!, ".kube/config"),
  yaml.stringify(mergedConfig),
);
