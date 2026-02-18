import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  venues: "Venues",
  photographers: "Photographers",
  videographers: "Videographers",
  decorators: "Decorators",
  catering: "Catering",
  makeup_artists: "Makeup Artists",
  mc_entertainment: "MC & Entertainment",
  car_hire: "Car Hire",
  sound_lighting: "Sound & Lighting",
  wedding_planners: "Wedding Planners",
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

  // Vendor signup
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("Kigali");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

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
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { full_name: signupName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Signup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link." });
    }
  };

  const handleVendorSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    setLoading(true);

    // 1. Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: vendorEmail,
      password: vendorPassword,
      options: {
        data: { full_name: vendorName },
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
      toast({ title: "Check your email", description: "Confirm your email, then log in to complete vendor setup." });
      return;
    }

    // 2. Assign vendor role
    await supabase.from("user_roles").insert({ user_id: userId, role: "vendor" as any });

    // 3. Create vendor profile
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
      title: "Vendor account created!",
      description: "Check your email to confirm, then log in to access your dashboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Heart className="w-10 h-10 text-primary fill-primary mx-auto mb-3" />
          <h1 className="font-display text-3xl font-bold text-foreground">Haruwa</h1>
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
                      <Label>Phone</Label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+250..." />
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
                    {loading ? "Creating vendor account..." : "Register as Vendor"}
                  </Button>
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
