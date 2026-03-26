Create Docker setup for this full-stack chat application.

Tech stack context:
- Frontend: Next.js 16 (my-app/)
- Backend: Express.js + Socket.IO (backend/)
- Database: MongoDB Atlas (external cloud service — no local container needed)
- Storage: Cloudinary (external — no local container needed)

Create:

1. backend/Dockerfile — multi-stage, production Node.js 20 Alpine
2. my-app/Dockerfile — multi-stage with Next.js standalone output
3. my-app/next.config.js — add output: 'standalone' for Docker build
4. docker-compose.yml — production: nginx + frontend + backend (no DB container)
5. docker-compose.dev.yml — development with volume mounts for hot reload
6. nginx/nginx.conf — proxy frontend :3000 and backend :4000, with WebSocket upgrade for /socket.io
7. .dockerignore for both apps

Environment variables needed in docker-compose.yml:
- MONGODB_URI (Atlas connection string)
- JWT_SECRET, JWT_REFRESH_SECRET
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
- CLIENT_URL, SERVER_URL
- NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SOCKET_URL

Critical: Nginx must set proxy headers for Socket.IO WebSocket upgrade:
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 86400s;

Add health check endpoint GET /api/health in Express if not already present.
