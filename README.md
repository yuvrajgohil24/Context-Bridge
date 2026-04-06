# ContextBridge 🌉

ContextBridge is a productivity-first Chrome Extension and Next.js application designed to capture, compress, and format AI chat conversations for seamless reuse. It bridges the gap between different AI models (Claude, ChatGPT, Cursor) by providing a unified way to "shuttle" context between sessions.

## ✨ Key Features

- **Multi-Platform Scraper**: Capture structured conversations from Claude.ai, ChatGPT, and Cursor.com with a single click.
- **AI-Powered Compression**: Uses the **Gemini 1.5 Flash** model to distill long chat logs into concise, high-density context snippets.
- **Clean UI**: Modern, dark-themed dashboard for managing and previewing captured context.
- **Fast Integration**: One-click copying of compressed context back to your clipboard.
- **Zero Configuration**: Ready to use as a local development extension.

## 🛠️ Tech Stack

- **Extension**: Vanilla JavaScript, Chrome Extension MV3 API, Tailwind-inspired CSS.
- **Web App**: Next.js 15, TypeScript, React 19.
- **AI Engine**: Google Generative AI (Gemini SDK).

## 🚀 Getting Started

### 1. Repository Setup
```bash
git clone https://github.com/yuvrajgohil24/Context-Scrapper.git
cd context-scrapper/contextbridge
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the `contextbridge` root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Load Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `extension` folder inside this repository.

### 4. Run Development Server
```bash
npm run dev
```

## 📂 Project Structure

- `contextbridge/extension/`: The Chrome Extension source files (manifest, content scripts, popup).
- `contextbridge/app/`: Next.js frontend and compression logic.
- `contextbridge/lib/`: Core utilities and AI prompt templates.

## 📄 License

MIT License - feel free to build upon it!

---
Built with ❤️ for AI Power Users.
