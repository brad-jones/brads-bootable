// kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.30/deploy/local-path-storage.yaml

import * as k8s from "@pulumi/kubernetes";
import { local } from "@pulumi/command";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export interface LocalStorageInputs {
  version: string;
}

export class LocalStorage extends ComponentResource {
  constructor(
    name: string,
    inputs: LocalStorageInputs,
    opts?: ComponentResourceOptions,
  ) {
    super("pkg:index:LocalStorage", name, inputs, opts);

    const ns = new k8s.core.v1.Namespace("LocalStorage", {
      metadata: { name: "local-path-storage" },
    }, { parent: this });

    const downloadUrl = `https://github.com/rancher/local-path-provisioner/archive/refs/tags/v${inputs.version}.tar.gz`;

    const download = new local.Command("LocalStorage", {
      dir: __dirname,
      create: `curl -sSL ${downloadUrl} | tar -xzf -`,
      update: `rm -rf ./local-path-provisioner-* && curl -sSL ${downloadUrl} | tar -xzf -`,
      delete: "rm -rf ./local-path-provisioner-*",
    }, { parent: this });

    new k8s.helm.v4.Chart("local-storage", {
      chart: `${__dirname}/local-path-provisioner-${inputs.version}/deploy/chart/local-path-provisioner`,
      namespace: ns.metadata.name,
      values: {
        storageClass: {
          defaultClass: true,
          defaultVolumeType: "local",
        },
      },
    }, { parent: this, dependsOn: download });
  }
}
