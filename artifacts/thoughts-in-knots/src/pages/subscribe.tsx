import { useState, useEffect } from "react";
import { TopNav } from "@/components/top-nav";
import { useSubscribeInitiate } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronDown } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+91", country: "India (IN)" },
  { code: "+1", country: "USA / Canada" },
  { code: "+44", country: "United Kingdom" },
  { code: "+61", country: "Australia" },
  { code: "+65", country: "Singapore" },
  { code: "+971", country: "UAE" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+81", country: "Japan" },
  { code: "+82", country: "South Korea" },
  { code: "+55", country: "Brazil" },
  { code: "+52", country: "Mexico" },
  { code: "+86", country: "China" },
  { code: "+27", country: "South Africa" },
  { code: "+64", country: "New Zealand" },
  { code: "+31", country: "Netherlands" },
  { code: "+34", country: "Spain" },
  { code: "+39", country: "Italy" },
];

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Subscribe() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [region, setRegion] = useState<"IN" | "INTL">("IN");
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [success, setSuccess] = useState(false);
  
  const { toast } = useToast();
  const subscribeInitiateMutation = useSubscribeInitiate();

  useEffect(() => {
    loadRazorpay();
  }, []);

  const handleRegionToggle = (newRegion: "IN" | "INTL") => {
    setRegion(newRegion);
    if (newRegion === "IN") {
      setCountryCode("+91");
    } else if (countryCode === "+91") {
      setCountryCode("+1");
    }
  };

  const handleCodeSelect = (code: string) => {
    setCountryCode(code);
    setShowCodePicker(false);
    if (code !== "+91") {
      setRegion("INTL");
    } else {
      setRegion("IN");
    }
  };

  const getPriceDisplay = () => {
    if (region === "IN") {
      return plan === "monthly" ? "₹150/month" : "₹1,500/year";
    } else {
      return plan === "monthly" ? "$3.99/month" : "$39.99/year";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = `${countryCode}${phoneNumber}`.replace(/\s+/g, "");
    
    subscribeInitiateMutation.mutate({
      data: { email, name, phone, plan, region }
    }, {
      onSuccess: (data) => {
        const options = {
          key: data.razorpayKeyId,
          amount: data.amount,
          currency: data.currency,
          name: "Thoughts in Knots",
          description: `Subscription — ${plan}`,
          order_id: data.razorpayOrderId,
          handler: function (_response: unknown) {
            setSuccess(true);
          },
          prefill: { name, email, contact: phone },
          theme: { color: "#1a1a1a" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Failed to initiate subscription",
          description: error.data?.error || "Please try again later."
        });
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex flex-col relative">
        <TopNav backHref="/archives" />
        <main className="flex-1 flex flex-col px-6 items-center justify-center max-w-md mx-auto w-full text-center">
          <h1 className="text-4xl font-serif mb-6">thank you</h1>
          <p className="font-sans lowercase text-muted-foreground text-sm tracking-wide">
            check your email for an activation link to set your password and access the archives.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative" onClick={() => showCodePicker && setShowCodePicker(false)}>
      <TopNav backHref="/archives" />
      
      <main className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full mt-24 mb-16">
        <h1 className="text-5xl font-serif mb-12 text-center">subscribe</h1>

        <div className="flex justify-center mb-8 gap-4 font-sans text-sm tracking-wide lowercase">
          <button 
            type="button"
            className={`pb-1 border-b transition-colors ${region === "IN" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => handleRegionToggle("IN")}
          >
            india
          </button>
          <button 
            type="button"
            className={`pb-1 border-b transition-colors ${region === "INTL" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => handleRegionToggle("INTL")}
          >
            elsewhere
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-border">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="name"
              className="w-full py-2 bg-transparent focus:outline-none font-sans placeholder:text-muted-foreground/50"
              required
            />
          </div>

          <div className="flex flex-col gap-1 border-b border-border">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email address"
              className="w-full py-2 bg-transparent focus:outline-none font-sans placeholder:text-muted-foreground/50 lowercase"
              required
            />
          </div>

          <div className="flex border-b border-border relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowCodePicker(!showCodePicker); }}
              className="flex items-center gap-1 py-2 pr-3 font-sans text-sm text-foreground bg-transparent focus:outline-none shrink-0"
            >
              <span>{countryCode}</span>
              <ChevronDown size={12} strokeWidth={1.5} className="text-muted-foreground" />
            </button>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="phone number"
              className="flex-1 py-2 bg-transparent focus:outline-none font-sans placeholder:text-muted-foreground/50"
              required
            />
            {showCodePicker && (
              <div
                className="absolute top-full left-0 mt-1 w-60 bg-background border border-border shadow-md z-50 max-h-56 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {COUNTRY_CODES.map(({ code, country }) => (
                  <button
                    key={code + country}
                    type="button"
                    onClick={() => handleCodeSelect(code)}
                    className={`w-full text-left px-4 py-2 font-sans text-sm hover:bg-secondary/30 transition-colors flex items-center gap-3 ${countryCode === code ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    <span className="shrink-0">{code}</span>
                    <span className="text-xs truncate">{country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-4 font-sans text-sm tracking-wide lowercase justify-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="plan" 
                value="monthly" 
                checked={plan === "monthly"}
                onChange={() => setPlan("monthly")}
                className="accent-foreground w-3 h-3"
              />
              <span>monthly</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="plan" 
                value="yearly" 
                checked={plan === "yearly"}
                onChange={() => setPlan("yearly")}
                className="accent-foreground w-3 h-3"
              />
              <span>yearly</span>
            </label>
          </div>

          <div className="text-center font-sans text-sm mt-2 mb-2 text-foreground">
            {getPriceDisplay()}
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <button 
              type="submit"
              disabled={subscribeInitiateMutation.isPending}
              className="w-full py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-sans text-sm tracking-wide lowercase disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {subscribeInitiateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              pay {getPriceDisplay()}
            </button>
          </div>
          
          {region === "IN" && (
            <div className="text-center text-xs text-muted-foreground font-sans lowercase mt-2">
              please note: 18% gst will be added to your transaction.
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
