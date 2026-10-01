FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html one-pager.html styles.css app.js /usr/share/nginx/html/
COPY output/pdf/photo-case-studio-one-pager.pdf /usr/share/nginx/html/output/pdf/photo-case-studio-one-pager.pdf
COPY assets/renders/ /usr/share/nginx/html/assets/renders/
