import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Package, CreditCard,
  CheckCircle, Copy, Loader2, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { id: 1, label: "সামারি", icon: Package },
  { id: 2, label: "পেমেন্ট", icon: CreditCard },
  { id: 3, label: "সম্পন্ন", icon: CheckCircle },
];

const paymentMethods = [
  { id: "bkash", name: "bKash", number: "01XXXXXXXXX", color: "#E2136E" },
  { id: "nagad", name: "Nagad", number: "01XXXXXXXXX", color: "#F6921E" },
  { id: "upay", name: "Upay", number: "01XXXXXXXXX", color: "#00A651" },
  { id: "rocket", name: "Rocket", number: "01XXXXXXXXX", color: "#8B2F8B" },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
};

export default function RenewalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const orderId = searchParams.get("order_id") || "";
  const packageName = searchParams.get("package") || "";
  const amount = searchParams.get("amount") || "";
  const billingPeriod = searchParams.get("billing") || "monthly";

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedPayment = paymentMethods.find((m) => m.id === selectedMethod);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("রিনিউ করতে আগে লগইন করুন");
      navigate("/signin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const goNext = () => { setDirection(1); setCurrentStep((s) => Math.min(s + 1, 3)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const goBack = () => { setDirection(-1); setCurrentStep((s) => Math.max(s - 1, 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const copyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast.success("নম্বর কপি হয়েছে!");
  };

  const handleSubmit = async () => {
    if (!transactionId || !selectedMethod || !user) {
      toast.error("পেমেন্ট তথ্য পূরণ করুন");
      return;
    }

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      // Create a renewal order linked to the same business
      const { data: newOrder, error: orderError } = await supabase.from("orders").insert({
        customer_name: profile?.full_name || user.email || "Unknown",
        customer_phone: "",
        customer_email: user.email || null,
        package_name: packageName,
        billing_period: billingPeriod,
        amount: amount,
        payment_method: selectedMethod,
        transaction_id: transactionId,
        user_id: user.id,
      }).select("id").single();

      if (orderError) throw orderError;

      // Link to existing business if original order had one
      if (orderId) {
        const { data: existingBiz } = await supabase
          .from("businesses")
          .select("*")
          .eq("order_id", orderId)
          .single();

        if (existingBiz) {
          await (supabase.from("businesses") as any).insert({
            user_id: user.id,
            order_id: newOrder.id,
            business_name: existingBiz.business_name,
            business_category: existingBiz.business_category,
            business_phone: existingBiz.business_phone,
            business_address: existingBiz.business_address,
            domain_type: existingBiz.domain_type,
            domain_name: existingBiz.domain_name,
          });
        }
      }

      goNext();
    } catch (err) {
      console.error(err);
      toast.error("রিনিউয়াল সাবমিট করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            onClick={() => navigate("/dashboard/orders")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ড্যাশবোর্ডে ফিরুন
          </button>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <span className="text-sm font-display font-bold text-gradient">রিনিউয়াল</span>
          </div>
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
                {currentStep > step.id ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
              </motion.div>
              <span className={`text-xs font-medium ${currentStep >= step.id ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 1: Renewal Summary */}
          {currentStep === 1 && (
            <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-display">রিনিউয়াল সামারি</h2>
                <p className="text-muted-foreground text-sm mt-1">আপনার প্যাকেজ রিনিউ করুন</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-display text-foreground">{packageName} প্যাকেজ</h3>
                    <p className="text-sm text-muted-foreground">
                      {billingPeriod === "monthly" ? "মাসিক" : "বার্ষিক"} রিনিউয়াল
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gradient">{amount}</p>
                    <p className="text-xs text-muted-foreground">/{billingPeriod === "yearly" ? "বছর" : "মাস"}</p>
                  </div>
                </div>

                <div className="h-px bg-border" />

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground">
                    পেমেন্ট কনফার্ম হলে আপনার প্যাকেজ আরও{" "}
                    <strong>{billingPeriod === "monthly" ? "১ মাস" : "১ বছরের"}</strong> জন্য রিনিউ হয়ে যাবে।
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={goNext} className="bg-gradient-primary text-primary-foreground px-8 py-5 font-semibold">
                  পেমেন্ট করুন <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Payment */}
          {currentStep === 2 && (
            <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-display">পেমেন্ট</h2>
                <p className="text-muted-foreground text-sm mt-1">পেমেন্ট মেথড সিলেক্ট করে Send Money করুন</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-card hover:border-primary/20"
                    }`}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: method.color }}>
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl overflow-hidden">
                  <div className="p-5 text-white text-center" style={{ backgroundColor: selectedPayment.color }}>
                    <p className="text-sm opacity-90">{selectedPayment.name} Send Money করুন এই নম্বরে</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <p className="text-2xl font-bold tracking-wider">{selectedPayment.number}</p>
                      <button onClick={() => copyNumber(selectedPayment.number)}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-lg font-bold mt-2">Amount: {amount}</p>
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

              <div className="rounded-xl border border-border bg-card/50 p-5 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">রিনিউয়াল সামারি</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">প্যাকেজ</span>
                    <span className="text-foreground font-medium">{packageName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">বিলিং</span>
                    <span className="text-foreground">{billingPeriod === "monthly" ? "মাসিক" : "বার্ষিক"}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-foreground">মোট</span>
                    <span className="text-gradient">{amount}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={goBack} className="px-6 py-5">
                  <ArrowLeft className="mr-2 w-4 h-4" /> পিছনে
                </Button>
                <Button onClick={handleSubmit} disabled={loading || !selectedMethod || !transactionId}
                  className="bg-gradient-primary text-primary-foreground px-8 py-5 font-semibold">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "রিনিউ কনফার্ম করুন"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success */}
          {currentStep === 3 && (
            <motion.div key="s3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }} className="text-center py-16 space-y-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-primary" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className="text-3xl font-bold font-display">রিনিউয়াল সফল! 🎉</h2>
                <p className="text-muted-foreground mt-3 max-w-md mx-auto">
                  আমরা আপনার পেমেন্ট ভেরিফাই করে শীঘ্রই আপনার প্যাকেজ রিনিউ করে দেবো। ধন্যবাদ!
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="rounded-xl border border-border bg-card p-5 max-w-sm mx-auto text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">প্যাকেজ</span>
                  <span className="font-medium text-foreground">{packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">মোট</span>
                  <span className="font-bold text-gradient">{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">পেমেন্ট</span>
                  <span className="text-foreground capitalize">{selectedMethod}</span>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="flex gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => navigate("/dashboard/orders")} className="px-6 py-5">
                  অর্ডারে ফিরুন
                </Button>
                <Button onClick={() => navigate("/dashboard")}
                  className="bg-gradient-primary text-primary-foreground px-6 py-5">
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
