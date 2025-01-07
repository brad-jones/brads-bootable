import * as k8s from "@pulumi/kubernetes";
import * as time from "@pulumiverse/time";
import { ComponentResource, ComponentResourceOptions } from "@pulumi/pulumi";

export interface HelloWorldInputs {
  nginxChart: k8s.helm.v3.Release;
}

export class HelloWorld extends ComponentResource {
  constructor(
    name: string,
    inputs: HelloWorldInputs,
    opts?: ComponentResourceOptions,
  ) {
    super("pkg:index:HelloWorld", name, inputs, opts);

    const ns = new k8s.core.v1.Namespace(`${name}-hello-world`, {
      metadata: { name: "hello-world" },
    }, { parent: this });

    new k8s.apps.v1.Deployment(`${name}-hello-world`, {
      metadata: {
        namespace: ns.metadata.name,
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: "web",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "web",
            },
          },
          spec: {
            containers: [
              {
                name: "httpd",
                image: "httpd:2.4.53-alpine",
                ports: [{ containerPort: 80 }],
              },
            ],
          },
        },
      },
    }, { parent: this });

    const service = new k8s.core.v1.Service(`${name}-hello-world`, {
      metadata: {
        namespace: ns.metadata.name,
      },
      spec: {
        type: "ClusterIP",
        selector: {
          app: "web",
        },
        ports: [
          { protocol: "TCP", port: 80 },
        ],
      },
    }, { parent: this });

    const sleep = new time.Sleep(`${name}-hello-world`, {
      createDuration: "5s",
    }, {
      dependsOn: [inputs.nginxChart],
    });

    new k8s.networking.v1.Ingress(`${name}-hello-world`, {
      metadata: {
        namespace: ns.metadata.name,
      },
      spec: {
        ingressClassName: "nginx",
        rules: [
          {
            host: "web.example.com",
            http: {
              paths: [{
                path: "/",
                pathType: "Prefix",
                backend: {
                  service: {
                    name: service.metadata.name,
                    port: { number: 80 },
                  },
                },
              }],
            },
          },
        ],
      },
    }, { parent: this, dependsOn: sleep });
  }
}
