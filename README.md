# Savor — AI Recipe Studio

A polished, responsive recipe discovery app with a pantry helper, favorites, recipe filters, and an OpenAI-powered cooking assistant.

## Features

- Responsive recipe discovery interface
- Recipe filters and persistent saved recipes (browser storage)
- Pantry ingredient chips that persist between visits
- “Cook with this” prompt that uses your pantry in the AI request
- AI Chef chat powered by the OpenAI Responses API
- Helpful configuration message when an API key is not set

## Run locally

1. Install [Node.js 18+](https://nodejs.org/).
2. In this project folder, run:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`, then add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_key_here
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## AI integration

The browser never receives your API key. It posts a cooking request to the local `/api/chef` endpoint, and `server.js` forwards it to OpenAI's Responses API with focused chef instructions. Change `OPENAI_MODEL` in `.env` if you have another supported model.

## Project structure

```
public/index.html    Page structure
public/styles.css    Responsive visual design
public/app.js        Browser interactions and state
server.js            Static server and secure OpenAI proxy
```
