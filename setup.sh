#!/usr/bin/env bash
set -e
RED='\033[1;31m'; NC='\033[0m'
echo -e "${RED}"
cat << "EOF"
 ███████╗██╗  ██╗ ██████╗ ███╗   ███╗ █████╗
 ██╔════╝╚██╗██╔╝██╔═══██╗████╗ ████║██╔══██╗
 █████╗   ╚███╔╝ ██║   ██║██╔████╔██║███████║
 ██╔══╝   ██╔██╗ ██║   ██║██║╚██╔╝██║██╔══██║
 ███████╗██╔╝ ██╗╚██████╔╝██║ ╚═╝ ██║██║  ██║
 ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
              E X O M A   V 1
EOF
echo -e "${NC}"
node -v >/dev/null 2>&1 || { echo -e "${RED}[!] Install Node.js 18+ dulu.${NC}"; exit 1; }
echo -e "${RED}[+] Installing deps...${NC}"
npm install --no-audit --no-fund
mkdir -p session logs
echo -e "${RED}[+] Jalanin: node exoma.js${NC}"
node exoma.js
