apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: argocd
resources:
  - ./namespace.yaml
  - https://raw.githubusercontent.com/argoproj/argo-cd/v${ARGO_VERSION}/manifests/install.yaml
