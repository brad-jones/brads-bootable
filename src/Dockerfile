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

# Remove some stuff from the massive bootc image we know for sure that we don't need
RUN dnf remove -y \
  abattis-cantarell-fonts \
  adcli \
  adobe-source-code-pro-fonts \
  amd-gpu-firmware \
  amd-ucode-firmware \
  atheros-firmware \
  avahi \
  avahi-libs \
  bluez \
  brcmfmac-firmware \
  btrfs-progs \
  cirrus-audio-firmware \
  duktape \
  flatpak-session-helper \
  fonts-filesystem \
  intel-audio-firmware \
  jq \
  nano \
  ntfs-3g \
  ntfs-3g-libs \
  ntfs-3g-system-compression \
  ntfsprogs \
  nvidia-gpu-firmware \
  nxpwireless-firmware \
  podman \
  python3-boto3 \
  python3-botocore \
  realtek-firmware \
  samba-client-libs \
  samba-common \
  samba-common-libs \
  WALinuxAgent-udev \
  xfsprogs \
  xkeyboard-config

# Then update what we have left over
RUN dnf update -y && dnf clean all

# Stop blasting the console (the bare metal one) with logs from the kernel.
# see: https://superuser.com/questions/351387
# also: https://github.com/coreos/fedora-coreos-tracker/issues/1244
COPY ./etc/sysctl.d/01-printk.conf /etc/sysctl.d/01-printk.conf

# Allow users added to the "wheel" group to sudo without a password
COPY ./etc/sudoers.d/wheel /etc/sudoers.d/wheel
