import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone, Download, Share, Plus, Apple, Chrome } from "lucide-react";
import { toast } from "sonner";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const Install = () => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const installedHandler = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) {
      toast.info("Use your browser menu to add Haruwa to your home screen.");
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      toast.success("Haruwa is installing on your device!");
      setInstalled(true);
    }
    setDeferred(null);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 bg-gradient-to-b from-secondary/40 to-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
              Get the Haruwa App
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Install Haruwa on your phone for a faster, app-like experience. Works on both Android and iOS.
            </p>
          </div>

          <Card className="p-8 mb-6 shadow-card">
            <div className="flex flex-col items-center gap-4">
              <img
                src="/app-icon-512.png"
                alt="Haruwa app icon"
                width={120}
                height={120}
                loading="lazy"
                className="rounded-3xl shadow-lg"
              />
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={handleInstall}
                disabled={installed}
              >
                <Download className="w-5 h-5 mr-2" />
                {installed ? "Installed" : "Install Haruwa"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Free • No app store required • Works offline-ready
              </p>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Chrome className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-lg">Android / Chrome</h3>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Tap the <strong>Install Haruwa</strong> button above.</li>
                <li>Or open the browser menu (⋮) and choose <strong>Install app</strong> / <strong>Add to Home screen</strong>.</li>
                <li>Confirm to add the Haruwa icon to your home screen.</li>
              </ol>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Apple className="w-5 h-5 text-primary" />
                <h3 className="font-display font-semibold text-lg">iPhone / Safari</h3>
              </div>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Tap the <Share className="inline w-4 h-4" /> <strong>Share</strong> icon in Safari.</li>
                <li>Scroll and tap <Plus className="inline w-4 h-4" /> <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right corner.</li>
              </ol>
            </Card>
          </div>

          {(isIOS || isAndroid) && (
            <p className="text-center text-sm text-muted-foreground mt-6">
              Detected: <strong>{isIOS ? "iOS" : "Android"}</strong> — follow the matching steps above.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Install;
