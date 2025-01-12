import { IngressNginx } from "./apps/ingress-nginx";
import { HelloWorld } from "./apps/hello-world";
import { KubeVirt } from "./apps/kube-virt";
import { LocalStorage } from "./apps/local-storage";

new LocalStorage("brads-cluster", { version: "0.0.30" });
new KubeVirt("brads-cluster", { version: "1.4.0", cdiVersion: "1.61.0" });

const ingress = new IngressNginx("brads-cluster", {
  version: "4.12.0",
  ipAddress: "192.168.254.4",
});

new HelloWorld("brads-cluster", {
  nginxChart: ingress.nginxChart,
});
