#!/usr/bin/env node

/**
 * Script de démarrage en production
 * Lit le port depuis le fichier .env ou utilise 3001 par défaut
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Charger le fichier .env
const envPath = path.join(__dirname, '..', '.env');
let port = '3001'; // Port par défaut

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const portMatch = envContent.match(/^PORT=(\d+)/m);
  if (portMatch) {
    port = portMatch[1];
  }
}

// Lancer Next.js avec le port configuré
const command = `next start -p ${port}`;
console.log(`Starting Next.js on port ${port}...`);
execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });

