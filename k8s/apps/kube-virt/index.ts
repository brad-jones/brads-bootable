import * as k8s from "@pulumi/kubernetes";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export interface KubeVirtInputs {
  version: string;
}

export class KubeVirt extends ComponentResource {
  constructor(
    name: string,
    inputs: KubeVirtInputs,
    opts?: ComponentResourceOptions,
  ) {
    super("pkg:index:KubeVirt", name, inputs, opts);
    const baseUrl = `https://github.com/kubevirt/kubevirt/releases/download/v${inputs.version}`;
    new k8s.yaml.ConfigFile("operator", { file: `${baseUrl}/kubevirt-operator.yaml` });
    new k8s.yaml.ConfigFile("customResource", { file: `${baseUrl}/kubevirt-cr.yaml` });
  }
}
