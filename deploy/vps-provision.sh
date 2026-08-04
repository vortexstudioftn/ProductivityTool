#!/usr/bin/env bash
# Provisionne le VPS pour servir Élan : nginx + fichiers statiques.
# Idempotent : ré-exécutable sans risque. Attend :
#   - l'archive du site dans /tmp/elan-site.tar.gz (déposée par scp) ;
#   - la variable d'environnement VPS_HOST (IP ou domaine public).
set -euo pipefail

SITE_DIR=/var/www/elan
ARCHIVE=/tmp/elan-site.tar.gz
HOST_NAME="${VPS_HOST:-_}"

# 1. Dépose les fichiers du site.
test -f "$ARCHIVE" || { echo "Archive $ARCHIVE introuvable" >&2; exit 1; }
mkdir -p "$SITE_DIR"
find "$SITE_DIR" -mindepth 1 -delete
tar -xzf "$ARCHIVE" -C "$SITE_DIR"
rm -f "$ARCHIVE"

# 2. Installe nginx si nécessaire.
if ! command -v nginx >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq nginx
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y -q nginx
  elif command -v yum >/dev/null 2>&1; then
    yum install -y -q nginx
  elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache nginx
  else
    echo "Gestionnaire de paquets non reconnu : installez nginx manuellement." >&2
    exit 1
  fi
fi

# 3. Écrit le vhost. server_name = adresse publique : la correspondance
#    exacte l'emporte sur un éventuel default_server de la distribution.
V6LINE=""
[ -f /proc/net/if_inet6 ] && V6LINE="listen [::]:80"

if [ -d /etc/nginx/sites-enabled ]; then
  CONF_PATH=/etc/nginx/sites-available/elan
  rm -f /etc/nginx/sites-enabled/default
else
  CONF_PATH=/etc/nginx/conf.d/elan.conf
  if [ -f /etc/nginx/conf.d/default.conf ]; then
    mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.desactive
  fi
fi

write_conf() {
  local extra="$1"
  {
    echo "server {"
    echo "    listen 80 $extra;"
    if [ -n "$V6LINE" ]; then echo "    $V6LINE $extra;"; fi
    cat <<NGINX
    server_name $HOST_NAME;

    root $SITE_DIR;
    index index.html;

    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
    location = /manifest.webmanifest {
        default_type application/manifest+json;
    }
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
}
NGINX
  } > "$CONF_PATH"
}

if [ -d /etc/nginx/sites-enabled ]; then
  ln -sf "$CONF_PATH" /etc/nginx/sites-enabled/elan
fi

write_conf "default_server"
if ! nginx -t >/dev/null 2>&1; then
  # Un default_server existe déjà ailleurs (config d'origine) : on s'appuie
  # uniquement sur la correspondance exacte du server_name.
  write_conf ""
  nginx -t
fi

# 4. SELinux (RHEL) : rétablit le contexte des fichiers déposés.
command -v restorecon >/dev/null 2>&1 && restorecon -R "$SITE_DIR" || true

# 5. Pare-feu, s'il est actif.
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 80/tcp >/dev/null 2>&1 || true
fi
if command -v firewall-cmd >/dev/null 2>&1 && firewall-cmd --state >/dev/null 2>&1; then
  { firewall-cmd --permanent --add-service=http && firewall-cmd --reload; } >/dev/null 2>&1 || true
fi

# 6. Démarre / recharge nginx.
if [ -d /run/systemd/system ]; then
  systemctl enable --now nginx >/dev/null 2>&1 || true
  systemctl reload nginx 2>/dev/null || systemctl restart nginx
else
  nginx -s reload 2>/dev/null || nginx
fi

echo "OK : Élan est servi sur http://$HOST_NAME/"
