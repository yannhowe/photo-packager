FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html studio.html commission.html one-pager.html styles.css site.css app.js hero-scene.js commission.js site-config.js site-tip.js /usr/share/nginx/html/
COPY output/pdf/photo-case-studio-one-pager.pdf /usr/share/nginx/html/output/pdf/photo-case-studio-one-pager.pdf
COPY assets/sleeve-sequence.svg /usr/share/nginx/html/assets/sleeve-sequence.svg
COPY assets/package-three-quarter.png /usr/share/nginx/html/assets/package-three-quarter.png
COPY assets/renders/ /usr/share/nginx/html/assets/renders/
