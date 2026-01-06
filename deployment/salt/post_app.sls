{% set TETHYS_HOME = salt['environ.get']('TETHYS_HOME') %}
{% set CONDA_ENV_NAME = salt['environ.get']('CONDA_ENV_NAME') %}
{% set CONDA_HOME = salt['environ.get']('CONDA_HOME') %}
{% set TETHYS_PERSIST = salt['environ.get']('TETHYS_PERSIST') %}
{% set APP_SOURCES_ROOT = salt['environ.get']('APP_SOURCES_ROOT') %}

{% set STATIC_ROOT = salt['environ.get']('STATIC_ROOT') %}


Install_React_App:
  cmd.run:
    - name: npm install
    - cwd: {{ TETHYS_HOME }}/Tethys_react_app
    - shell: /bin/bash

Build_React_App:
  cmd.run:
    - name: npm run build
    - cwd: {{ TETHYS_HOME }}/Tethys_react_app
    - shell: /bin/bash

Copy_Code_Base_to_STATIC:
  cmd.run:
    - name: cp -r {{ TETHYS_HOME }}/Tethys_react_app/tethysapp/tethysdash/public {{ STATIC_ROOT }}/static/tethysdash/
    - shell: /bin/bash

Copy_Code_Base_to_Persist:
  cmd.run:
    - name: cp -r {{ TETHYS_HOME }}/Tethys_react_app/tethysapp/tethysdash/* {{ TETHYS_PERSIST }}/static/tethysdash/
    - shell: /bin/bash

Copy_Code_Base_to_Nginx:
  cmd.run:
    - name: cp -r {{ TETHYS_HOME }}/Tethys_react_app/tethysapp/tethysdash/* {{ APP_SOURCES_ROOT }}/tethysdash
    - shell: /bin/bash

Persist_Portal_Config_Post_App:
  file.rename:
    - source: {{ TETHYS_HOME }}/portal_config.yml
    - name: {{ TETHYS_PERSIST }}/portal_config.yml
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/portal_config.yml" ];"

Restore_Portal_Config_Post_App:
  file.symlink:
    - name: {{ TETHYS_HOME }}/portal_config.yml
    - target: {{ TETHYS_PERSIST }}/portal_config.yml
    - force: True

Chown_Portal_Config_Post_App:
  cmd.run:
    - name: chown www:www {{ TETHYS_HOME }}/portal_config.yml
    - shell: /bin/bash

Collect_Static:
  cmd.run:
    - name: tethys manage collectstatic --noinput
    - shell: /bin/bash

Collect_Workspaces:
  cmd.run:
    - name: tethys manage collectworkspaces
    - shell: /bin/bash

Run_Migrations:
  cmd.run:
    - cwd: {{ TETHYS_HOME }}/Tethys_react_app/tethysapp/tethysdash/
    - name: alembic upgrade head
    - shell: /bin/bash

Persist_NGINX_Config_Post_App:
  file.rename:
    - source: {{ TETHYS_HOME }}/tethys_nginx.conf
    - name: {{ TETHYS_PERSIST }}/tethys_nginx.conf
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/tethys_nginx.conf" ];"

Link_NGINX_Config_Post_App:
  file.symlink:
    - name: /etc/nginx/sites-enabled/tethys_nginx.conf
    - target: {{ TETHYS_PERSIST }}/tethys_nginx.conf
    - force: True

Persist_NGINX_Supervisor_Post_App:
  file.rename:
    - source: {{ TETHYS_HOME }}/nginx_supervisord.conf
    - name: {{ TETHYS_PERSIST }}/nginx_supervisord.conf
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/nginx_supervisord.conf" ];"

Link_NGINX_Supervisor_Post_App:
  file.symlink:
    - name: /etc/supervisor/conf.d/nginx_supervisord.conf
    - target: {{ TETHYS_PERSIST }}/nginx_supervisord.conf
    - force: True

Persist_ASGI_Supervisor_Post_App:
  file.rename:
    - source: {{ TETHYS_HOME }}/asgi_supervisord.conf
    - name: {{ TETHYS_PERSIST }}/asgi_supervisord.conf
    - unless: /bin/bash -c "[ -f "${TETHYS_PERSIST}/asgi_supervisord.conf" ];"

Link_ASGI_Supervisor_Post_App:
  file.symlink:
    - name: /etc/supervisor/conf.d/asgi_supervisord.conf
    - target: {{ TETHYS_PERSIST }}/asgi_supervisord.conf
    - force: True

Tethys_Persist_Permissions:
  cmd.run:
    - name: "chown -R www: {{ TETHYS_PERSIST }} && chmod -R g+rw {{ TETHYS_PERSIST }}"
    - shell: /bin/bash

Set_Ownership_TethysDash:
  cmd.run:
    - name: chown -R www:www /opt/conda/envs/tethys/lib/python3.12/site-packages/tethysapp/tethysdash
    - shell: /bin/bash

Set_Permissions_TethysDash:
  cmd.run:
    - name: chmod -R 775 /opt/conda/envs/tethys/lib/python3.12/site-packages/tethysapp/tethysdash
    - shell: /bin/bash
