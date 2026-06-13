export default function Footer() {
  return (
    <footer className="border-t border-line mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted">
        <p>ContextBridge — compress AI chats into reusable context.</p>
        <div className="flex items-center gap-4">
          <span>Powered by Gemini</span>
          <a
            href="https://github.com/yuvrajgohil24/Context-Bridge"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink transition-colors"
          >
            Source
          </a>
        </div>
      </div>
    </footer>
  );
}
