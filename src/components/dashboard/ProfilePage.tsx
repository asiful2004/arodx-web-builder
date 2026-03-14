import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { User as UserType } from "@supabase/supabase-js";
import {
  User, Mail, Calendar, Clock, Edit3, Save, X, Camera, Loader2,
  FileText, Link2, Plus, Trash2, Globe, Instagram, Facebook, Github, Twitter, Linkedin, Youtube, ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardContext {
  user: UserType;
  profile: { full_name: string | null; avatar_url: string | null };
  setProfile: (p: { full_name: string | null; avatar_url: string | null }) => void;
}

interface SocialLink {
  platform: string;
  url: string;
}

const SOCIAL_PLATFORMS = [
  { value: "website", label: "ওয়েবসাইট", icon: Globe },
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "twitter", label: "Twitter / X", icon: Twitter },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin },
  { value: "github", label: "GitHub", icon: Github },
  { value: "youtube", label: "YouTube", icon: Youtube },
];

function getSocialIcon(platform: string) {
  const found = SOCIAL_PLATFORMS.find((p) => p.value === platform);
  return found?.icon || Link2;
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm text-foreground truncate">{value}</p>
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, profile, setProfile } = useOutletContext<DashboardContext>();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const initials = (profile.full_name || user.email || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const joinedDate = new Date(user.created_at).toLocaleDateString("bn-BD", {
    year: "numeric", month: "long", day: "numeric",
  });

  const daysSinceJoin = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Fetch bio & social_links from DB
  useEffect(() => {
    supabase
      .from("profiles")
      .select("bio, social_links")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBio((data as any).bio || "");
          const links = (data as any).social_links;
          setSocialLinks(Array.isArray(links) ? links : []);
        }
        setLoadingExtra(false);
      });
  }, [user.id]);

  const resizeImage = (file: File, maxSize: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // GIFs should not be resized (preserve animation)
      if (file.type === "image/gif") {
        resolve(file);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Crop to square from center, then resize
        const min = Math.min(width, height);
        const sx = (width - min) / 2;
        const sy = (height - min) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize);

        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Resize failed"))),
          "image/webp",
          0.85
        );
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "শুধু ইমেজ ফাইল আপলোড করুন", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "ফাইল সাইজ ১০০MB এর বেশি হতে পারবে না", variant: "destructive" });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return avatarUrl || null;

    setUploading(true);
    try {
      // Resize non-GIF images to 500x500 WebP
      const isGif = avatarFile.type === "image/gif";
      const processedBlob = isGif ? avatarFile : await resizeImage(avatarFile, 500);
      const ext = isGif ? "gif" : "webp";
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, processedBlob, {
          upsert: true,
          contentType: isGif ? "image/gif" : "image/webp",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({ title: "আপলোড ব্যর্থ", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newAvatarUrl = await uploadAvatar();
      if (avatarFile && !newAvatarUrl) {
        setSaving(false);
        return;
      }

      // Filter out empty social links
      const validLinks = socialLinks.filter((l) => l.platform && l.url.trim());

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: newAvatarUrl,
          bio: bio.trim() || null,
          social_links: validLinks,
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;

      setProfile({ full_name: fullName, avatar_url: newAvatarUrl });
      setAvatarUrl(newAvatarUrl || "");
      setSocialLinks(validLinks);
      setAvatarFile(null);
      setAvatarPreview(null);
      setEditing(false);
      toast({ title: "প্রোফাইল আপডেট হয়েছে!" });
    } catch (error: any) {
      toast({ title: "আপডেট ব্যর্থ", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addSocialLink = () => {
    if (socialLinks.length >= 7) return;
    setSocialLinks([...socialLinks, { platform: "website", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: "platform" | "url", value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  const cancelEdit = () => {
    setEditing(false);
    setFullName(profile.full_name || "");
    setAvatarUrl(profile.avatar_url || "");
    setAvatarFile(null);
    setAvatarPreview(null);
    // Re-fetch to restore bio/social from DB
    supabase
      .from("profiles")
      .select("bio, social_links")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setBio((data as any).bio || "");
          const links = (data as any).social_links;
          setSocialLinks(Array.isArray(links) ? links : []);
        }
      });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="h-16 sm:h-20 bg-gradient-primary opacity-15" />
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 -mt-8 sm:-mt-10 flex items-end gap-3 sm:gap-4">
          <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-4 border-card shadow-lg shrink-0">
            <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="text-base sm:text-lg font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="pb-1 min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold font-display text-foreground truncate">
              {profile.full_name || "নাম সেট করুন"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Bio display */}
        {!loadingExtra && bio && !editing && (
          <div className="px-4 sm:px-6 pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
          </div>
        )}

        {/* Social links display */}
        {!loadingExtra && socialLinks.length > 0 && !editing && (
          <div className="px-4 sm:px-6 pb-4 flex flex-wrap gap-2">
            {socialLinks.map((link, i) => {
              const Icon = getSocialIcon(link.platform);
              return (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/50 text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {SOCIAL_PLATFORMS.find((p) => p.value === link.platform)?.label || link.platform}
                </a>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Profile Edit / Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold font-display text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            প্রোফাইল তথ্য
          </h2>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground hover:text-primary gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> এডিট
            </Button>
          )}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Avatar Upload */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">প্রোফাইল ছবি</label>
                  <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Avatar className="w-16 h-16 border-2 border-dashed border-primary/40 group-hover:border-primary transition-colors">
                        <AvatarImage src={avatarPreview || avatarUrl || undefined} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploading ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Camera className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleAvatarSelect}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>ক্লিক করে ছবি আপলোড করুন</p>
                      <p>PNG, JPG, WebP, <strong>GIF</strong> • সর্বোচ্চ ১০০MB</p>
                      <p>সেরা রেজাল্টের জন্য <strong>500×500px</strong> স্কয়ার ইমেজ দিন</p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">পুরো নাম</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="আপনার নাম লিখুন" className="bg-secondary/50 border-border rounded-xl" />
                </div>

                {/* Bio */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> বায়ো
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 300))}
                    placeholder="নিজের সম্পর্কে কিছু লিখুন..."
                    className="bg-secondary/50 border-border rounded-xl resize-none min-h-[80px]"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">{bio.length}/300</p>
                </div>

                {/* Social Links */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" /> সোশ্যাল লিংক
                  </label>
                  <div className="space-y-2">
                    {socialLinks.map((link, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center gap-2"
                      >
                        <Select value={link.platform} onValueChange={(v) => updateSocialLink(i, "platform", v)}>
                          <SelectTrigger className="w-[130px] bg-secondary/50 border-border rounded-xl text-xs h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_PLATFORMS.map((p) => (
                              <SelectItem key={p.value} value={p.value} className="text-xs">
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={link.url}
                          onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                          placeholder="https://..."
                          className="flex-1 bg-secondary/50 border-border rounded-xl text-xs h-9"
                        />
                        <Button
                          variant="ghost" size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeSocialLink(i)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                    {socialLinks.length < 7 && (
                      <Button variant="outline" size="sm" onClick={addSocialLink}
                        className="text-xs gap-1.5 rounded-xl w-full border-dashed">
                        <Plus className="w-3.5 h-3.5" /> লিংক যোগ করুন
                      </Button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} disabled={saving} size="sm"
                    className="gap-1.5 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90">
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-1.5 rounded-xl">
                    <X className="w-3.5 h-3.5" /> বাতিল
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <InfoRow icon={User} label="পুরো নাম" value={profile.full_name || "সেট করা হয়নি"} />
                <InfoRow icon={Mail} label="ইমেইল" value={user.email || ""} />
                <InfoRow icon={FileText} label="বায়ো" value={bio || "সেট করা হয়নি"} />
                <InfoRow icon={Calendar} label="যোগদান" value={joinedDate} />
                <InfoRow icon={Clock} label="সক্রিয়তা" value={`${daysSinceJoin} দিন ধরে সদস্য`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
