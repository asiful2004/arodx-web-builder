import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2, User, Image, Mic, Square, Pause, Play, Bot, Headphones, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import aiRobotAvatar from "@/assets/ai-robot-avatar.png";
import supportAgentChar from "@/assets/support-agent-character.png";

interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: string;
  sender_id: string | null;
  message: string;
  message_type: string;
  attachment_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface SenderProfile {
  full_name: string | null;
  avatar_url: string | null;
}

const SESSION_KEY = "live_chat_session_id";
const NOTIF_SOUND_URL = "https://cdn.pixabay.com/audio/2022/12/12/audio_e6a8ede5b1.mp3";

// Animated character that pops up with a sign board every 5 seconds
function FloatingCharacter({ onClick }: { onClick: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show after 2s initially, then cycle every 5s
    const initialTimer = setTimeout(() => setVisible(true), 2000);
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => setVisible(true), 800);
    }, 5000);
    return () => { clearTimeout(initialTimer); clearInterval(interval); };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 10, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          onClick={onClick}
          className="cursor-pointer mb-2 flex items-end gap-0"
        >
          {/* Character */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="relative z-10"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-md">
              <span className="text-lg">🧑‍💻</span>
            </div>
          </motion.div>

          {/* Sign Board */}
          <motion.div
            initial={{ x: -5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="relative ml-1 px-3 py-1.5 rounded-xl rounded-bl-sm bg-card border border-border shadow-lg"
          >
            <span className="text-xs font-semibold text-foreground whitespace-nowrap">Need Help? 💬</span>
            {/* Arrow pointer */}
            <div className="absolute -left-1.5 bottom-1.5 w-3 h-3 rotate-45 bg-card border-l border-b border-border" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<string>("active");
  const aiReplyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(0);
  const [senderProfiles, setSenderProfiles] = useState<Map<string, SenderProfile>>(new Map());
  const [clientProfile, setClientProfile] = useState<SenderProfile>({ full_name: null, avatar_url: null });

  // Speech-to-text
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Notification sound
  const audioNotifRef = useRef<HTMLAudioElement | null>(null);
  const playNotifSound = useCallback(() => {
    if (!audioNotifRef.current) {
      audioNotifRef.current = new Audio(NOTIF_SOUND_URL);
      audioNotifRef.current.volume = 0.5;
    }
    audioNotifRef.current.currentTime = 0;
    audioNotifRef.current.play().catch(() => {});
  }, []);

  // Audio playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setClientProfile(data);
      });
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      setSessionId(stored);
      setStarted(true);
      supabase
        .from("chat_sessions")
        .select("guest_name, status")
        .eq("id", stored)
        .single()
        .then(({ data }) => {
          if (data?.guest_name) setGuestName(data.guest_name);
          if (data?.status) setSessionStatus(data.status);
          // If session was deleted (no data), clear it
          if (!data) {
            localStorage.removeItem(SESSION_KEY);
            setSessionId(null);
            setStarted(false);
          }
        });
    }
  }, []);

  const fetchSenderProfiles = useCallback(async (msgs: ChatMessage[]) => {
    const senderIds = [...new Set(msgs.filter(m => m.sender_id).map(m => m.sender_id!))];
    const newIds = senderIds.filter(id => !senderProfiles.has(id));
    if (newIds.length === 0) return;
    const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", newIds);
    if (data) {
      setSenderProfiles(prev => {
        const next = new Map(prev);
        data.forEach(p => next.set(p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }));
        return next;
      });
    }
  }, [senderProfiles]);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) {
      setMessages(data as ChatMessage[]);
      fetchSenderProfiles(data as ChatMessage[]);
    }
  }, [sessionId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

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
          if (msg.sender_id) fetchSenderProfiles([msg]);
          if (msg.sender_type === "admin") {
            setShowTyping(false);
            playNotifSound();
            if (!open) setUnread((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          const updated = payload.new as any;
          setSessionStatus(updated.status);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, open, playNotifSound]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { if (open) setUnread(0); }, [open]);

  const startChat = async () => {
    const name = user?.user_metadata?.full_name || guestName.trim();
    const phone = guestPhone.trim();
    if (!user && (!name || !phone)) return;
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ 
        user_id: user?.id || null, 
        guest_name: user ? null : name, 
        guest_email: user?.email || null,
        guest_phone: user ? null : phone || null,
      } as any)
      .select("id")
      .single();
    if (data && !error) {
      setSessionId(data.id);
      localStorage.setItem(SESSION_KEY, data.id);
      if (!user) {
        setGuestName(name);
        setGuestPhone(phone);
      }
      setStarted(true);
      await supabase.from("chat_messages").insert({
        session_id: data.id, sender_type: "system",
        message: "আমাদের লাইভ চ্যাটে স্বাগতম! একজন প্রতিনিধি শীঘ্রই আপনার সাথে যোগাযোগ করবেন।",
      });
    }
  };

  const uploadFile = async (file: Blob, ext: string): Promise<string | null> => {
    const fileName = `${sessionId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Trigger AI auto-reply after a default delay, let edge function handle settings check
  const triggerAiReply = useCallback(async (sid: string) => {
    if (aiReplyTimerRef.current) clearTimeout(aiReplyTimerRef.current);

    const delay = 10 * 1000; // default 10s delay

    aiReplyTimerRef.current = setTimeout(async () => {
      try {
        await supabase.functions.invoke("chat-ai-reply", {
          body: { session_id: sid },
        });
      } catch (err) {
        console.error("AI auto-reply error:", err);
      }
    }, delay);
  }, []);

  // Cancel AI timer when admin replies
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.sender_type === "admin") {
      if (aiReplyTimerRef.current) {
        clearTimeout(aiReplyTimerRef.current);
        aiReplyTimerRef.current = null;
      }
    }
  }, [messages]);

  const sendMessage = async (msgType = "text", attachUrl: string | null = null, text = "") => {
    const messageText = text || input.trim();
    if (msgType === "text" && !messageText) return;
    if (sending) return;
    setSending(true);
    if (msgType === "text") setInput("");

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_type: "client",
      sender_id: user?.id || null,
      message: messageText || (msgType === "image" ? "📷 ছবি" : "🎤 ভয়েস মেসেজ"),
      message_type: msgType,
      attachment_url: attachUrl,
    });
    setSending(false);
    setShowTyping(true);
    // Start AI auto-reply timer
    if (sessionId) triggerAiReply(sessionId);
  };

  // Image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    const ext = file.name.split(".").pop() || "jpg";
    const url = await uploadFile(file, ext);
    if (url) await sendMessage("image", url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Speech-to-text
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "bn-BD";
    recognition.interimResults = true;
    recognition.continuous = true;
    let finalTranscript = input;
    recognition.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleAudioPlayback = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioPlaybackRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioPlaybackRef.current) audioPlaybackRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingAudioId(null);
    audio.play();
    audioPlaybackRef.current = audio;
    setPlayingAudioId(msgId);
  };

  const endChat = () => {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setStarted(false);
    setMessages([]);
    setOpen(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const getSenderInfo = (m: ChatMessage): { name: string; avatar: string | null; isGuest?: boolean } => {
    if (m.sender_type === "client") {
      if (user && m.sender_id === user.id) {
        return { name: clientProfile.full_name || user.user_metadata?.full_name || "আপনি", avatar: clientProfile.avatar_url || user.user_metadata?.avatar_url || null };
      }
      return { name: guestName || "গেস্ট", avatar: null, isGuest: true };
    }
    if (m.sender_type === "admin") {
      const profile = m.sender_id ? senderProfiles.get(m.sender_id) : null;
      // If no sender_id, it's AI auto-reply — use robot avatar
      if (!m.sender_id) {
        return { name: "ArodX Support Team", avatar: aiRobotAvatar };
      }
      return { name: profile?.full_name || "ArodX Support Team", avatar: profile?.avatar_url || aiRobotAvatar };
    }
    return { name: "সিস্টেম", avatar: null };
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const renderMessageContent = (m: ChatMessage, isClient: boolean) => {
    if (m.message_type === "image" && m.attachment_url) {
      return (
        <div className="space-y-1">
          <img
            src={m.attachment_url}
            alt="ছবি"
            className="max-w-full rounded-lg cursor-pointer max-h-48 object-cover"
            onClick={() => window.open(m.attachment_url!, "_blank")}
          />
          {m.message && m.message !== "📷 ছবি" && <p>{m.message}</p>}
        </div>
      );
    }
    if (m.message_type === "audio" && m.attachment_url) {
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <button
            onClick={() => toggleAudioPlayback(m.id, m.attachment_url!)}
            className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
              isClient ? "bg-primary-foreground/20" : "bg-foreground/10"
            }`}
          >
            {playingAudioId === m.id ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 ml-0.5" />
            )}
          </button>
          <div className="flex-1">
            <div className={`h-1 rounded-full ${isClient ? "bg-primary-foreground/30" : "bg-foreground/20"}`}>
              <div className={`h-1 rounded-full w-0 ${playingAudioId === m.id ? "animate-pulse w-full" : ""} ${
                isClient ? "bg-primary-foreground/60" : "bg-foreground/40"
              }`} style={{ transition: "width 0.3s" }} />
            </div>
            <p className={`text-[9px] mt-0.5 ${isClient ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
              🎤 ভয়েস মেসেজ
            </p>
          </div>
        </div>
      );
    }
    return <>{m.message}</>;
  };

  return (
    <>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

      {/* Floating Button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, x: -40, opacity: 0 }}
            animate={{ scale: 1, x: 0, opacity: 1 }}
            exit={{ scale: 0, x: -40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
            className="fixed bottom-5 left-5 z-50 flex flex-col items-start"
          >
            {/* Animated Admin Character - appears every 5s */}
            <FloatingCharacter onClick={() => setOpen(true)} />

            {/* Classic round chat button */}
            <motion.button
              onClick={() => setOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" style={{ animationDuration: "2s" }} />
              <span className="absolute -inset-1 rounded-full bg-primary/20 animate-pulse" style={{ animationDuration: "3s" }} />
              <MessageCircle className="h-6 w-6 relative z-10" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center z-20">
                  {unread}
                </span>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-5 left-5 z-50 w-[340px] sm:w-[380px] h-[480px] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header - Enhanced */}
            <div className="relative overflow-hidden px-4 py-3" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))" }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary-foreground">Arodx Support</p>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[10px] text-primary-foreground/80">Online — সাধারণত কয়েক মিনিটে উত্তর</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                    <Minimize2 className="h-4 w-4 text-primary-foreground" />
                  </button>
                  {started && (
                    <button onClick={endChat} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                      <X className="h-4 w-4 text-primary-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            {!started ? (
              <div className="flex-1 flex flex-col p-5 gap-4 overflow-auto">
                {/* Welcome */}
                <div className="text-center space-y-2">
                  <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <img src={aiRobotAvatar} alt="Support" className="h-12 w-12 object-contain" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">আমাদের সাথে চ্যাট করুন 👋</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    যেকোনো প্রশ্ন বা সাহায্যের জন্য আমরা আছি
                  </p>
                </div>

                {/* Support info cards */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">🤖 AI Agent — 24/7</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">তাৎক্ষণিক উত্তর, যেকোনো সময়</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Headphones className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">👨‍💼 Human Agent</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">সকাল ১০টা — রাত ১০টা (বাংলাদেশ সময়)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guest form */}
                {!user && (
                  <div className="space-y-2">
                    <Input
                      placeholder="আপনার নাম"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="text-sm h-9"
                    />
                    <Input
                      placeholder="ফোন নম্বর (যেমন: 01XXXXXXXXX)"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="text-sm h-9"
                      type="tel"
                    />
                  </div>
                )}
                <Button onClick={startChat} className="w-full font-semibold" disabled={!user && (!guestName.trim() || !guestPhone.trim())}>
                  💬 চ্যাট শুরু করুন
                </Button>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                  {messages.map((m) => {
                    if (m.sender_type === "system") {
                      return (
                        <div key={m.id} className="flex justify-center">
                          <div className="bg-muted text-muted-foreground text-xs text-center px-3 py-2 rounded-lg max-w-[90%]">
                            {m.message}
                          </div>
                        </div>
                      );
                    }
                    const isClient = m.sender_type === "client";
                    const sender = getSenderInfo(m);
                    return (
                      <div key={m.id} className={`flex gap-2 ${isClient ? "flex-row-reverse" : "flex-row"}`}>
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarImage src={sender.avatar || undefined} />
                          <AvatarFallback className={`text-[10px] font-bold ${isClient ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}>
                            {sender.isGuest ? <User className="h-3.5 w-3.5" /> : getInitials(sender.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[75%] ${isClient ? "items-end" : "items-start"} flex flex-col`}>
                          <p className={`text-[10px] mb-0.5 ${isClient ? "text-right" : "text-left"} text-muted-foreground`}>{sender.name}</p>
                          <div className={`px-3 py-2 rounded-xl text-sm ${
                            isClient ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-accent text-accent-foreground rounded-tl-sm"
                          }`}>
                            {renderMessageContent(m, isClient)}
                            <p className={`text-[9px] mt-1 ${isClient ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                              {new Date(m.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  <AnimatePresence>
                    {showTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-2 flex-row"
                      >
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarImage src={aiRobotAvatar} />
                          <AvatarFallback className="text-[10px] font-bold bg-accent text-accent-foreground">AX</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start">
                          <p className="text-[10px] mb-0.5 text-muted-foreground">টাইপ করছে...</p>
                          <div className="px-4 py-2.5 rounded-xl bg-accent text-accent-foreground rounded-tl-sm">
                            <div className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1s" }} />
                              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms", animationDuration: "1s" }} />
                              <span className="h-2 w-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms", animationDuration: "1s" }} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Area */}
                {sessionStatus === "closed" ? (
                  <div className="border-t border-border p-3 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">এই চ্যাট বন্ধ হয়ে গেছে।</p>
                    <Button size="sm" variant="outline" className="text-xs" onClick={endChat}>
                      নতুন চ্যাট শুরু করুন
                    </Button>
                  </div>
                ) : (
                  <div className="border-t border-border p-2">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="মেসেজ লিখুন..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 text-sm h-8 border-0 bg-muted/50 focus-visible:ring-0"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className={`h-8 w-8 shrink-0 ${isListening ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={isListening ? stopListening : startListening}
                        disabled={sending}
                      >
                        {isListening ? <Square className="h-3.5 w-3.5 fill-current" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      {input.trim() && (
                        <Button type="submit" size="icon" className="h-8 w-8 shrink-0" disabled={sending}>
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </form>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
