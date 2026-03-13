import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, Send, User, Clock, X, ArrowLeft, Image, Mic, Square, Pause, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatSession {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count?: number;
  profile_name?: string;
  profile_avatar?: string | null;
}

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

const NOTIF_SOUND_URL = "https://cdn.pixabay.com/audio/2022/12/12/audio_e6a8ede5b1.mp3";

export default function AdminChatPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [senderProfiles, setSenderProfiles] = useState<Map<string, { full_name: string | null; avatar_url: string | null }>>(new Map());

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

  // Voice-to-text (record + AI transcribe)
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    const { data: sessionsData } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!sessionsData) return;

    // Get profile names for user sessions
    const userIds = sessionsData.filter(s => s.user_id).map(s => s.user_id!);
    let profileMap = new Map<string, { full_name: string; avatar_url: string | null }>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      if (profiles) {
        profiles.forEach(p => profileMap.set(p.user_id, { full_name: p.full_name || "", avatar_url: p.avatar_url }));
      }
    }

    // Get last message & unread count per session
    const enriched: ChatSession[] = await Promise.all(
      sessionsData.map(async (s: any) => {
        const { data: lastMsg } = await supabase
          .from("chat_messages")
          .select("message, created_at")
          .eq("session_id", s.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count } = await supabase
          .from("chat_messages")
          .select("*", { count: "exact", head: true })
          .eq("session_id", s.id)
          .eq("sender_type", "client")
          .eq("is_read", false);

        const prof = s.user_id ? profileMap.get(s.user_id) : null;
        return {
          ...s,
          last_message: lastMsg?.message || "",
          unread_count: count || 0,
          profile_name: prof?.full_name || null,
          profile_avatar: prof?.avatar_url || null,
        };
      })
    );

    setSessions(enriched);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch sender profiles for messages
  const fetchMsgProfiles = useCallback(async (msgs: ChatMessage[]) => {
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

  // Fetch messages for active session
  const fetchMessages = useCallback(async () => {
    if (!activeSession) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", activeSession)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as ChatMessage[]);
      fetchMsgProfiles(data as ChatMessage[]);
    }

    // Mark client messages as read
    await supabase
      .from("chat_messages")
      .update({ is_read: true })
      .eq("session_id", activeSession)
      .eq("sender_type", "client")
      .eq("is_read", false);
  }, [activeSession]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime for new messages
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as ChatMessage;
          if (msg.session_id === activeSession) {
            setMessages((prev) => [...prev, msg]);
            if (msg.sender_type === "client") {
              playNotifSound();
              supabase.from("chat_messages").update({ is_read: true }).eq("id", msg.id).then(() => {});
            }
          } else if (msg.sender_type === "client") {
            playNotifSound();
          }
          fetchSessions();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_sessions" },
        () => fetchSessions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeSession, fetchSessions]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const uploadFile = async (file: Blob, ext: string): Promise<string | null> => {
    const fileName = `admin/${activeSession}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(fileName, file);
    if (error) return null;
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const sendReply = async (msgType = "text", attachUrl: string | null = null, text = "") => {
    const messageText = text || input.trim();
    if (msgType === "text" && !messageText) return;
    if (!activeSession || !user || sending) return;
    setSending(true);
    if (msgType === "text") setInput("");

    await supabase.from("chat_messages").insert({
      session_id: activeSession,
      sender_type: "admin",
      sender_id: user.id,
      message: messageText || (msgType === "image" ? "📷 ছবি" : "🎤 ভয়েস মেসেজ"),
      message_type: msgType,
      attachment_url: attachUrl,
    });
    setSending(false);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSession) return;
    const ext = file.name.split(".").pop() || "jpg";
    const url = await uploadFile(file, ext);
    if (url) await sendReply("image", url);
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
    if (playingAudioId === msgId) { audioPlaybackRef.current?.pause(); setPlayingAudioId(null); return; }
    if (audioPlaybackRef.current) audioPlaybackRef.current.pause();
    const audio = new Audio(url);
    audio.onended = () => setPlayingAudioId(null);
    audio.play();
    audioPlaybackRef.current = audio;
    setPlayingAudioId(msgId);
  };

  

  const renderMessageContent = (m: ChatMessage, isAdmin: boolean) => {
    if (m.message_type === "image" && m.attachment_url) {
      return (
        <div className="space-y-1">
          <img src={m.attachment_url} alt="ছবি" className="max-w-full rounded-lg cursor-pointer max-h-48 object-cover" onClick={() => window.open(m.attachment_url!, "_blank")} />
          {m.message && m.message !== "📷 ছবি" && <p>{m.message}</p>}
        </div>
      );
    }
    if (m.message_type === "audio" && m.attachment_url) {
      return (
        <div className="flex items-center gap-2 min-w-[140px]">
          <button onClick={() => toggleAudioPlayback(m.id, m.attachment_url!)} className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? "bg-primary-foreground/20" : "bg-foreground/10"}`}>
            {playingAudioId === m.id ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className={`h-1 rounded-full ${isAdmin ? "bg-primary-foreground/30" : "bg-foreground/20"}`}>
              <div className={`h-1 rounded-full w-0 ${playingAudioId === m.id ? "animate-pulse w-full" : ""} ${isAdmin ? "bg-primary-foreground/60" : "bg-foreground/40"}`} style={{ transition: "width 0.3s" }} />
            </div>
            <p className={`text-[9px] mt-0.5 ${isAdmin ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>🎤 ভয়েস মেসেজ</p>
          </div>
        </div>
      );
    }
    return <>{m.message}</>;
  };

  const closeSession = async (sessionId: string) => {
    await supabase.from("chat_sessions").update({ status: "closed" }).eq("id", sessionId);
    fetchSessions();
    if (activeSession === sessionId) {
      setActiveSession(null);
      setMessages([]);
    }
  };

  const getSessionName = (s: ChatSession) => {
    return s.profile_name || s.guest_name || s.guest_email || "অজানা ব্যবহারকারী";
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const getSenderInfo = (m: ChatMessage) => {
    if (m.sender_type === "admin") {
      const profile = m.sender_id ? senderProfiles.get(m.sender_id) : null;
      return { name: profile?.full_name || "অ্যাডমিন", avatar: profile?.avatar_url || null };
    }
    if (m.sender_type === "client") {
      const profile = m.sender_id ? senderProfiles.get(m.sender_id) : null;
      if (profile) return { name: profile.full_name || "ক্লায়েন্ট", avatar: profile.avatar_url };
      return { name: activeSessionData?.guest_name || activeSessionData?.profile_name || "গেস্ট", avatar: activeSessionData?.profile_avatar || null };
    }
    return { name: "সিস্টেম", avatar: null };
  };

  const activeSessionData = sessions.find(s => s.id === activeSession);

  const showChatArea = isMobile ? !!activeSession : true;
  const showSessionList = isMobile ? !activeSession : true;

  const handleBackToList = () => {
    setActiveSession(null);
    setMessages([]);
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-bold text-foreground mb-4">লাইভ চ্যাট</h1>

      <div className="flex h-[calc(100%-3rem)] border border-border rounded-xl overflow-hidden bg-card">
        {/* Sessions List */}
        {showSessionList && (
          <div className={`${isMobile ? "w-full" : "w-80"} border-r border-border flex flex-col shrink-0`}>
            <div className="p-3 border-b border-border">
              <p className="text-sm font-medium text-foreground">কথোপকথন ({sessions.length})</p>
            </div>
            <ScrollArea className="flex-1">
              {sessions.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">কোনো চ্যাট নেই</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSession(s.id)}
                      className={`w-full text-left px-3 py-3 hover:bg-accent/50 transition-colors ${
                        activeSession === s.id ? "bg-accent" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {getSessionName(s)}
                            </p>
                            {s.status === "closed" && (
                              <Badge variant="secondary" className="text-[10px] h-4">বন্ধ</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {s.last_message || "কোনো মেসেজ নেই"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {new Date(s.created_at).toLocaleString("bn-BD")}
                          </p>
                        </div>
                        {(s.unread_count ?? 0) > 0 && (
                          <span className="shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                            {s.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Chat Area */}
        {showChatArea && (
          <div className="flex-1 flex flex-col min-w-0">
            {!activeSession ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <MessageCircle className="h-12 w-12 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">একটি কথোপকথন সিলেক্ট করুন</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between px-3 py-3 border-b border-border gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isMobile && (
                      <button onClick={handleBackToList} className="p-1 rounded-md hover:bg-accent transition-colors shrink-0">
                        <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={activeSessionData?.profile_avatar || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(activeSessionData ? getSessionName(activeSessionData) : "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activeSessionData ? getSessionName(activeSessionData) : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activeSessionData ? new Date(activeSessionData.created_at).toLocaleString("bn-BD") : ""}
                      </p>
                    </div>
                  </div>
                  {activeSessionData?.status !== "closed" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive shrink-0"
                      onClick={() => closeSession(activeSession)}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> <span className="hidden sm:inline">চ্যাট</span> বন্ধ
                    </Button>
                  )}
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
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

                    const isAdmin = m.sender_type === "admin";
                    const sender = getSenderInfo(m);

                    return (
                      <div key={m.id} className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                          <AvatarImage src={sender.avatar || undefined} />
                          <AvatarFallback className={`text-[10px] font-bold ${
                            isAdmin ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                          }`}>
                            {getInitials(sender.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[75%] md:max-w-[70%] flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                          <p className={`text-[10px] mb-0.5 text-muted-foreground ${isAdmin ? "text-right" : "text-left"}`}>
                            {sender.name}
                          </p>
                          <div
                            className={`px-3 py-2 rounded-xl text-sm ${
                              isAdmin
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-accent text-accent-foreground rounded-tl-sm"
                            }`}
                          >
                            {renderMessageContent(m, isAdmin)}
                            <p className={`text-[9px] mt-1 ${
                              isAdmin ? "text-primary-foreground/60" : "text-muted-foreground/60"
                            }`}>
                              {new Date(m.created_at).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

                {/* Input */}
                {activeSessionData?.status !== "closed" && (
                  <div className="border-t border-border p-2">
                    <form onSubmit={(e) => { e.preventDefault(); sendReply(); }} className="flex items-center gap-1.5">
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
                        placeholder="রিপ্লাই লিখুন..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 text-sm h-8 border-0 bg-muted/50 focus-visible:ring-0"
                        autoFocus
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
          </div>
        )}
      </div>
    </div>
  );
}
