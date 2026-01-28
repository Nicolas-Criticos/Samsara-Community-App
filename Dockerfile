#  Build Project in a Production State
FROM nginx:1.25-alpine

# Actual Image
WORKDIR /usr/share/nginx/html

COPY ./src .
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf