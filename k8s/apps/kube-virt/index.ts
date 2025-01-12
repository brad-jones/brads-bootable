import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export interface KubeVirtInputs {
  version: string;
  cdiVersion: string;
}

export class KubeVirt extends ComponentResource {
  constructor(
    name: string,
    inputs: KubeVirtInputs,
    opts?: ComponentResourceOptions,
  ) {
    super("pkg:index:KubeVirt", name, inputs, opts);

    const kubeVirtUrl = `https://github.com/kubevirt/kubevirt/releases/download/v${inputs.version}`;
    new k8s.yaml.ConfigFile("operator", {
      file: `${kubeVirtUrl}/kubevirt-operator.yaml`,
      transformations: [(o, opts) => {
        if (o.kind === "Deployment" && o.metadata.name === "virt-operator") {
          o.spec.template.spec.containers[0].env[1].valueFrom.fieldRef.apiVersion = "v1";
          opts.ignoreChanges = ["spec.template.spec.containers[*].env[*].valueFrom.fieldRef"];
        }
      }],
    }, { parent: this });
    new k8s.yaml.ConfigFile("customResource", { file: `${kubeVirtUrl}/kubevirt-cr.yaml` }, { parent: this });

    const CDIUrl = `https://github.com/kubevirt/containerized-data-importer/releases/download/v${inputs.cdiVersion}`;
    new k8s.yaml.ConfigFile("cdi-operator", {
      file: `${CDIUrl}/cdi-operator.yaml`,
      transformations: [(o, opts) => {
        if (o.kind === "CustomResourceDefinition" && o.metadata.name === "cdis.cdi.kubevirt.io") {
          o.spec.versions = o.spec.versions.filter((_: any) => _.name === "v1beta1");
          opts.ignoreChanges = ["spec.versions"];
        }
      }],
    }, { parent: this });
    new k8s.yaml.ConfigFile("cdi-customResource", { file: `${CDIUrl}/cdi-cr.yaml` }, { parent: this });

    // see: https://github.com/kubevirt/kubevirt/issues/7078#issuecomment-1022333608
    // also: https://github.com/kubevirt/containerized-data-importer/blob/main/doc/storageprofile.md
    new k8s.apiextensions.CustomResourcePatch("LocalPathProvisionerFix", {
      apiVersion: "cdi.kubevirt.io/v1beta1",
      kind: "StorageProfile",
      metadata: { name: "local-path" },
      spec: {
        claimPropertySets: [{ accessModes: ["ReadWriteOnce"], volumeMode: "Filesystem" }],
      },
    });
  }
}
