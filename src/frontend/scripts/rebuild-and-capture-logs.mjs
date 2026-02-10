#!/usr/bin/env node

/**
 * Rebuild and Capture Logs Script
 * 
 * This script runs the complete build and deployment flow for the project,
 * capturing all output to a timestamped log file for debugging deployment issues.
 * 
 * Usage: node frontend/scripts/rebuild-and-capture-logs.mjs
 */

import { spawn } from 'child_process';
import { createWriteStream, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');
const logsDir = join(__dirname, '..', 'deployment-logs');

// Ensure logs directory exists
try {
  mkdirSync(logsDir, { recursive: true });
} catch (err) {
  // Directory might already exist
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = join(logsDir, `deployment-${timestamp}.log`);
const logStream = createWriteStream(logFile, { flags: 'a' });

console.log(`\n🔧 Starting rebuild and deployment...`);
console.log(`📝 Logging to: ${logFile}\n`);

// Helper to write to both console and log file
function logBoth(message) {
  console.log(message);
  logStream.write(message + '\n');
}

// Helper to run a command and capture output
function runCommand(command, args, stageName) {
  return new Promise((resolve, reject) => {
    const separator = '='.repeat(80);
    const stageHeader = `\n${separator}\n🔨 STAGE: ${stageName}\n${separator}\n`;
    
    logBoth(stageHeader);
    logBoth(`Command: ${command} ${args.join(' ')}\n`);

    const proc = spawn(command, args, {
      cwd: projectRoot,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      logStream.write(output);
    });

    proc.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      logStream.write(output);
    });

    proc.on('close', (code) => {
      const resultMsg = `\n✓ Stage "${stageName}" completed with exit code: ${code}\n`;
      logBoth(resultMsg);
      
      if (code !== 0) {
        reject(new Error(`Stage "${stageName}" failed with exit code ${code}`));
      } else {
        resolve();
      }
    });

    proc.on('error', (err) => {
      const errorMsg = `\n❌ Error running "${stageName}": ${err.message}\n`;
      logBoth(errorMsg);
      reject(err);
    });
  });
}

// Main deployment flow
async function main() {
  const stages = [
    {
      name: 'Backend Canister Creation',
      command: 'dfx',
      args: ['canister', 'create', 'backend']
    },
    {
      name: 'Backend Code Generation',
      command: 'dfx',
      args: ['generate', 'backend']
    },
    {
      name: 'Backend Build',
      command: 'dfx',
      args: ['build', 'backend']
    },
    {
      name: 'Frontend Build',
      command: 'npm',
      args: ['run', 'build:skip-bindings'],
      cwd: join(projectRoot, 'frontend')
    },
    {
      name: 'Canister Deployment',
      command: 'dfx',
      args: ['deploy']
    }
  ];

  let failedStage = null;

  try {
    for (const stage of stages) {
      await runCommand(stage.command, stage.args, stage.name);
    }

    const successMsg = `\n${'='.repeat(80)}\n✅ DEPLOYMENT SUCCESSFUL\n${'='.repeat(80)}\n`;
    logBoth(successMsg);
    logBoth(`Full logs saved to: ${logFile}\n`);

  } catch (error) {
    failedStage = error.message;
    const failureMsg = `\n${'='.repeat(80)}\n❌ DEPLOYMENT FAILED\n${'='.repeat(80)}\n`;
    logBoth(failureMsg);
    logBoth(`Error: ${error.message}\n`);
    logBoth(`\nFull logs saved to: ${logFile}\n`);
    logBoth(`\n📋 Please share the complete log file when reporting this issue.\n`);
    
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// Run the script
main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
