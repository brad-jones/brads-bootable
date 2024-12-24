FROM quay.io/fedora/fedora-bootc:41

# Force dnf to download from the primary fedora mirror
# To avoid this issue: https://github.com/osbuild/bootc-image-builder/pull/766
RUN FILES=(/etc/yum.repos.d/fedora*.repo) \
    sed --in-place \
    -e 's ^metalink= #metalink= ' \
    -e "s ^#baseurl=http://download.example/ baseurl=https://dl.fedoraproject.org/ " \
    "${FILES[@]}" \
    && dnf clean all

# Stop dnf from installing shit we don't need
RUN echo "install_weak_deps=false" >> /etc/dnf/dnf.conf

# Remove some stuff from the massive bootc image we know for sure that we don't need
RUN dnf remove -y nano
