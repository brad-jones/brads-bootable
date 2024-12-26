FROM quay.io/fedora/fedora-bootc:41

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
