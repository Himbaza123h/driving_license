# Deploy Mock Servers to Railway/Render/DigitalOcean

## Option A: Railway (Recommended)

### Deploy eSignet Backend:
```bash
# Create new Railway project
railway login
railway init dlv-burundi-esignet

# Create Dockerfile for eSignet server
# (See docker-setup.md)

railway deploy
```

### Deploy Identity System:
```bash
railway init dlv-burundi-identity
railway deploy
```

## Option B: Render

### eSignet Backend Service:
- Repository: Your GitHub repo
- Build Command: `npm install`
- Start Command: `node mock-server/esignet-server.js`
- Environment: Node.js

### Identity System Service:
- Repository: Your GitHub repo  
- Build Command: `npm install`
- Start Command: `node mock-server/server.js`
- Environment: Node.js

## Option C: DigitalOcean App Platform

### App Spec (app.yaml):
```yaml
name: dlv-burundi-mock
services:
- name: esignet-backend
  source_dir: /mock-server
  run_command: node esignet-server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  
- name: identity-system
  source_dir: /mock-server  
  run_command: node server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
```

## URLs After Deployment:
- eSignet Backend: `https://dlv-burundi-esignet.railway.app`
- Identity System: `https://dlv-burundi-identity.railway.app`
- Frontend: `https://dlv-burundi.vercel.app`
