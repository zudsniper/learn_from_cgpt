# scraper.js setup script
# -----------------------
# Node.js version: v14.17.1
# This script sets up the environment for running the scraper.js script.
# It checks for the necessary command line tools (Node.js and npm), installs the necessary npm packages, and runs the script.

$NODE_VERSION="14.17.1"
$INSTALL_NODE_VERSION="16.18.0"

# Check if the script is running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
  Write-Host "This script requires Administrator privileges. Please run the script as Administrator." -ForegroundColor Red
  exit 1
}

Write-Host "Checking for Node.js and npm..." -ForegroundColor Cyan

# Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed. Installing..." -ForegroundColor Yellow
  iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
  scoop install nodejs@$INSTALL_NODE_VERSION
} else {
  Write-Host "Node.js is installed. Version: $(node -v)" -ForegroundColor Green
}

# Check for npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "npm is not installed. Installing..." -ForegroundColor Yellow
  scoop install npm
} else {
  Write-Host "npm is installed. Version: $(npm -v)" -ForegroundColor Green
}

Write-Host "Installing npm packages..." -ForegroundColor Cyan

# Install necessary npm packages
npm install undetected-chromedriver loglevel chalk moment

Write-Host "undetected-chromedriver version: $(npm list undetected-chromedriver)" -ForegroundColor Green
Write-Host "loglevel version: $(npm list loglevel)" -ForegroundColor Green
Write-Host "chalk version: $(npm list chalk)" -ForegroundColor Green
Write-Host "moment version: $(npm list moment)" -ForegroundColor Green

Write-Host "Running scraper.js script..." -ForegroundColor Cyan

# Run the script
node scraper.js
