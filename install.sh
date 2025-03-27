#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Installing dependencies for Escape Orbit...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Dependencies installed successfully!${NC}"
    echo -e "${YELLOW}Starting the server...${NC}"
    
    npm start
else
    echo -e "${RED}Failed to install dependencies. Please check the error messages above.${NC}"
    exit 1
fi 