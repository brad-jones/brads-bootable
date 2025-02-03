import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export interface MultusInputs {
  version: string;
}

export class Multus extends ComponentResource {
  constructor(
    name: string,
    inputs: MultusInputs,
    opts?: ComponentResourceOptions,
  ) {
    super("pkg:index:Multus", name, inputs, opts);

    new k8s.yaml.ConfigFile("multus-daemonset-thick", {
      file:
        `https://raw.githubusercontent.com/k8snetworkplumbingwg/multus-cni/refs/tags/v${inputs.version}/deployments/multus-daemonset-thick.yml`,
      transformations: [
        // see: https://github.com/k8snetworkplumbingwg/multus-cni/issues/1221
        (manifest) => {
          if (manifest["kind"] === "DaemonSet") {
            const container = manifest.spec.template.spec.initContainers
              .find((_: any) => _.name === "install-multus-binary");

            if (container) {
              container.command = [
                "cp",
                "-f",
                "/usr/src/multus-cni/bin/multus-shim",
                "/host/opt/cni/bin/multus-shim",
              ];
            }
          }
        },
      ],
    }, { parent: this });
  }
}

// enp87s0 (Unused 2.5GB)
// enp88s0 (main node nic, 192.168.254.4)
// enp2s0f0np0 (Unused 10GB)
// enp2s0f1np1 (Unused 10GB)
