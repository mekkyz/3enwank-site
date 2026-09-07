#!/usr/bin/env bash
# One-time preparation of the box for the website service. Idempotent; run as root:
#   sudo /home/mekkyz/3enwank-site/scripts/box-setup.sh
# Creates the service user, the release directories, /etc/enwank-site/env with defaults and a fresh
# refresh token, and installs and enables the systemd unit. Deploy afterwards with scripts/deploy.sh.
set -euo pipefail
REPO=${REPO:-/home/mekkyz/3enwank-site}
[ "$(id -u)" = 0 ] || { echo "run as root (sudo)"; exit 1; }

id enwank-site >/dev/null 2>&1 || useradd --system --home-dir /srv/3enwank-site --shell /sbin/nologin enwank-site
install -d -o enwank-site -g enwank-site -m 0750 /srv/3enwank-site /srv/3enwank-site/releases
install -d -o root -g enwank-site -m 0750 /etc/enwank-site
touch /etc/enwank-site/env && chown root:enwank-site /etc/enwank-site/env && chmod 0640 /etc/enwank-site/env

add_var() { grep -q "^$1=" /etc/enwank-site/env || printf '%s=%s\n' "$1" "$2" >> /etc/enwank-site/env; }
add_var NODE_ENV production
add_var CATALOGUE_URL http://127.0.0.1:3000/api/public/catalogue
add_var STORE_URL https://my.3enwank.com
add_var SITE_URL https://3enwank.com
add_var WHATSAPP_NUMBER ""
add_var ASSISTANT_PREVIEW ""
add_var SITE_REVALIDATE_SECRET "$(openssl rand -hex 24)"

install -m 0644 "$REPO/ops/systemd/enwank-site.service" /etc/systemd/system/enwank-site.service
systemctl daemon-reload
systemctl enable enwank-site.service >/dev/null 2>&1 || true
echo "ready: edit /etc/enwank-site/env (STORE_URL, SITE_URL, WHATSAPP_NUMBER), then sudo $REPO/scripts/deploy.sh"
