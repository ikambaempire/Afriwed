import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, DollarSign, ListChecks, CalendarHeart,
  Plus, Trash2, ShoppingBag, Pencil
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  done: boolean;
}

interface BudgetItem {
  id: string;
  name: string;
  estimated: number;
  actual: number;
}

const defaultChecklist: ChecklistItem[] = [
  { id: "1", label: "Book wedding venue", category: "Venue", done: false },
  { id: "2", label: "Hire photographer", category: "Photography", done: false },
  { id: "3", label: "Hire videographer", category: "Videography", done: false },
  { id: "4", label: "Book catering service", category: "Catering", done: false },
  { id: "5", label: "Hire decorator / florist", category: "Decoration", done: false },
  { id: "6", label: "Book makeup artist", category: "Beauty", done: false },
  { id: "7", label: "Hire MC / entertainment", category: "Entertainment", done: false },
  { id: "8", label: "Book car hire", category: "Transport", done: false },
  { id: "9", label: "Arrange sound & lighting", category: "Sound", done: false },
  { id: "10", label: "Hire wedding planner", category: "Planning", done: false },
  { id: "11", label: "Order wedding cake", category: "Catering", done: false },
  { id: "12", label: "Buy wedding rings", category: "Shopping", done: false },
  { id: "13", label: "Order wedding dress / suit", category: "Shopping", done: false },
  { id: "14", label: "Design & send invitations", category: "Stationery", done: false },
  { id: "15", label: "Plan honeymoon", category: "Travel", done: false },
  { id: "16", label: "Book bridal party attire", category: "Shopping", done: false },
  { id: "17", label: "Arrange guest transport", category: "Transport", done: false },
  { id: "18", label: "Book hotel rooms for guests", category: "Accommodation", done: false },
  { id: "19", label: "Get marriage license", category: "Legal", done: false },
  { id: "20", label: "Plan reception program", category: "Planning", done: false },
];

const defaultBudget: BudgetItem[] = [
  { id: "1", name: "Venue", estimated: 1500000, actual: 0 },
  { id: "2", name: "Photography", estimated: 500000, actual: 0 },
  { id: "3", name: "Videography", estimated: 400000, actual: 0 },
  { id: "4", name: "Catering", estimated: 2000000, actual: 0 },
  { id: "5", name: "Decoration", estimated: 800000, actual: 0 },
  { id: "6", name: "Makeup & Beauty", estimated: 300000, actual: 0 },
  { id: "7", name: "Entertainment / MC", estimated: 250000, actual: 0 },
  { id: "8", name: "Car Hire", estimated: 400000, actual: 0 },
  { id: "9", name: "Sound & Lighting", estimated: 350000, actual: 0 },
  { id: "10", name: "Wedding Cake", estimated: 200000, actual: 0 },
  { id: "11", name: "Wedding Attire", estimated: 600000, actual: 0 },
  { id: "12", name: "Invitations", estimated: 150000, actual: 0 },
  { id: "13", name: "Rings", estimated: 300000, actual: 0 },
  { id: "14", name: "Honeymoon", estimated: 500000, actual: 0 },
  { id: "15", name: "Miscellaneous", estimated: 250000, actual: 0 },
];

