import { useEffect, useRef } from "react";
import Avatar from "./Avatar";

const IncomingCallToast = ({ caller, callType, onAccept, onDecline }) => {
  const stoppedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }

    const ring = () => {
      if (stoppedRef.current || !ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 480;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } catch {}
      if (!stoppedRef.current) {
        timeoutRef.current = setTimeout(ring, 1800);
      }
    };

    ring();

    return () => {
      stoppedRef.current = true;
      clearTimeout(timeoutRef.current);
      ctx?.close().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-gray-900 border border-indigo-500/50 rounded-2xl shadow-2xl p-4 w-72">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Avatar src={caller?.avatar} name={caller?.username || "?"} size="md" />
          <span className="absolute -bottom-1 -right-1 text-base">
            {callType === "video" ? "🎥" : "📞"}
          </span>
        </div>
        <div>
          <p className="text-white font-semibold">{caller?.username || "Unknown"}</p>
          <p className="text-gray-400 text-sm">
            Incoming {callType === "video" ? "video" : "audio"} call...
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onDecline}
          className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-xl font-medium transition-all"
        >
          📵 Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-xl font-medium transition-all"
        >
          📞 Accept
        </button>
      </div>
    </div>
  );
};

export default IncomingCallToast;
