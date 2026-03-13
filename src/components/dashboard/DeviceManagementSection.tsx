import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { User } from "@supabase/supabase-js";
import {
  Monitor, Smartphone, Tablet, Trash2, QrCode, Loader2, X, Camera, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceAuth, getDeviceFingerprint } from "@/hooks/useDeviceAuth";
import { toast } from "@/hooks/use-toast";

interface Device {
  id: string;
  device_name: string;
  browser: string | null;
  os: string | null;
  device_fingerprint: string;
  is_active: boolean;
  last_active: string;
  created_at: string;
}

export default function DeviceManagementSection({ user }: { user: User }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [approving, setApproving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { removeDevice } = useDeviceAuth();
  const currentFingerprint = getDeviceFingerprint();

  const fetchDevices = useCallback(async () => {
    const { data } = await supabase
      .from("user_devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("last_active", { ascending: false });
    if (data) setDevices(data as Device[]);
    setLoadingDevices(false);
  }, [user.id]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRemoveDevice = async (deviceId: string) => {
    setRemovingId(deviceId);
    await removeDevice(deviceId);
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    toast({ title: "ডিভাইস সরানো হয়েছে ✓" });
    setRemovingId(null);
  };

  const getDeviceIcon = (os: string | null) => {
    if (!os) return Monitor;
    if (os === "Android" || os === "iOS") return Smartphone;
    if (os?.includes("iPad")) return Tablet;
    return Monitor;
  };

  const startScanner = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 400, height: 400 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Use BarcodeDetector if available, otherwise manual frame scanning
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        scanIntervalRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const token = barcodes[0].rawValue;
              if (token) {
                stopScanner();
                await approveDevice(token);
              }
            }
          } catch {}
        }, 500);
      } else {
        // Fallback: use canvas + manual input
        toast({
          title: "QR স্ক্যানার সাপোর্ট নেই",
          description: "আপনার ব্রাউজার QR স্ক্যানিং সাপোর্ট করে না। নতুন ডিভাইসের QR কোডের নিচের টোকেন কপি করুন।",
          variant: "destructive",
        });
        stopScanner();
      }
    } catch (err: any) {
      toast({ title: "ক্যামেরা অ্যাক্সেস ব্যর্থ", description: err.message, variant: "destructive" });
      setScanning(false);
    }
  };

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const approveDevice = async (token: string) => {
    setApproving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/approve-device`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ token }),
        }
      );

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Approval failed");
      }

      toast({ title: "ডিভাইস অনুমোদিত হয়েছে ✓" });
      setScannerOpen(false);
      // Refresh devices list
      setTimeout(fetchDevices, 2000);
    } catch (err: any) {
      toast({ title: "অনুমোদন ব্যর্থ", description: err.message, variant: "destructive" });
    }
    setApproving(false);
  };

  // Manual token input
  const [manualToken, setManualToken] = useState("");

  return (
    <div className="space-y-4">
      {/* Device list */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          {devices.length}/৩ ডিভাইস সক্রিয়
        </p>
        <Dialog open={scannerOpen} onOpenChange={(open) => { setScannerOpen(open); if (!open) stopScanner(); }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs">
              <QrCode className="w-3.5 h-3.5" /> ডিভাইস অনুমোদন
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" /> QR কোড স্ক্যান করুন
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!scanning && !approving && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    নতুন ডিভাইসের লগইন পেজে দেখানো QR কোড স্ক্যান করুন
                  </p>
                  <Button onClick={startScanner} className="gap-2">
                    <Camera className="w-4 h-4" /> ক্যামেরা খুলুন
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">অথবা টোকেন দিন</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="QR টোকেন পেস্ট করুন"
                      className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={!manualToken.trim()}
                      onClick={() => approveDevice(manualToken.trim())}
                    >
                      অনুমোদন
                    </Button>
                  </div>
                </div>
              )}
              {scanning && (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    <div className="absolute inset-0 border-2 border-primary/50 rounded-xl" />
                    <div className="absolute inset-[20%] border-2 border-primary rounded-lg animate-pulse" />
                  </div>
                  <Button variant="outline" className="w-full" onClick={stopScanner}>
                    <X className="w-4 h-4 mr-2" /> বন্ধ করুন
                  </Button>
                </div>
              )}
              {approving && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">অনুমোদন করা হচ্ছে...</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingDevices ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          কোনো সক্রিয় ডিভাইস নেই
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.os);
            const isCurrent = device.device_fingerprint === currentFingerprint;
            return (
              <div
                key={device.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isCurrent ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/20"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isCurrent ? "bg-primary/10" : "bg-muted/50"
                }`}>
                  <DeviceIcon className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{device.device_name}</p>
                    {isCurrent && (
                      <Badge variant="outline" className="text-[9px] border-0 bg-green-500/10 text-green-600 px-1.5 py-0 shrink-0">
                        এই ডিভাইস
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    সর্বশেষ সক্রিয়: {new Date(device.last_active).toLocaleDateString("bn-BD", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
                {!isCurrent && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        disabled={removingId === device.id}
                      >
                        {removingId === device.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ডিভাইস সরাতে চান?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{device.device_name}" ডিভাইসটি সরালে সেখান থেকে লগআউট হয়ে যাবে।
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>বাতিল</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemoveDevice(device.id)}>
                          সরান
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            );
          })}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" width={400} height={400} />
    </div>
  );
}
