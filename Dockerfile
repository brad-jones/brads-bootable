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
RUN dnf remove -y nano

# Then update what we have left over
RUN dnf update -y && dnf clean all
