import { IngressNginx } from "./apps/ingress-nginx";
import { HelloWorld } from "./apps/hello-world";

const ingress = new IngressNginx("brads-cluster", {
  version: "4.12.0",
  ipAddress: "192.168.254.4",
});

new HelloWorld("brads-cluster", {
  nginxChart: ingress.nginxChart,
});
