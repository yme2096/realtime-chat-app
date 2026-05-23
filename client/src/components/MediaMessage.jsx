const formatBytes = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaMessage = ({ message }) => {
  const { type, media, content } = message;

  // ── Call history ──────────────────────────────────────────
  if (type === "call") {
    const isVideo = content?.includes("Video") || content?.includes("🎥");
    const isMissed = content?.includes("Missed");
    return (
      <div className="flex items-center gap-3 py-1 min-w-[160px]">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0 ${
          isMissed ? "bg-red-500/20" : "bg-green-500/20"
        }`}>
          {isVideo ? "🎥" : "📞"}
        </div>
        <div>
          <p className="text-sm font-medium leading-tight">
            {isVideo ? "Video Call" : "Audio Call"}
          </p>
          <p className={`text-xs ${isMissed ? "text-red-400" : "text-gray-400"}`}>
            {content?.split("•")[1]?.trim() || (isMissed ? "Missed" : "Ended")}
          </p>
        </div>
      </div>
    );
  }

  // ── Text ──────────────────────────────────────────────────
  if (type === "text" || !type) {
    return <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  // ── Image ─────────────────────────────────────────────────
  if (type === "image" && media?.url) {
    return (
      <div className="space-y-1">
        <img
          src={media.url}
          alt={media.name || "image"}
          className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(media.url, "_blank")}
          loading="lazy"
        />
        {content && <p className="text-sm">{content}</p>}
      </div>
    );
  }

  // ── Video ─────────────────────────────────────────────────
  if (type === "video" && media?.url) {
    return (
      <div className="space-y-1">
        <video
          src={media.url}
          controls
          className="rounded-xl max-w-full max-h-48"
          preload="metadata"
        />
        {content && <p className="text-sm">{content}</p>}
      </div>
    );
  }

  // ── Audio / Voice message ─────────────────────────────────
  if (type === "audio" && media?.url) {
    return (
      <div className="flex items-center gap-2 bg-black/20 rounded-xl p-2 min-w-[200px]">
        <span className="text-xl shrink-0">🎵</span>
        <audio
          src={media.url}
          controls
          className="flex-1 h-8"
          style={{ minWidth: 0 }}
        />
      </div>
    );
  }

  // ── File ──────────────────────────────────────────────────
  if (type === "file" && media?.url) {
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-black/20 hover:bg-black/30 rounded-xl p-3 transition-colors min-w-[180px]"
      >
        <span className="text-2xl shrink-0">
          {media.mimeType?.includes("pdf") ? "📄" : "📎"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{media.name || "File"}</p>
          <p className="text-xs opacity-60">{formatBytes(media.size)}</p>
        </div>
        <span className="text-xs opacity-60 shrink-0">↓</span>
      </a>
    );
  }

  // Fallback for text content
  return content ? (
    <p className="text-sm break-words whitespace-pre-wrap">{content}</p>
  ) : null;
};

export default MediaMessage;
