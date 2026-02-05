FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install at runtime so the mounted node_modules volume gets correct linux-musl binaries.
# (Host node_modules from Windows would otherwise be used and miss @rollup/rollup-linux-x64-musl.)
CMD ["sh", "-c", "npm install && npm run dev"]

