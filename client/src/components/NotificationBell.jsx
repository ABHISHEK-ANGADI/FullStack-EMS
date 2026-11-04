import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api";

const typeColor = (type) => {
  switch (type) {
    case "LEAVE_APPROVED":
      return "bg-emerald-100 text-emerald-700";
    case "LEAVE_REJECTED":
      return "bg-rose-100 text-rose-700";
    case "LEAVE_APPLIED":
      return "bg-amber-100 text-amber-700";
    case "PAYSLIP_GENERATED":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

// Play a short "ding" using Web Audio API — no audio file needed
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq, start, duration, volume = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + duration
      );
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.02);
    };

    playTone(880, 0, 0.12);        // A5
    playTone(1174.66, 0.13, 0.18); // D6

    setTimeout(() => ctx.close(), 500);
  } catch {
    // Autoplay might be blocked — silent fail is fine
  }
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const firstLoadRef = useRef(true);
  const prevUnreadRef = useRef(0);

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pos, setPos] = useState(null);

  const fetchUnread = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnread(count);
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNotifications();
      setNotifications(data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread every 30s
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Play sound when unread count INCREASES (not on first load)
  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      prevUnreadRef.current = unread;
      return;
    }
    if (unread > prevUnreadRef.current) {
      playNotificationSound();
    }
    prevUnreadRef.current = unread;
  }, [unread]);

  // Load list when opened
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Calculate position (Top-Left of Main Content Area)
  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }

    const updatePos = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const sidebar = buttonRef.current.closest("aside");
      const sidebarRight = sidebar
        ? sidebar.getBoundingClientRect().right
        : rect.right;

      setPos({
        top: rect.top + window.scrollY, // Align with bell vertically
        left: sidebarRight + 16,        // 16px to the right of the sidebar
      });
    };

    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

  // Close on outside click or Escape (checks both button and portal dropdown)
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        (buttonRef.current && buttonRef.current.contains(e.target)) ||
        (dropdownRef.current && dropdownRef.current.contains(e.target))
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleItemClick = async (n) => {
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
        );
        setUnread((u) => Math.max(0, u - 1));
      } catch {
        // silent
      }
    }
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch {
      // silent
    }
  };

  return (
    <div className="relative" ref={buttonRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown Portal */}
      {open &&
        pos &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: pos.top + 8, // 8px margin below the bell
              left: pos.left,
              width: "320px",
              zIndex: 9999,
            }}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">
                Notifications
              </h3>
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                      !n.isRead ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColor(
                          n.type
                        )}`}
                      >
                        {n.type.replace(/_/g, " ")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default NotificationBell;