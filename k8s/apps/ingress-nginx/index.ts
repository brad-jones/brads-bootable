import * as k8s from "@pulumi/kubernetes";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export interface IngressNginxInputs {
  version: string;
  ipAddress: string;
}

export class IngressNginx extends ComponentResource {
  nginxChart: k8s.helm.v3.Release;

  constructor(
    name: string,
    inputs: IngressNginxInputs,
    opts?: ComponentResourceOptions,
  ) {
    super("pkg:index:IngressNginx", name, inputs, opts);

    const ns = new k8s.core.v1.Namespace(`${name}-nginx`, {
      metadata: { name: "ingress-nginx" },
    }, { parent: this });

    this.nginxChart = new k8s.helm.v3.Release(`${name}-nginx`, {
      chart: "ingress-nginx",
      version: inputs.version,
      repositoryOpts: {
        repo: "https://kubernetes.github.io/ingress-nginx",
      },
      namespace: ns.metadata.name,
      atomic: true,
      waitForJobs: true,
      values: {
        // see: https://stackoverflow.com/questions/56915354
        "controller": {
          "kind": "DaemonSet",
          "hostNetwork": true,
          "dnsPolicy": "ClusterFirstWithHostNet",
          "healthCheckHost": inputs.ipAddress,
          "ingressClassResource": {
            "default": true,
          },
          "service": {
            "enabled": false,
            "external": {
              "enabled": false,
            },
            "internal": {
              "enabled": false,
            },
          },
        },
      },
    }, { parent: this });
  }
}
