import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Heart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Constants } from "@/integrations/supabase/types";

const categoryLabels: Record<string, string> = {
  venues: "Venues", photographers: "Photographers", videographers: "Videographers",
  decorators: "Decorators", catering: "Catering", makeup_artists: "Makeup Artists",
  mc_entertainment: "MC & Entertainment", car_hire: "Car Hire",
  sound_lighting: "Sound & Lighting", wedding_planners: "Wedding Planners",
};

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "vendor" ? "vendor" : "login";

  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // Vendor signup
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Kigali");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Google sign-in failed", description: String(error), variant: "destructive" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome back!" });
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupPhone.trim()) {
      toast({ title: "Phone number is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: signupName, phone: signupPhone },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setLoading(false);
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      return;
    }
    // Update profile with phone
    if (authData.user) {
      await supabase.from("profiles").update({ phone: signupPhone }).eq("user_id", authData.user.id);
    }
    setLoading(false);
    toast({ title: "Account created!", description: "You can now sign in." });
    navigate("/");
  };

  const handleVendorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "Phone number is required", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: vendorEmail,
      password: vendorPassword,
      options: {
        data: { full_name: vendorName, phone },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      setLoading(false);
      toast({ title: "Signup failed", description: authError.message, variant: "destructive" });
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      toast({ title: "Please try again" });
      return;
    }

    // Update profile phone
    await supabase.from("profiles").update({ phone }).eq("user_id", userId);

    // Assign vendor role
    await supabase.from("user_roles").insert({ user_id: userId, role: "vendor" as any });

    // Create vendor profile (is_approved defaults to false, admin must approve)
    await supabase.from("vendors").insert({
      user_id: userId,
      business_name: businessName,
      category: category as any,
      location,
      phone,
      description,
      email: vendorEmail,
    });

    setLoading(false);
    toast({
      title: "Vendor request submitted!",
      description: "Your account is pending admin approval. You can access your dashboard to set up your profile.",
    });
    navigate("/vendor-dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Heart className="w-10 h-10 text-primary fill-primary mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-foreground">Afriwedd</h1>
          <p className="text-muted-foreground text-sm mt-1">Plan your dream wedding</p>
        </div>
        <Card>
          <Tabs defaultValue={initialTab}>
            <CardHeader className="pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
                <TabsTrigger value="vendor" className="flex-1">Vendor</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={loading}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign in with Google
                  </Button>
                </form>
              </TabsContent>

              {/* Client Signup */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={signupName} onChange={e => setSignupName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={signupPhone} onChange={e => setSignupPhone(e.target.value)} required placeholder="+250..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={signupEmail} onChange={e => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                  </div>
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn} disabled={loading}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Sign up with Google
                  </Button>
                </form>
              </TabsContent>

              {/* Vendor Signup */}
              <TabsContent value="vendor">
                <form onSubmit={handleVendorSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Full Name</Label>
                    <Input value={vendorName} onChange={e => setVendorName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input value={businessName} onChange={e => setBusinessName(e.target.value)} required placeholder="e.g. Kigali Photography Studio" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {Constants.public.Enums.vendor_category.map(cat => (
                          <SelectItem key={cat} value={cat}>{categoryLabels[cat] || cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={location} onChange={e => setLocation(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+250..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={vendorEmail} onChange={e => setVendorEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={vendorPassword} onChange={e => setVendorPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>Business Description</Label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell clients about your services..." rows={3} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting request..." : "Apply as Vendor"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Your application will be reviewed by our admin team.</p>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
