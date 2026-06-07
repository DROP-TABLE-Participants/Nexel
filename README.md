<p align="center">
	<img alt="Nexel logo" src="https://github.com/user-attachments/assets/09bffe90-7778-4f9c-97ca-926c5f901d15" width="220">
</p>

<h1 align="center">Nexel — Company Brain (MCP) Server</h1>

<p align="center">
	<img alt="repo size" src="https://img.shields.io/github/repo-size/DROP-TABLE-Participants/Nexel?style=for-the-badge">
	<img alt="languages" src="https://img.shields.io/github/languages/count/DROP-TABLE-Participants/Nexel?style=for-the-badge">
</p>


## 🗂️ Tech Stack:
<p align="left">
    <a href="https://www.figma.com/"><img src="https://img.icons8.com/color/344/figma--v1.png" alt="Figma logo" width=48px/></a>
    <a href="https://github.com/"><img src="https://img.icons8.com/nolan/344/github.png" alt="GitHub logo" width=52px /></a>
    <a href="https://nextjs.org/"><img src="https://www.svgrepo.com/show/354113/nextjs-icon.svg" alt="NextJS logo" width=52px /></a>
   <a href="https://www.docker.com/"><img src="https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/97_Docker_logo_logos-512.png" alt="Docker logo" width=52px/></a>
   <a href="https://www.python.org/"><img src="https://cdn.iconscout.com/icon/free/png-256/free-python-logo-icon-download-in-svg-png-gif-file-formats--technology-social-media-vol-5-pack-logos-icons-2945099.png?f=webp&w=256" alt="Python logo" width=52px/></a>
</p>

## Team

Stoyan Ivanov, Kalin Chervenkov, Mario Berberov, Boris Savov, Egor Semenov

## Quickstart

Clone, install, and run (dev):

```bash
git clone https://github.com/DROP-TABLE-Participants/Nexel.git
cd Nexel
npm install
cp .env.example .env.local
docker compose up -d postgres
npm run db:migrate
npm run dev
```

Or run with Docker:

```bash
docker compose up --build
```

Open http://localhost:3000

## MCP Endpoint

The MCP server endpoint: `http://localhost:3000/mcp`

For JSON clients include headers:

```
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2025-11-25
```

