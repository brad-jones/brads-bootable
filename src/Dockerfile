ARG FEDORA_VERSION="41"
ARG HANSEL_VERSION="0.0.14"
FROM ghcr.io/shopify/hansel:$HANSEL_VERSION AS hansel
FROM quay.io/fedora/fedora-bootc:$FEDORA_VERSION

# TODO: https://docs.fedoraproject.org/en-US/bootc/os-release-and-versions/

# Force dnf to download from the primary fedora mirror
# To avoid this issue: https://github.com/osbuild/bootc-image-builder/pull/766
RUN rm -f /etc/yum.repos.d/fedora-cisco-openh264.repo
RUN FILES=(/etc/yum.repos.d/fedora*.repo); sed --in-place \
    -e 's ^metalink= #metalink= ' \
    -e "s ^#baseurl=http://download.example/ baseurl=https://dl.fedoraproject.org/ " \
    "${FILES[@]}";

# Stop dnf from installing shit we don't need
RUN echo "install_weak_deps=false" >> /etc/dnf/dnf.conf

# Update & install some extras
RUN dnf update -y \
  && dnf install -y \
    tree \
  && dnf clean all

# Stop blasting the console (the bare metal one) with logs from the kernel.
# see: https://superuser.com/questions/351387
# also: https://github.com/coreos/fedora-coreos-tracker/issues/1244
COPY ./etc/sysctl.d/01-printk.conf /etc/sysctl.d/01-printk.conf

# Allow users added to the "wheel" group to sudo without a password
COPY ./etc/sudoers.d/wheel /etc/sudoers.d/wheel

# As cool as having my system automatically update & reboot,
# I think I'd like to leave the rebooting up to me to do manually.
# Especially given that this is a single node system for now.
COPY ./etc/systemd/system/bootc-fetch-apply-updates.service.d/override.conf /etc/systemd/system/bootc-fetch-apply-updates.service.d/override.conf

# Install K0s
# see: https://k0sproject.io
ARG K0S_VERSION="1.31.3"
ARG K0S_FILENAME="v${K0S_VERSION}+k0s.0"
ARG K0S_BASE_URL="https://github.com/k0sproject/k0s/releases/download"
RUN curl -SLf "${K0S_BASE_URL}/${K0S_FILENAME}/k0s-${K0S_FILENAME}-amd64" -o /usr/local/bin/k0s
RUN chmod +x /usr/local/bin/k0s
COPY ./etc/k0s/k0s.yaml /etc/k0s/k0s.yaml
RUN k0s config validate --config /etc/k0s/k0s.yaml
COPY ./etc/systemd/system/k0scontroller.service /etc/systemd/system/k0scontroller.service
RUN useradd --home /var/lib/k0s --shell /usr/sbin/nologin --system --no-create-home konnectivity-server
RUN useradd --home /var/lib/k0s --shell /usr/sbin/nologin --system --no-create-home kube-apiserver
RUN useradd --home /var/lib/k0s --shell /usr/sbin/nologin --system --no-create-home kube-scheduler
RUN echo 'export KUBECONFIG="/var/lib/k0s/pki/admin.conf"' > /etc/profile.d/kubeconfig.sh
RUN echo 'kubectl() { k0s kubectl "$@"; }' > /etc/profile.d/kubectl.sh
RUN k0s completion bash > /etc/bash_completion.d/k0s.sh

# kube-router wants to write stuff to /opt/cni
RUN rm -rf /opt && mkdir -p /var/opt && ln -s var/opt /opt

# Install K9s (a K8s TUI)
# see: https://k9scli.io/
ARG K9S_VERSION="0.32.7"
RUN rpm -ivh "https://github.com/derailed/k9s/releases/download/v${K9S_VERSION}/k9s_linux_amd64.rpm"

# Add some hints for sbom generation
# see: https://github.com/Shopify/hansel
COPY --from=hansel /usr/bin/hansel /usr/bin/hansel
RUN hansel --name k0s --version "$(k0s version | grep -Po '\d+\.\d+\.\d+')" --install
RUN rm /usr/bin/hansel
