# ベースイメージとして公式の Nginx を使用
FROM nginx:alpine

# ローカルの index.html を Nginx の公開ディレクトリにコピー
COPY index.html /usr/share/nginx/html/

COPY statics /usr/share/nginx/html/statics

# Nginx がリッスンするポート
EXPOSE 80

# Nginx をフォアグラウンドで実行
CMD ["nginx", "-g", "daemon off;"]
