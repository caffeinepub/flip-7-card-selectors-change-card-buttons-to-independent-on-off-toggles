# Deployment Guide

This document describes how to reproduce the deployment process locally and what information to collect when deployment issues occur.

## Prerequisites

Before attempting deployment, ensure you have:

1. **DFX (Internet Computer SDK)** installed
   ```bash
   dfx --version
   ```
   If not installed, visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/

2. **Node.js and npm** (version 18 or higher recommended)
   ```bash
   node --version
   npm --version
   ```

3. **DFX running locally** (for local deployment)
   ```bash
   dfx start --clean --background
   ```

## Local Deployment Steps

### Option 1: Automated Rebuild with Log Capture (Recommended)

Use the automated script to run the complete deployment flow and capture all logs:

