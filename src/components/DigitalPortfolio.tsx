import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../utils/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "./ui/avatar";
import { Progress } from "./ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import {
  User,
  Star,
  Trophy,
  BookOpen,
  Camera,
  Share2,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Award,
  ChefHat,
  Users,
  Heart,
  MessageSquare,
  Filter,
  Search,
  Calendar,
  ExternalLink,
  Settings,
  Medal,
  RefreshCw,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { PortfolioItemCard } from "./PortfolioItemCard";
import { PortfolioSetup } from "./PortfolioSetup";

interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface PortfolioItem {
  id: string;
  portfolio_id: string;
  type: "recipe" | "achievement" | "certification" | "project";
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
  metadata: any;
  created_at: string;
}

interface Skill {
  id: string;
  user_id: string;
  name: string;
  level: number;
  category: string;
  verified: boolean;
}

interface Achievement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  badge_type: string;
  earned_at: string;
  verified: boolean;
}

export function DigitalPortfolio() {
  const { user, profile } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(
    null,
  );
  const [portfolioItems, setPortfolioItems] = useState<
    PortfolioItem[]
  >([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<
    Achievement[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<PortfolioItem | null>(null);
  const [databaseSetupNeeded, setDatabaseSetupNeeded] =
    useState(false);

  // Form states
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    is_public: true,
  });

  const [itemForm, setItemForm] = useState({
    type: "recipe" as const,
    title: "",
    description: "",
    image_url: "",
    video_url: "",
    metadata: {},
  });

  useEffect(() => {
    if (user) {
      loadPortfolioData();
    }
  }, [user]);

  useEffect(() => {
    if (portfolio) {
      setPortfolioForm({
        title: portfolio.title,
        description: portfolio.description || "",
        is_public: portfolio.is_public,
      });
    }
  }, [portfolio]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);

      // Check if portfolio tables exist by testing a simple query
      const { error: tablesCheckError } = await supabase
        .from("portfolio_items")
        .select("id", { count: "exact", head: true })
        .limit(1);

      // If tables don't exist, show setup message
      if (
        tablesCheckError &&
        (tablesCheckError.code === "PGRST205" ||
          tablesCheckError.code === "42P01")
      ) {
        console.error(
          "Portfolio tables not found:",
          tablesCheckError,
        );
        setDatabaseSetupNeeded(true);
        setLoading(false);
        return;
      }

      // Load or create portfolio
      let { data: portfolioData, error: portfolioError } =
        await supabase
          .from("portfolios")
          .select("*")
          .eq("user_id", user!.id)
          .single();

      if (
        portfolioError &&
        portfolioError.code === "PGRST116"
      ) {
        // Create default portfolio
        const { data: newPortfolio, error: createError } =
          await supabase
            .from("portfolios")
            .insert({
              user_id: user!.id,
              title: `${profile?.full_name || "My"} Culinary Portfolio`,
              description:
                "Showcasing my culinary journey and achievements",
              is_public: true,
            })
            .select()
            .single();

        if (createError) throw createError;
        portfolioData = newPortfolio;
      } else if (portfolioError) {
        throw portfolioError;
      }

      setPortfolio(portfolioData);

      // Load portfolio items
      const { data: itemsData, error: itemsError } =
        await supabase
          .from("portfolio_items")
          .select("*")
          .eq("portfolio_id", portfolioData.id)
          .order("created_at", { ascending: false });

      if (itemsError) throw itemsError;
      setPortfolioItems(itemsData || []);

      // Load skills
      const { data: skillsData, error: skillsError } =
        await supabase
          .from("user_skills")
          .select("*")
          .eq("user_id", user!.id)
          .order("level", { ascending: false });

      if (skillsError) throw skillsError;

      // If user has no skills, create starter skills
      if (skillsData && skillsData.length === 0) {
        await createStarterSkills();
      }

      setSkills(skillsData || []);

      // Load achievements
      const {
        data: achievementsData,
        error: achievementsError,
      } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user!.id)
        .order("earned_at", { ascending: false });

      if (achievementsError) throw achievementsError;

      // If user has no achievements, create welcome achievement
      if (achievementsData && achievementsData.length === 0) {
        await createWelcomeAchievement();
      }

      setAchievements(achievementsData || []);
    } catch (error) {
      console.error("Error loading portfolio data:", error);
      toast.error("Failed to load portfolio data");
    } finally {
      setLoading(false);
    }
  };

  const createStarterSkills = async () => {
    if (!user) return;

    try {
      const starterSkills = [
        {
          user_id: user.id,
          name: "Knife Skills",
          level: 20,
          category: "techniques",
        },
        {
          user_id: user.id,
          name: "Food Safety",
          level: 15,
          category: "fundamentals",
        },
        {
          user_id: user.id,
          name: "Recipe Development",
          level: 10,
          category: "creativity",
        },
        {
          user_id: user.id,
          name: "Flavor Pairing",
          level: 5,
          category: "advanced",
        },
      ];

      const { data, error } = await supabase
        .from("user_skills")
        .insert(starterSkills)
        .select();

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error("Error creating starter skills:", error);
    }
  };

  const createWelcomeAchievement = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          title: "Welcome to ACWhisk!",
          description: "Joined the ACWhisk culinary community",
          badge_type: "milestone",
        })
        .select();

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error(
        "Error creating welcome achievement:",
        error,
      );
    }
  };

  const updatePortfolio = async () => {
    if (!portfolio) return;

    try {
      const { error } = await supabase
        .from("portfolios")
        .update(portfolioForm)
        .eq("id", portfolio.id);

      if (error) throw error;

      setPortfolio({ ...portfolio, ...portfolioForm });
      toast.success("Portfolio updated successfully");
    } catch (error) {
      console.error("Error updating portfolio:", error);
      toast.error("Failed to update portfolio");
    }
  };

  const createPortfolioItem = async () => {
    if (!portfolio) return;

    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .insert({
          portfolio_id: portfolio.id,
          ...itemForm,
        })
        .select()
        .single();

      if (error) throw error;

      setPortfolioItems([data, ...portfolioItems]);
      setItemForm({
        type: "recipe",
        title: "",
        description: "",
        image_url: "",
        video_url: "",
        metadata: {},
      });
      setIsCreateModalOpen(false);
      toast.success("Portfolio item created successfully");
    } catch (error) {
      console.error("Error creating portfolio item:", error);
      toast.error("Failed to create portfolio item");
    }
  };

  const updatePortfolioItem = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from("portfolio_items")
        .update(itemForm)
        .eq("id", editingItem.id);

      if (error) throw error;

      setPortfolioItems(
        portfolioItems.map((item) =>
          item.id === editingItem.id
            ? { ...item, ...itemForm }
            : item,
        ),
      );
      setEditingItem(null);
      setIsEditModalOpen(false);
      toast.success("Portfolio item updated successfully");
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      toast.error("Failed to update portfolio item");
    }
  };

  const deletePortfolioItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setPortfolioItems(
        portfolioItems.filter((item) => item.id !== itemId),
      );
      toast.success("Portfolio item deleted successfully");
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      toast.error("Failed to delete portfolio item");
    }
  };

  const sharePortfolio = async () => {
    if (!portfolio) return;

    const portfolioUrl = `${window.location.origin}/portfolio/${portfolio.id}`;

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({
        title: portfolio.title,
        text: portfolio.description,
        url: portfolioUrl,
      })
    ) {
      try {
        await navigator.share({
          title: portfolio.title,
          text: portfolio.description,
          url: portfolioUrl,
        });
        toast.success("Portfolio shared successfully!");
      } catch (error) {
        // User cancelled sharing or permission denied
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          // Fallback to clipboard
          try {
            await navigator.clipboard.writeText(portfolioUrl);
            toast.success(
              "Portfolio link copied to clipboard!",
            );
          } catch (clipboardError) {
            console.error(
              "Clipboard access denied:",
              clipboardError,
            );
            toast.error(
              "Unable to share or copy link. Please copy manually: " +
                portfolioUrl,
            );
          }
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(portfolioUrl);
        toast.success("Portfolio link copied to clipboard!");
      } catch (error) {
        console.error("Clipboard access denied:", error);
        toast.error(
          "Unable to copy link. Please copy manually: " +
            portfolioUrl,
        );
      }
    }
  };

  const exportPortfolio = async () => {
    if (!portfolio) return;

    try {
      const portfolioData = {
        portfolio,
        items: portfolioItems,
        skills,
        achievements,
        profile: {
          name: profile?.full_name,
          avatar: profile?.avatar_url,
          bio: profile?.bio,
        },
      };

      const dataStr = JSON.stringify(portfolioData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," +
        encodeURIComponent(dataStr);

      const exportFileDefaultName = `${portfolio.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_portfolio.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute(
        "download",
        exportFileDefaultName,
      );
      linkElement.click();

      toast.success("Portfolio exported successfully!");
    } catch (error) {
      console.error("Error exporting portfolio:", error);
      toast.error("Failed to export portfolio");
    }
  };

  const filteredItems = portfolioItems.filter((item) => {
    const matchesSearch =
      item.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === "all" || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const portfolioStats = {
    totalItems: portfolioItems.length,
    recipes: portfolioItems.filter(
      (item) => item.type === "recipe",
    ).length,
    achievements: achievements.length,
    skillsCount: skills.length,
    avgSkillLevel:
      skills.length > 0
        ? Math.round(
            skills.reduce(
              (acc, skill) => acc + skill.level,
              0,
            ) / skills.length,
          )
        : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-glass-gradient p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card
                key={i}
                className="glass-card animate-pulse"
              >
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (databaseSetupNeeded) {
    return (
      <div className="min-h-screen bg-glass-gradient">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-aurora-gradient rounded-full opacity-20 blur-3xl floating"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-calm-gradient rounded-full opacity-15 blur-3xl floating"
            style={{ animationDelay: "-3s" }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Portfolio Setup Required 🍳
              </h1>
              <p className="text-muted-foreground">
                Let's set up the Digital Portfolio tables to get
                you started.
              </p>
            </div>
            <PortfolioSetup
              onSetupComplete={() => {
                setDatabaseSetupNeeded(false);
                loadPortfolioData();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-glass-gradient">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-aurora-gradient rounded-full opacity-20 blur-3xl floating"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-calm-gradient rounded-full opacity-15 blur-3xl floating"
          style={{ animationDelay: "-3s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Portfolio Header */}
        <div className="mb-6 sm:mb-8">
          <Card className="glass-card">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6 mb-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white/20 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-lg sm:text-xl">
                      {profile?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") ||
                        user?.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                      {portfolio?.title}
                    </h1>
                    <p className="text-muted-foreground mb-4">
                      {portfolio?.description}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <Badge
                        variant={
                          portfolio?.is_public
                            ? "default"
                            : "secondary"
                        }
                      >
                        {portfolio?.is_public
                          ? "Public"
                          : "Private"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Created{" "}
                        {new Date(
                          portfolio?.created_at || "",
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-row space-x-2 justify-center lg:justify-start">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </DialogTrigger>
                    <DialogContent
                      className="glass-modal"
                      aria-describedby="portfolio-settings-description"
                    >
                      <DialogHeader>
                        <DialogTitle>
                          Portfolio Settings
                        </DialogTitle>
                      </DialogHeader>
                      <div
                        id="portfolio-settings-description"
                        className="sr-only"
                      >
                        Configure your portfolio visibility,
                        title, and description settings.
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">
                            Portfolio Title
                          </Label>
                          <Input
                            id="title"
                            value={portfolioForm.title}
                            onChange={(e) =>
                              setPortfolioForm({
                                ...portfolioForm,
                                title: e.target.value,
                              })
                            }
                            placeholder="Enter portfolio title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={portfolioForm.description}
                            onChange={(e) =>
                              setPortfolioForm({
                                ...portfolioForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe your portfolio"
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="public"
                            checked={portfolioForm.is_public}
                            onCheckedChange={(checked) =>
                              setPortfolioForm({
                                ...portfolioForm,
                                is_public: checked,
                              })
                            }
                          />
                          <Label htmlFor="public">
                            Make portfolio public
                          </Label>
                        </div>
                        <Button
                          onClick={updatePortfolio}
                          className="w-full"
                        >
                          Update Portfolio
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={sharePortfolio}
                    variant="outline"
                    size="sm"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    onClick={exportPortfolio}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Portfolio Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {portfolioStats.totalItems}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Portfolio Items
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {portfolioStats.recipes}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Recipes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {portfolioStats.achievements}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Achievements
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {portfolioStats.skillsCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Skills
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {portfolioStats.avgSkillLevel}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg Skill Level
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <Card className="glass-card mb-4 sm:mb-6">
            <CardContent className="p-2 sm:p-4">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1">
                <TabsTrigger value="overview" className="text-xs sm:text-sm p-2">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="items" className="text-xs sm:text-sm p-2">
                  <span className="hidden sm:inline">Portfolio Items</span>
                  <span className="sm:hidden">Items</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="text-xs sm:text-sm p-2">Skills</TabsTrigger>
                <TabsTrigger value="achievements" className="text-xs sm:text-sm p-2">
                  <span className="hidden sm:inline">Achievements</span>
                  <span className="sm:hidden">Awards</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Items */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Recent Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolioItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-secondary/30"
                      >
                        {item.image_url && (
                          <ImageWithFallback
                            src={item.image_url}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {item.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.description}
                          </p>
                          <div className="flex items-center mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {item.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(
                                item.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Skills */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ChefHat className="w-5 h-5 mr-2" />
                    Top Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {skills.slice(0, 5).map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {skill.name}
                          </span>
                          {skill.verified && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              <Medal className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={skill.level}
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">
                            {skill.level}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="items">
            <div className="space-y-6">
              {/* Filters and Search */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search portfolio items..."
                          value={searchTerm}
                          onChange={(e) =>
                            setSearchTerm(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select
                      value={filterType}
                      onValueChange={setFilterType}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Types
                        </SelectItem>
                        <SelectItem value="recipe">
                          Recipes
                        </SelectItem>
                        <SelectItem value="achievement">
                          Achievements
                        </SelectItem>
                        <SelectItem value="certification">
                          Certifications
                        </SelectItem>
                        <SelectItem value="project">
                          Projects
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog
                      open={isCreateModalOpen}
                      onOpenChange={setIsCreateModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="glass-modal max-w-md"
                        aria-describedby="add-item-description"
                      >
                        <DialogHeader>
                          <DialogTitle>
                            Add Portfolio Item
                          </DialogTitle>
                        </DialogHeader>
                        <div
                          id="add-item-description"
                          className="sr-only"
                        >
                          Create a new portfolio item including
                          recipes, achievements, certifications,
                          or projects.
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="type">Type</Label>
                            <Select
                              value={itemForm.type}
                              onValueChange={(value: any) =>
                                setItemForm({
                                  ...itemForm,
                                  type: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="recipe">
                                  Recipe
                                </SelectItem>
                                <SelectItem value="achievement">
                                  Achievement
                                </SelectItem>
                                <SelectItem value="certification">
                                  Certification
                                </SelectItem>
                                <SelectItem value="project">
                                  Project
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={itemForm.title}
                              onChange={(e) =>
                                setItemForm({
                                  ...itemForm,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Enter item title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">
                              Description
                            </Label>
                            <Textarea
                              id="description"
                              value={itemForm.description}
                              onChange={(e) =>
                                setItemForm({
                                  ...itemForm,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Describe this item"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="image_url">
                              Image URL
                            </Label>
                            <Input
                              id="image_url"
                              value={itemForm.image_url}
                              onChange={(e) =>
                                setItemForm({
                                  ...itemForm,
                                  image_url: e.target.value,
                                })
                              }
                              placeholder="Optional image URL"
                            />
                          </div>
                          <Button
                            onClick={createPortfolioItem}
                            className="w-full"
                          >
                            Add Item
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <PortfolioItemCard
                    key={item.id}
                    item={item}
                    onEdit={(item) => {
                      setEditingItem(item);
                      setItemForm({
                        type: item.type,
                        title: item.title,
                        description: item.description,
                        image_url: item.image_url || "",
                        video_url: item.video_url || "",
                        metadata: item.metadata,
                      });
                      setIsEditModalOpen(true);
                    }}
                    onDelete={(itemId) => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this portfolio item? This action cannot be undone.",
                        )
                      ) {
                        deletePortfolioItem(itemId);
                      }
                    }}
                    onView={(item) => {
                      // Future: Open detailed view modal
                      console.log("View item:", item);
                    }}
                  />
                ))}
              </div>

              {filteredItems.length === 0 && (
                <Card className="glass-card">
                  <CardContent className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">
                      No Portfolio Items Found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || filterType !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Start building your portfolio by adding your first item."}
                    </p>
                    {!searchTerm && filterType === "all" && (
                      <Button
                        onClick={() =>
                          setIsCreateModalOpen(true)
                        }
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Culinary Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {skills.map((skill) => (
                      <div key={skill.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {skill.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              {skill.category}
                            </Badge>
                            {skill.verified && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                <Medal className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={skill.level}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {skill.level}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">
                      No Skills Added Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start tracking your culinary skills and
                      progress.
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Skills
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>
                  Achievements & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-start space-x-4 p-4 rounded-lg bg-secondary/30"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">
                              {achievement.title}
                            </h4>
                            {achievement.verified && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                <Medal className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            Earned{" "}
                            {new Date(
                              achievement.earned_at,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">
                      No Achievements Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Complete challenges and earn recognition
                      for your culinary skills.
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      View Challenges
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Item Modal */}
        <Dialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        >
          <DialogContent
            className="glass-modal max-w-md"
            aria-describedby="edit-item-description"
          >
            <DialogHeader>
              <DialogTitle>Edit Portfolio Item</DialogTitle>
            </DialogHeader>
            <div id="edit-item-description" className="sr-only">
              Edit the details of your selected portfolio item
              including title, description, and media.
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  value={itemForm.type}
                  onValueChange={(value: any) =>
                    setItemForm({ ...itemForm, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recipe">
                      Recipe
                    </SelectItem>
                    <SelectItem value="achievement">
                      Achievement
                    </SelectItem>
                    <SelectItem value="certification">
                      Certification
                    </SelectItem>
                    <SelectItem value="project">
                      Project
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={itemForm.title}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter item title"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={itemForm.description}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this item"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-image_url">
                  Image URL
                </Label>
                <Input
                  id="edit-image_url"
                  value={itemForm.image_url}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      image_url: e.target.value,
                    })
                  }
                  placeholder="Optional image URL"
                />
              </div>
              <Button
                onClick={updatePortfolioItem}
                className="w-full"
              >
                Update Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default DigitalPortfolio