const Planning = () => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem("haruwa-checklist");
    return saved ? JSON.parse(saved) : defaultChecklist;
  });
  const [budget, setBudget] = useState<BudgetItem[]>(() => {
    const saved = localStorage.getItem("haruwa-budget");
    return saved ? JSON.parse(saved) : defaultBudget;
  });
  const [totalBudget, setTotalBudget] = useState<number>(() => {
    const saved = localStorage.getItem("haruwa-total-budget");
    return saved ? parseInt(saved) : 8500000;
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newBudgetName, setNewBudgetName] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");

  const saveChecklist = (items: ChecklistItem[]) => {
    setChecklist(items);
    localStorage.setItem("haruwa-checklist", JSON.stringify(items));
  };

  const saveBudget = (items: BudgetItem[]) => {
    setBudget(items);
    localStorage.setItem("haruwa-budget", JSON.stringify(items));
  };

  const saveTotalBudget = (amount: number) => {
    setTotalBudget(amount);
    localStorage.setItem("haruwa-total-budget", String(amount));
  };

  const toggleItem = (id: string) => {
    saveChecklist(checklist.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    const item: ChecklistItem = { id: Date.now().toString(), label: newItem.trim(), category: "Custom", done: false };
    saveChecklist([...checklist, item]);
    setNewItem("");
  };

  const removeChecklistItem = (id: string) => {
    saveChecklist(checklist.filter(i => i.id !== id));
  };

  const updateBudgetActual = (id: string, actual: number) => {
    saveBudget(budget.map(b => b.id === id ? { ...b, actual } : b));
  };

  const addBudgetItem = () => {
    if (!newBudgetName.trim() || !newBudgetAmount) return;
    const item: BudgetItem = { id: Date.now().toString(), name: newBudgetName.trim(), estimated: parseInt(newBudgetAmount), actual: 0 };
    saveBudget([...budget, item]);
    setNewBudgetName("");
    setNewBudgetAmount("");
  };

  const removeBudgetItem = (id: string) => {
    saveBudget(budget.filter(b => b.id !== id));
  };

  const completedCount = checklist.filter(i => i.done).length;
  const completionPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
  const totalEstimated = budget.reduce((s, b) => s + b.estimated, 0);
  const totalActual = budget.reduce((s, b) => s + b.actual, 0);
  const budgetPercent = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0;

  const categories = [...new Set(checklist.map(i => i.category))];

  return (
    <>
      <Header />
      <main className="pt-20 pb-16 bg-background min-h-screen">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Wedding Planning Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track your checklist, budget, and vendors</p>
          </motion.div>

          {/* Overview stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ListChecks className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Checklist</p>
                    <p className="text-xl font-bold text-foreground">{completedCount}/{checklist.length}</p>
                  </div>
                </div>
                <Progress value={completionPercent} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget Spent</p>
                    <p className="text-xl font-bold text-foreground">{budgetPercent}%</p>
                  </div>
                </div>
                <Progress value={budgetPercent} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-8 h-8 text-accent" />
                  <div className="flex items-center gap-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Budget</p>
                      {editingBudget ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={tempBudget}
                            onChange={e => setTempBudget(e.target.value)}
                            className="h-7 w-28 text-sm"
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                saveTotalBudget(parseInt(tempBudget) || totalBudget);
                                setEditingBudget(false);
                                toast({ title: "Budget updated!" });
                              }
                            }}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                            saveTotalBudget(parseInt(tempBudget) || totalBudget);
                            setEditingBudget(false);
                            toast({ title: "Budget updated!" });
                          }}>✓</Button>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-foreground cursor-pointer" onClick={() => { setTempBudget(String(totalBudget)); setEditingBudget(true); }}>
                          {totalBudget.toLocaleString()} RWF <Pencil className="w-3 h-3 inline text-muted-foreground" />
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CalendarHeart className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="text-xl font-bold text-foreground">{(totalBudget - totalActual).toLocaleString()} RWF</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="checklist" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="checklist">Wedding Checklist</TabsTrigger>
              <TabsTrigger value="budget">Budget Tracker</TabsTrigger>
              <TabsTrigger value="vendors">Find Vendors</TabsTrigger>
            </TabsList>

            {/* Checklist Tab */}
            <TabsContent value="checklist">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Things to Buy & Do
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add a new item..." onKeyDown={e => e.key === "Enter" && addChecklistItem()} />
                    <Button onClick={addChecklistItem} size="icon"><Plus className="w-4 h-4" /></Button>
                  </div>
                  {categories.map(cat => {
                    const items = checklist.filter(i => i.category === cat);
                    const catDone = items.filter(i => i.done).length;
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="font-semibold text-foreground text-sm">{cat}</h3>
                          <Badge variant="secondary" className="text-xs">{catDone}/{items.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg group">
                              <Checkbox checked={item.done} onCheckedChange={() => toggleItem(item.id)} />
                              <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
                              <button onClick={() => removeChecklistItem(item.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Budget Tracker
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input value={newBudgetName} onChange={e => setNewBudgetName(e.target.value)} placeholder="Item name..." className="flex-1" />
                    <Input type="number" value={newBudgetAmount} onChange={e => setNewBudgetAmount(e.target.value)} placeholder="Estimated RWF" className="w-40" />
                    <Button onClick={addBudgetItem} size="icon"><Plus className="w-4 h-4" /></Button>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Spent: {totalActual.toLocaleString()} RWF</span>
                      <span className="text-foreground font-semibold">Budget: {totalBudget.toLocaleString()} RWF</span>
                    </div>
                    <Progress value={budgetPercent} className="h-3" />
                    {totalActual > totalBudget && (
                      <p className="text-destructive text-xs mt-2 font-medium">⚠️ Over budget by {(totalActual - totalBudget).toLocaleString()} RWF</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {budget.map(b => {
                      const pct = b.estimated > 0 ? Math.round((b.actual / b.estimated) * 100) : 0;
                      return (
                        <div key={b.id} className="p-4 bg-muted rounded-lg group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground text-sm">{b.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Est: {b.estimated.toLocaleString()}</span>
                              <button onClick={() => removeBudgetItem(b.id)} className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input type="number" value={b.actual || ""} onChange={e => updateBudgetActual(b.id, parseInt(e.target.value) || 0)} placeholder="Actual spent" className="w-40 h-8 text-sm" />
                            <Progress value={Math.min(pct, 100)} className="flex-1 h-2" />
                            <span className={`text-xs font-medium ${pct > 100 ? "text-destructive" : "text-muted-foreground"}`}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vendors Tab */}
            <TabsContent value="vendors">
              <Card>
                <CardHeader><CardTitle className="text-lg">Find & Book Vendors</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-6">Browse our marketplace to find the perfect vendors for each part of your wedding.</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Venues", emoji: "🏛️" }, { name: "Photographers", emoji: "📸" },
                      { name: "Catering", emoji: "🍽️" }, { name: "Decorators", emoji: "🎨" },
                      { name: "Makeup Artists", emoji: "💄" }, { name: "MC & Entertainment", emoji: "🎤" },
                      { name: "Car Hire", emoji: "🚗" }, { name: "Sound & Lighting", emoji: "🔊" },
                      { name: "Wedding Planners", emoji: "📋" },
                    ].map(cat => (
                      <Link key={cat.name} to={`/vendors?category=${cat.name}`} className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-accent/10 transition-colors">
                        <span className="text-2xl">{cat.emoji}</span>
                        <div><p className="font-medium text-foreground text-sm">{cat.name}</p><p className="text-xs text-muted-foreground">Browse →</p></div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Planning;
