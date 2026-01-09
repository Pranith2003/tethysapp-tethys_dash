FROM tethysplatform/tethys-core:4.3.7-py3.12-dj4.2

ENV TETHYS_DB_HOST="tethys_db" \
    TETHYS_DB_PORT="5432" \
    TETHYS_DB_ENGINE="django.db.backends.postgresql" \
    TETHYS_DB_NAME="tethys_platform" \
    TETHYS_DB_USERNAME="tethys_default" \
    TETHYS_DB_PASSWORD="postgres" \
    TETHYS_DB_SUPERUSER="tethys_super" \
    TETHYS_DB_SUPERUSER_PASS="postgres" \
    TERM="xterm-256color" \
    ALLOWED_HOSTS="\"[localhost]\"" \
    PORTAL_SUPERUSER_NAME="admin" \
    PORTAL_SUPERUSER_PASSWORD="postgres" \
    PORTAL_SUPERUSER_EMAIL="you@email.com" \
    POSTGRES_PASSWORD="postgres" \
    SOCIAL_AUTH_REDIRECT_IS_HTTPS=True

COPY . ${TETHYS_HOME}/apps/tethys_react_app

ARG MAMBA_DOCKERFILE_ACTIVATE=1

RUN pip install --upgrade daphne twisted python-dotenv

WORKDIR ${TETHYS_HOME}/apps/tethys_react_app
RUN tethys install --no-db-sync

RUN chown -R www:www /opt/conda/envs/tethys/lib/python3.12/site-packages/tethysapp/tethysdash && \
    chmod -R 775 /opt/conda/envs/tethys/lib/python3.12/site-packages/tethysapp/tethysdash

COPY deployment/salt srv/salt

EXPOSE 80
WORKDIR ${TETHYS_HOME}
CMD bash run.sh
