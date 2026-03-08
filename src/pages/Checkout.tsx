import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Package, Building2, CreditCard,
  CheckCircle, Copy, Loader2, Globe, Search, X, AlertCircle, Upload, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { id: 1, label: "প্যাকেজ", icon: Package },
  { id: 2, label: "ব্যবসা", icon: Building2 },
  { id: 3, label: "পেমেন্ট", icon: CreditCard },
  { id: 4, label: "সম্পন্ন", icon: CheckCircle },
];

const paymentMethods = [
  { id: "bkash", name: "bKash", number: "01XXXXXXXXX", color: "#E2136E" },
  { id: "nagad", name: "Nagad", number: "01XXXXXXXXX", color: "#F6921E" },
  { id: "upay", name: "Upay", number: "01XXXXXXXXX", color: "#00A651" },
  { id: "rocket", name: "Rocket", number: "01XXXXXXXXX", color: "#8B2F8B" },
];

const businessCategories = [
  "E-commerce",
  "Restaurant / Food",
  "Fashion & Clothing",
  "Health & Beauty",
  "Education",
  "Real Estate",
  "Technology",
  "Service Provider",
  "Freelancer / Portfolio",
  "Other",
];

const packageInfo: Record<string, { features: string[]; description: string; hasDomain: boolean }> = {
  Starter: {
    description: "ছোট ব্যবসার জন্য পারফেক্ট শুরু",
    hasDomain: false,
    features: [
      "Website + ১টি Landing Page (Hosting সহ)",
      "Basic Maintenance & Support",
      "মাসে ২টি Video Edit",
      "Basic SEO Setup",
      "১টি Social Media Management",
      "Basic Brand Guidelines",
    ],
  },
  Business: {
    description: "গ্রোয়িং ব্যবসার জন্য সেরা চয়েস",
    hasDomain: false,
    features: [
      "Website + ৫টি Landing Page (Hosting সহ)",
      "Full Maintenance & Technical Support",
      "মাসে ৫টি Video Edit",
      "Advanced SEO + Ad Campaign",
      "৩টি Social Media Management",
      "Brand Strategy & Logo Optimization",
      "Monthly Graphics Package",
      "Basic Business Automation",
    ],
  },
  Enterprise: {
    description: "বড় ব্র্যান্ড ও কোম্পানির জন্য",
    hasDomain: true,
    features: [
      "Website + ১০টি Landing Page (Hosting সহ)",
      "Free .com Domain (১ বছরের জন্য)",
      "Priority Technical Support & Maintenance",
      "Unlimited Video Editing",
      "Complete Digital Marketing (SEO, Ads, Organic)",
      "All Social Media Management",
      "Complete Brand Identity & Strategy",
      "Premium Graphics & UI/UX Design",
      "Advanced Business Automation",
      "Dedicated Account Manager",
    ],
  },
};

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -40 : 40, opacity: 0 }),
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const packageName = searchParams.get("package") || "Starter";
  const amount = searchParams.get("amount") || "0";
  const currency = searchParams.get("currency") || "৳";
  const billingPeriod = searchParams.get("billing") || "monthly";

  const pkg = packageInfo[packageName];

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const [businessData, setBusinessData] = useState({
    businessName: "",
    businessCategory: "",
    businessPhone: "",
    businessAddress: "",
    domainType: pkg?.hasDomain ? "package" : "own" as "own" | "package",
    domainName: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [domainCheck, setDomainCheck] = useState<{
    checking: boolean;
    result: null | { domain: string; available: boolean; checked: boolean };
  }>({ checking: false, result: null });

  const selectedPayment = paymentMethods.find((m) => m.id === selectedMethod);

  // Redirect to signin if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("প্যাকেজ কিনতে আগে লগইন করুন");
      navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = () => {
    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast.success("নম্বর কপি হয়েছে!");
  };

  const checkDomain = useCallback(async (domainName: string) => {
    if (!domainName || domainName.length < 3) {
      setDomainCheck({ checking: false, result: null });
      return;
    }
    setDomainCheck({ checking: true, result: null });
    try {
      const { data, error } = await supabase.functions.invoke("check-domain", {
        body: { domain: domainName },
      });
      if (error) throw error;
      setDomainCheck({ checking: false, result: data });
    } catch {
      setDomainCheck({ checking: false, result: null });
    }
  }, []);

  const handleSubmit = async () => {
    if (!transactionId || !selectedMethod) {
      toast.error("পেমেন্ট তথ্য পূরণ করুন");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile for name/phone
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Insert order
      const { data: order, error: orderError } = await supabase.from("orders").insert({
        customer_name: profile?.full_name || user.email || "Unknown",
        customer_phone: businessData.businessPhone,
        customer_email: user.email || null,
        package_name: packageName,
        billing_period: billingPeriod,
        amount: `${currency}${amount}`,
        payment_method: selectedMethod,
        transaction_id: transactionId,
        user_id: user.id,
      }).select("id").single();

      if (orderError) throw orderError;

      // Upload logo
      let logoUrl: string | null = null;
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${user.id}/${order.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("business-logos")
          .upload(filePath, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("business-logos").getPublicUrl(filePath);
        logoUrl = urlData.publicUrl;
      }

      // Insert business
      const { error: bizError } = await supabase.from("businesses" as any).insert({
        user_id: user.id,
        order_id: order.id,
        business_name: businessData.businessName,
        business_category: businessData.businessCategory,
        business_phone: businessData.businessPhone,
        business_address: businessData.businessAddress || null,
        domain_type: businessData.domainType,
        domain_name: businessData.domainName || null,
        logo_url: logoUrl,
      } as any);

      if (bizError) throw bizError;

      goNext();
    } catch (err) {
      console.error(err);
      toast.error("অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton top bar */}
        <div className="border-b border-border bg-card/50 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Skeleton stepper */}
          <div className="flex items-center justify-between mb-12">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="h-3 w-12 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
          {/* Skeleton content */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="h-7 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse" />
            <div className="space-y-3 mt-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-4 rounded bg-muted animate-pulse" style={{ width: `${90 - i * 10}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            হোমে ফিরুন
          </button>
          <span className="text-sm font-display font-bold text-gradient">Arodx</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-5 left-0 right-0 h-[2px] bg-border mx-10" />
          <motion.div
            className="absolute top-5 left-0 h-[2px] bg-primary mx-10 origin-left"
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ maxWidth: "calc(100% - 5rem)" }}
          />
          {steps.map((step) => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  currentStep >= step.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground"
                }`}
                animate={currentStep === step.id ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </motion.div>
              <span
                className={`text-xs font-medium ${
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: Package Summary */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold font-display">প্যাকেজ সামারি</h2>
                <p className="text-muted-foreground text-sm mt-1">আপনার সিলেক্ট করা প্যাকেজের বিস্তারিত</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-display text-foreground">{packageName}</h3>
                    <p className="text-sm text-muted-foreground">{pkg?.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gradient">{currency}{amount}</p>
                    <p className="text-xs text-muted-foreground">/{billingPeriod === "yearly" ? "বছর" : "মাস"}</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="space-y-2.5">
                  <p className="text-sm font-semibold text-foreground">অন্তর্ভুক্ত ফিচারসমূহ:</p>
                  {pkg?.features.map((f, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={goNext} className="bg-gradient-primary text-primary-foreground px-8 py-5 font-semibold">
                  পরবর্তী <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Business Information */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold font-display">ব্যবসার তথ্য</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  আপনার ব্যবসা সম্পর্কে কিছু প্রয়োজনীয় তথ্য দিন
                </p>
              </div>

              {/* Logged in user info badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">লগইন হিসেবে: </span>
                  <span className="font-medium text-foreground">{user.email}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                {/* Business Name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">ব্যবসার নাম *</label>
                  <Input
                    placeholder="যেমন: My Fashion Store"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                    className="bg-background border-border h-12"
                  />
                </div>

                {/* Business Logo */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">ব্যবসার লোগো *</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <div className="relative w-20 h-20 rounded-xl border-2 border-primary/20 overflow-hidden bg-secondary/50 shrink-0">
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/30 shrink-0">
                        <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("ফাইল সাইজ ৫MB এর বেশি হতে পারবে না");
                                return;
                              }
                              setLogoFile(file);
                              setLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <p>PNG, JPG, SVG বা WEBP</p>
                      <p>সর্বোচ্চ ৫MB</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">ব্যবসার ক্যাটাগরি *</label>
                  <select
                    value={businessData.businessCategory}
                    onChange={(e) => setBusinessData({ ...businessData, businessCategory: e.target.value })}
                    className="w-full h-12 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="" disabled>ক্যাটাগরি সিলেক্ট করুন</option>
                    {businessCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Business Phone */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">ব্যবসার ফোন নম্বর *</label>
                  <Input
                    placeholder="01XXXXXXXXX"
                    value={businessData.businessPhone}
                    onChange={(e) => setBusinessData({ ...businessData, businessPhone: e.target.value })}
                    className="bg-background border-border h-12"
                  />
                </div>

                {/* Business Address */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    ব্যবসার ঠিকানা <span className="text-muted-foreground">(ঐচ্ছিক)</span>
                  </label>
                  <Input
                    placeholder="যেমন: ঢাকা, বাংলাদেশ"
                    value={businessData.businessAddress}
                    onChange={(e) => setBusinessData({ ...businessData, businessAddress: e.target.value })}
                    className="bg-background border-border h-12"
                  />
                </div>
              </div>

              {/* Domain Section */}
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">ডোমেইন সেটআপ</h3>
                </div>

                <div className="space-y-3">
                  {/* Option: Own domain */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      businessData.domainType === "own"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="domainType"
                      value="own"
                      checked={businessData.domainType === "own"}
                      onChange={() => setBusinessData({ ...businessData, domainType: "own", domainName: "" })}
                      className="mt-1 accent-[hsl(190,90%,50%)]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">আমার নিজের ডোমেইন আছে</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        আপনার existing domain দিয়ে ওয়েবসাইট সেটআপ করা হবে
                      </p>
                      {businessData.domainType === "own" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3"
                        >
                          <Input
                            placeholder="yourdomain.com"
                            value={businessData.domainName}
                            onChange={(e) => setBusinessData({ ...businessData, domainName: e.target.value })}
                            className="bg-background border-border h-10 text-sm"
                          />
                        </motion.div>
                      )}
                    </div>
                  </label>

                  {/* Option: Package domain */}
                  <label
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      businessData.domainType === "package"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="domainType"
                      value="package"
                      checked={businessData.domainType === "package"}
                      onChange={() => setBusinessData({ ...businessData, domainType: "package", domainName: "" })}
                      className="mt-1 accent-[hsl(190,90%,50%)]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">প্যাকেজের সাথে ডোমেইন নিতে চাই</p>
                        {pkg?.hasDomain && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            ফ্রি .com!
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pkg?.hasDomain
                          ? "আপনার Enterprise প্যাকেজে ১ বছরের জন্য একটি ফ্রি .com ডোমেইন অন্তর্ভুক্ত"
                          : "পরবর্তীতে আমাদের টিম আপনার সাথে যোগাযোগ করে ডোমেইন সেটআপ করবে"
                        }
                      </p>
                      {businessData.domainType === "package" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 space-y-3"
                        >
                          <div className="flex gap-2">
                            <Input
                              placeholder="mybusiness.com"
                              value={businessData.domainName}
                              onChange={(e) => {
                                setBusinessData({ ...businessData, domainName: e.target.value });
                                setDomainCheck({ checking: false, result: null });
                              }}
                              className="bg-background border-border h-10 text-sm flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => checkDomain(businessData.domainName)}
                              disabled={domainCheck.checking || !businessData.domainName || businessData.domainName.length < 3}
                              className="h-10 px-4 bg-gradient-primary text-primary-foreground"
                            >
                              {domainCheck.checking ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <><Search className="w-4 h-4 mr-1" /> চেক</>
                              )}
                            </Button>
                          </div>

                          {/* Domain check result */}
                          <AnimatePresence mode="wait">
                            {domainCheck.result && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                                  domainCheck.result.available
                                    ? "bg-green-500/10 border border-green-500/20"
                                    : "bg-destructive/10 border border-destructive/20"
                                }`}
                              >
                                {domainCheck.result.available ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                    <span className="text-green-500 font-medium">
                                      {domainCheck.result.domain} — available! ✨
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 text-destructive shrink-0" />
                                    <span className="text-destructive font-medium">
                                      {domainCheck.result.domain} — already taken
                                    </span>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            ফাইনাল availability আমাদের টিম কনফার্ম করবে
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={goBack} className="px-6 py-5">
                  <ArrowLeft className="mr-2 w-4 h-4" /> পিছনে
                </Button>
                <Button
                  onClick={() => {
                    if (!businessData.businessName || !businessData.businessCategory || !businessData.businessPhone) {
                      toast.error("ব্যবসার নাম, ক্যাটাগরি ও ফোন নম্বর দিতে হবে");
                      return;
                    }
                    if (!logoFile) {
                      toast.error("ব্যবসার লোগো আপলোড করুন");
                      return;
                    }
                    if (businessData.domainType === "own" && !businessData.domainName) {
                      toast.error("আপনার ডোমেইন নাম লিখুন");
                      return;
                    }
                    goNext();
                  }}
                  className="bg-gradient-primary text-primary-foreground px-8 py-5 font-semibold"
                >
                  পরবর্তী <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Payment */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold font-display">পেমেন্ট</h2>
                <p className="text-muted-foreground text-sm mt-1">পেমেন্ট মেথড সিলেক্ট করুন এবং ট্রানজেকশন সম্পন্ন করুন</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/20"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: method.color }}
                    >
                      {method.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.number}</p>
                    </div>
                  </button>
                ))}
              </div>

              {selectedPayment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl overflow-hidden"
                >
                  <div className="p-5 text-white text-center" style={{ backgroundColor: selectedPayment.color }}>
                    <p className="text-sm opacity-90">{selectedPayment.name} Send Money করুন এই নম্বরে</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <p className="text-2xl font-bold tracking-wider">{selectedPayment.number}</p>
                      <button
                        onClick={() => copyNumber(selectedPayment.number)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-lg font-bold mt-2">Amount: {currency}{amount}</p>
                  </div>
                  <div className="p-5 bg-card border border-t-0 border-border rounded-b-xl space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Transaction ID / TrxID *</label>
                      <Input
                        placeholder="আপনার ট্রানজেকশন আইডি লিখুন"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="bg-background border-border h-12"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Order summary */}
              <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">অর্ডার সামারি</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">প্যাকেজ</span>
                    <span className="text-foreground font-medium">{packageName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ব্যবসা</span>
                    <span className="text-foreground">{businessData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">বিলিং</span>
                    <span className="text-foreground capitalize">{billingPeriod}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-foreground">মোট</span>
                    <span className="text-gradient">{currency}{amount}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={goBack} className="px-6 py-5">
                  <ArrowLeft className="mr-2 w-4 h-4" /> পিছনে
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !selectedMethod || !transactionId}
                  className="bg-gradient-primary text-primary-foreground px-8 py-5 font-semibold"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "অর্ডার কনফার্ম করুন"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Success */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-center py-16 space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-10 h-10 text-primary" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-3xl font-bold font-display">অর্ডার সফলভাবে জমা হয়েছে! 🎉</h2>
                <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                  আমরা আপনার পেমেন্ট ভেরিফাই করে শীঘ্রই যোগাযোগ করবো। ধন্যবাদ আমাদের উপর আস্থা রাখার জন্য।
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl border border-border bg-card p-5 max-w-sm mx-auto text-left space-y-2 text-sm"
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">প্যাকেজ</span>
                  <span className="font-medium text-foreground">{packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ব্যবসা</span>
                  <span className="text-foreground">{businessData.businessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">মোট</span>
                  <span className="font-bold text-gradient">{currency}{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">পেমেন্ট</span>
                  <span className="text-foreground capitalize">{selectedMethod}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex gap-3 justify-center pt-4"
              >
                <Button variant="outline" onClick={() => navigate("/")} className="px-6 py-5">
                  হোমে ফিরুন
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-gradient-primary text-primary-foreground px-6 py-5"
                >
                  ড্যাশবোর্ডে যান
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
