import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: string;
  sender_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

const SESSION_KEY = "live_chat_session_id";

export default function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(0);

  // Restore or create session
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionId(stored);
      setStarted(true);
    }
  }, []);

  // Fetch messages when session exists
  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data as ChatMessage[]);
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, msg]);
          if (msg.sender_type === "admin" && !open) {
            setUnread((c) => c + 1);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, open]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const startChat = async () => {
    const name = user?.user_metadata?.full_name || guestName.trim();
    if (!name && !user) return;

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user?.id || null,
        guest_name: user ? null : name,
        guest_email: user?.email || null,
      })
      .select("id")
      .single();

    if (data && !error) {
      setSessionId(data.id);
      localStorage.setItem(SESSION_KEY, data.id);
      setStarted(true);

      // Send initial greeting
      await supabase.from("chat_messages").insert({
        session_id: data.id,
        sender_type: "system",
        message: "আমাদের লাইভ চ্যাটে স্বাগতম! একজন প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।",
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || sending) return;
    setSending(true);
    const msg = input.trim();
    setInput("");

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "client",
      sender_id: user?.id || null,
      message: msg,
    });

    setSending(false);
  };

  const endChat = () => {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setStarted(false);
    setMessages([]);
    setOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-50 w-[340px] sm:w-[380px] h-[480px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">লাইভ চ্যাট</p>
                  <p className="text-[10px] opacity-80">সাধারণত কয়েক মিনিটে উত্তর দিই</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/20 transition-colors">
                  <Minimize2 className="h-4 w-4" />
                </button>
                {started && (
                  <button onClick={endChat} className="p-1 rounded hover:bg-white/20 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            {!started ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-primary/30 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground">আমাদের সাথে চ্যাট করুন</h3>
                  <p className="text-xs text-muted-foreground mt-1">আমরা সাহায্য করতে এখানে আছি</p>
                </div>
                {!user && (
                  <Input
                    placeholder="আপনার নাম"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="text-sm"
                  />
                )}
                <Button onClick={startChat} className="w-full" disabled={!user && !guestName.trim()}>
                  চ্যাট শুরু করুন
                </Button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.sender_type === "client" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                          m.sender_type === "client"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : m.sender_type === "system"
                            ? "bg-muted text-muted-foreground text-xs text-center w-full rounded-lg"
                            : "bg-accent text-accent-foreground rounded-bl-sm"
                        }`}
                      >
                        {m.message}
                        <p className={`text-[9px] mt-1 ${
                          m.sender_type === "client" ? "text-primary-foreground/60" : "text-muted-foreground/60"
                        }`}>
                          {new Date(m.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="border-t border-border p-3">
                  <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      placeholder="মেসেজ লিখুন..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 text-sm h-9"
                      autoFocus
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || sending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
