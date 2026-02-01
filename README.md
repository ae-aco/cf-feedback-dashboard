# Cloudflare Feedback Dashboard Prototype

A prototype for aggregating and analysing product feedback using Cloudflare Workers and AI.

## Overview

This project explores and demonstrates how product feedback from multiple sources can be aggregated and analysed using AI to extract insights. Built entirely on Cloudflare's Developer Platform.

## Features

- Aggregates feedback from multiple sources (GitHub, Discord, Support Tickets, etc.)
- Theme extraction and clustering
- AI-powered sentiment analysis
- Urgency classification
- Interactive dashboard with real-time insights
- Chat interface for querying feedback data

## Tech Stack

- **Cloudflare Workers:** Serverless hosting
- **D1 database:** SQL database for storing feedback
- **Workers AI:** Built-in AI models for analysing feedback

## Architecture 

![Cloudflare Bindings Diagram](submission/screenshots/bindings.png)

## Demo

[Live Demo](https://cf-feedback-dashboard.falling-snow-0f42.workers.dev)

## Setup

### Prerequistes 
- Node.js 18+
- npm
- Cloudflare account

### Installation
```bash
# Clone the repo
git clone https://github.com/[your-username]/cf-feedback-dashboard.git
cd cf-feedback-dashboard

# Install dependencies
npm install

# Login to Cloudflare
npx wrangler login

# Set up the database
npx wrangler d1 execute feedback-db --local --file=./schema.sql
npx wrangler d1 execute feedback-db --local --file=./seed-data.sql

# Run locally
npm run dev
```

Visit `http://localhost:8787` to see the dashboard.

### Deployment
```bash
npx wrangler deploy
```

Your app will be live at `https://cf-feedback-dashboard.YOUR-ACCOUNT.workers.dev`

**Time spent**: ~4 hours (1 hour learning, 2 hours building, 1 hour documenting)

## What I Learned

- How Cloudflare Workers makes deployment surprisingly smooth (I expected it to be more complicated)
- D1 setup was straightforward once I figured out the commands
- Workers AI integration is simpler than I expected - no external API keys needed