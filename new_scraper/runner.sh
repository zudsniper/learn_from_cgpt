#!/bin/bash

# scraper.js setup script
# -----------------------
# Node.js version: v14.17.1
# This script sets up the environment for running the scraper.js script.
# It checks for the necessary command line tools (Node.js and npm), installs the necessary npm packages, and runs the script.

NODE_VERSION="14.17.1"
INSTALL_NODE_VERSION="16.18.0"

# Check if the script is running as root
if [ "$EUID" -eq 0 ]; then
  echo -e "\033[1;31mError: This script cannot be run as root. Please switch to a different user who is a member of the sudo group.\033[0m"
  exit 1
fi

# Check if the user is in the sudo group
if ! id -nG "$USER" | grep -qw "sudo"; then
  echo -e "\033[1;31mError: This script requires sudo privileges. Please add the current user to the sudo group.\033[0m"
  exit 1
fi

# Check for .ansi_colors.sh and source it
if [ ! -f ~/.ansi_colors.sh ]; then
  echo -e "\033[1;33m.ansi_colors.sh not found. Downloading...\033[0m"
  curl -o ~/.ansi_colors.sh https://gh.zod.tf/bashbits/raw/master/.ansi_colors.sh
fi
source ~/.ansi_colors.sh

echo -e "${Cyan}Checking for Node.js and npm...${Color_Off}"

# Check for nvm
if ! [ -x "$(command -v nvm)" ]; then
  echo -e "${Yellow}nvm is not installed. Installing...${Color_Off}"
  export NVM_DIR="$HOME/.nvm" && (
    git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
    cd "$NVM_DIR"
    git checkout `git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1)`
  ) && \. "$NVM_DIR/nvm.sh"
fi

# Check for Node.js
if ! [ -x "$(command -v node)" ]; then
  echo -e "${Yellow}Node.js is not installed. Installing...${Color_Off}"
  nvm install $INSTALL_NODE_VERSION
  nvm use $INSTALL_NODE_VERSION
  nvm alias default $INSTALL_NODE_VERSION
else
  echo -e "${Green}Node.js is installed. Version: $(node -v)${Color_Off}"
fi

# Check for npm
if ! [ -x "$(command -v npm)" ]; then
  echo -e "${Yellow}npm is not installed. Installing...${Color_Off}"
  nvm install-latest-npm
else
  echo -e "${Green}npm is installed. Version: $(npm -v)${Color_Off}"
fi

echo -e "${Cyan}Installing npm packages...${Color_Off}"

# Install necessary npm packages
npm install undetected-chromedriver loglevel chalk moment

echo -e "${Green}undetected-chromedriver version: $(npm list undetected-chromedriver)${Color_Off}"
echo -e "${Green}loglevel version: $(npm list loglevel)${Color_Off}"
echo -e "${Green}chalk version: $(npm list chalk)${Color_Off}"
echo -e "${Green}moment version: $(npm list moment)${Color_Off}"

echo -e "${Cyan}Running scraper.js script...${Color_Off}"

# Run the script
node scraper.js
