#!/usr/bin/env bash
# Deploy the website from this checkout to /srv/3enwank-site (run as root):
#   sudo /home/mekkyz/3enwank-site/scripts/deploy.sh [git-ref]
# Same shape as the platform's deploy: a release directory from `git archive`, dependencies and
# build as the service user with /etc/enwank-site/env loaded, an atomic switch of `current`, a
# restart, a health check, and a rollback to the previous release if the health check fails.
set -euo pipefail
REPO=${REPO:-/home/mekkyz/3enwank-site}
REF=${1:-HEAD}
BASE=/srv/3enwank-site
STAMP=$(date -u +%Y%m%d%H%M%S)
REL="$BASE/releases/$STAMP"
KEEP=${KEEP:-5}

[ "$(id -u)" = 0 ] || { echo "run as root (sudo)"; exit 1; }
command -v /usr/local/bin/pnpm >/dev/null || { echo "pnpm missing at /usr/local/bin/pnpm"; exit 1; }
[ -f /etc/enwank-site/env ] || { echo "/etc/enwank-site/env missing: run scripts/box-setup.sh first"; exit 1; }

SHA=$(git -C "$REPO" rev-parse --short "$REF")
echo "==> release $STAMP from $REF ($SHA)"
install -d -o enwank-site -g enwank-site -m 0750 "$REL"
git -C "$REPO" archive --format=tar "$REF" | tar -x -C "$REL"
chown -R enwank-site:enwank-site "$REL"

run_as_site() {
  sudo -u enwank-site -H bash -c "set -euo pipefail; set -a; . /etc/enwank-site/env; set +a; export HOME=/srv/3enwank-site PATH=/usr/local/bin:/usr/bin:/bin NEXT_TELEMETRY_DISABLED=1 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 SITE_VERSION='$SHA'; cd '$REL'; $*"
}

switch_current() {
  ln -sfn "$1" "$BASE/current.new" && mv -Tf "$BASE/current.new" "$BASE/current"
}

wait_healthy() {
  local i
  for i in $(seq 1 30); do
    # Every locale, not just the health route. The Arabic pages are prerendered params of a dynamic
    # [locale] route: they can be missing while the English pages and /api/health are perfectly
    # happy, which is how a release once served 404 for two of the three languages.
    #
    # The third locale (ar-eg) was removed, so its curl is gone with it. Keep this list in step with
    # LOCALES: `curl -fsS` exits 22 on a 404, so a locale checked here after it stops being built
    # fails every health check, rolls every release back, and still prints that the previous release
    # is healthy.
    if curl -fsS -o /dev/null http://127.0.0.1:3001/api/health/ &&
       curl -fsS -o /dev/null http://127.0.0.1:3001/ &&
       curl -fsS -o /dev/null http://127.0.0.1:3001/ar/; then return 0; fi
    sleep 1
  done
  return 1
}

echo "==> install dependencies"
run_as_site pnpm install --frozen-lockfile --prefer-offline

echo "==> build"
run_as_site pnpm exec next build

PREV=""
if [ -L "$BASE/current" ]; then PREV=$(readlink -f "$BASE/current"); fi

echo "==> switch current -> $REL"
switch_current "$REL"

echo "==> restart service"
systemctl restart enwank-site.service
if wait_healthy; then
  echo "health ok"
else
  echo "health check failed for release $STAMP ($SHA)"
  journalctl -u enwank-site -n 50 --no-pager || true
  if [ -n "$PREV" ] && [ -d "$PREV" ]; then
    echo "==> rolling back current -> $PREV"
    switch_current "$PREV"
    systemctl restart enwank-site.service
    if wait_healthy; then echo "previous release restored and healthy"; else echo "previous release restored but still unhealthy"; fi
  fi
  echo "release $REL kept on disk for inspection"
  exit 1
fi

echo "==> prune old releases (keep $KEEP)"
ls -1dt "$BASE"/releases/*/ | tail -n +$((KEEP + 1)) | xargs -r rm -rf
echo "==> deployed $SHA"
