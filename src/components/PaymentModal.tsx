import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, CheckCircle, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const paymentMethods = [
  { id: "bkash", name: "bKash", number: "01XXXXXXXXX", color: "#E2136E" },
  { id: "nagad", name: "Nagad", number: "01XXXXXXXXX", color: "#F6921E" },
  { id: "upay", name: "Upay", number: "01XXXXXXXXX", color: "#00A651" },
  { id: "rocket", name: "Rocket", number: "01XXXXXXXXX", color: "#8B2F8B" },
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
  amount: string;
  currency: string;
  billingPeriod: string;
}

const PaymentModal = ({
  isOpen,
  onClose,
  packageName,
  amount,
  currency,
  billingPeriod,
}: PaymentModalProps) => {
  const [step, setStep] = useState<"method" | "details" | "success">("method");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    transactionId: "",
  });
  const [loading, setLoading] = useState(false);

  const selectedPayment = paymentMethods.find((m) => m.id === selectedMethod);

  const copyNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast.success("নম্বর কপি হয়েছে!");
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.transactionId || !selectedMethod) {
      toast.error("সব তথ্য পূরণ করুন");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("orders").insert({
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email || null,
        package_name: packageName,
        billing_period: billingPeriod,
        amount: `${currency}${amount}`,
        payment_method: selectedMethod,
        transaction_id: formData.transactionId,
      });

      if (error) throw error;

      setStep("success");
    } catch (err) {
      toast.error("অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("method");
    setSelectedMethod(null);
    setFormData({ name: "", phone: "", email: "", transactionId: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-lg font-bold font-display">
                  {step === "success" ? "অর্ডার সফল!" : `${packageName} প্যাকেজ`}
                </h3>
                {step !== "success" && (
                  <p className="text-sm text-muted-foreground">
                    {currency}{amount}/{billingPeriod === "yearly" ? "year" : "month"}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {step === "method" && (
                  <motion.div
                    key="method"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-muted-foreground mb-4">
                      পেমেন্ট মেথড সিলেক্ট করুন
                    </p>
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => {
                          setSelectedMethod(method.id);
                          setStep("details");
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/30 bg-background hover:bg-muted/50 transition-all group"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: method.color }}
                        >
                          {method.name.charAt(0)}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-foreground">{method.name}</p>
                          <p className="text-xs text-muted-foreground">{method.number}</p>
                        </div>
                        <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </motion.div>
                )}

                {step === "details" && selectedPayment && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* Payment instruction */}
                    <div
                      className="p-4 rounded-xl text-white text-center"
                      style={{ backgroundColor: selectedPayment.color }}
                    >
                      <p className="text-sm opacity-90">
                        {selectedPayment.name} Send Money করুন এই নম্বরে
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <p className="text-2xl font-bold tracking-wider">
                          {selectedPayment.number}
                        </p>
                        <button
                          onClick={() => copyNumber(selectedPayment.number)}
                          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-lg font-bold mt-2">
                        Amount: {currency}{amount}
                      </p>
                    </div>

                    {/* Form */}
                    <div className="space-y-3">
                      <Input
                        placeholder="আপনার নাম *"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="bg-background border-border"
                      />
                      <Input
                        placeholder="ফোন নম্বর *"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="bg-background border-border"
                      />
                      <Input
                        placeholder="ইমেইল (ঐচ্ছিক)"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="bg-background border-border"
                      />
                      <Input
                        placeholder="Transaction ID / TrxID *"
                        value={formData.transactionId}
                        onChange={(e) =>
                          setFormData({ ...formData, transactionId: e.target.value })
                        }
                        className="bg-background border-border"
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep("method")}
                      >
                        পিছনে
                      </Button>
                      <Button
                        className="flex-1 bg-gradient-primary text-primary-foreground"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "অর্ডার কনফার্ম করুন"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                    </motion.div>
                    <div>
                      <h4 className="text-xl font-bold font-display">
                        অর্ডার সফলভাবে জমা হয়েছে!
                      </h4>
                      <p className="text-muted-foreground text-sm mt-2">
                        আমরা আপনার পেমেন্ট ভেরিফাই করে শীঘ্রই যোগাযোগ করব।
                      </p>
                    </div>
                    <Button
                      onClick={handleClose}
                      className="bg-gradient-primary text-primary-foreground"
                    >
                      ঠিক আছে
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
