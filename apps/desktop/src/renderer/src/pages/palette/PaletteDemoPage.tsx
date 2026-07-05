import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverTrigger,
  PopoverContent
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator as DropdownSep,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Bell,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  Settings,
  User,
  LogOut,
  Copy,
  Eye,
  Pencil,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  Users,
  Package,
  FileText,
  ShoppingCart,
  TrendingUp,
  CreditCard
} from "lucide-react";
import quickcartLogo from "@/assets/quickcart.svg";

const SectionHeading = ({
  children,
  id
}: {
  children: React.ReactNode;
  id?: string;
}) => (
  <div id={id} className="mb-4">
    <h2 className="text-2xl font-semibold tracking-tight">{children}</h2>
    <Separator className="mt-2" />
  </div>
);

const DemoGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-10 flex flex-wrap items-start gap-3">{children}</div>
);

const ColorSwatch = ({
  label,
  variable,
  className
}: {
  label: string;
  variable: string;
  className: string;
}) => (
  <div className="flex flex-col items-center gap-1.5">
    <div
      className={cn(
        "h-14 w-24 rounded-lg border shadow-xs",
        className
      )}
    />
    <span className="text-muted-foreground text-center text-[11px] leading-tight">
      {label}
    </span>
    <code className="text-muted-foreground bg-muted rounded px-1 text-[10px]">
      {variable}
    </code>
  </div>
);

const PRIMARY_PALETTES = [
  {
    id: "a",
    name: "A: Slate-charcoal",
    vars: {
      "--primary": "oklch(35% 0.02 260)",
      "--primary-hover": "oklch(25% 0.02 260)",
      "--primary-focus": "oklch(35% 0.02 260 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
  {
    id: "b",
    name: "B: Deep teal",
    vars: {
      "--primary": "oklch(48% 0.13 195)",
      "--primary-hover": "oklch(40% 0.13 195)",
      "--primary-focus": "oklch(48% 0.13 195 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
  {
    id: "c",
    name: "C: Warm slate-blue",
    vars: {
      "--primary": "oklch(45% 0.06 260)",
      "--primary-hover": "oklch(35% 0.06 260)",
      "--primary-focus": "oklch(45% 0.06 260 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
  {
    id: "d",
    name: "D: Rich forest green",
    vars: {
      "--primary": "oklch(45% 0.14 160)",
      "--primary-hover": "oklch(38% 0.14 160)",
      "--primary-focus": "oklch(45% 0.14 160 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
  {
    id: "e",
    name: "E: Deep maroon",
    vars: {
      "--primary": "oklch(38% 0.14 15)",
      "--primary-hover": "oklch(30% 0.14 15)",
      "--primary-focus": "oklch(38% 0.14 15 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
  {
    id: "f",
    name: "F: Midnight navy",
    vars: {
      "--primary": "oklch(28% 0.04 264)",
      "--primary-hover": "oklch(20% 0.04 264)",
      "--primary-focus": "oklch(28% 0.04 264 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
  {
    id: "g",
    name: "G: Muted plum",
    vars: {
      "--primary": "oklch(42% 0.1 310)",
      "--primary-hover": "oklch(35% 0.1 310)",
      "--primary-focus": "oklch(42% 0.1 310 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
  {
    id: "h",
    name: "H: Burned copper",
    vars: {
      "--primary": "oklch(48% 0.13 50)",
      "--primary-hover": "oklch(40% 0.13 50)",
      "--primary-focus": "oklch(48% 0.13 50 / 0.5)",
      "--on-primary": "#ffffff"
    }
  },
];

const DummySidebar = () => {
  const navItems = [
    { title: "Dashboard", icon: <LayoutDashboard />, active: false },
    { title: "Sales", icon: <ShoppingCart />, active: true },
    { title: "Products", icon: <Package />, active: false },
    { title: "Customers", icon: <Users />, active: false },
    { title: "Estimates", icon: <FileText />, active: false },
    { title: "Reports", icon: <TrendingUp />, active: false },
    { title: "Payments", icon: <CreditCard />, active: false },
    { title: "Settings", icon: <Settings />, active: false },
  ];

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-r-black/8 relative hidden h-screen w-72 shrink-0 flex-col overflow-y-auto border-r md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-2">
            <img
              src={quickcartLogo}
              alt="QuickCart logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="block truncate text-lg font-semibold">QuickCart</span>
            <span className="text-sidebar-foreground/55 block truncate text-sm">Workspace</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 py-5 pb-24">
        <div className="flex flex-col gap-3">
          <Button
            variant="default"
            size="lg"
            className="group bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full cursor-pointer justify-center gap-2 px-4 text-base font-medium transition-all duration-150 hover:shadow-md active:scale-[0.97]"
          >
            <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
            <span>New Sale</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="group h-10 w-full cursor-pointer justify-center gap-2 px-4 text-base font-medium transition-all duration-150 hover:shadow-md active:scale-[0.97]"
          >
            <FileText className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
            <span>New Estimate</span>
          </Button>
        </div>

        <nav className="mt-7 flex-1 space-y-2">
          {navItems.map((item) => (
            <div
              key={item.title}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-1.5 text-base font-medium transition-colors duration-150",
                item.active
                  ? "bg-secondary text-sidebar-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <span className="shrink-0 [&_svg]:size-5">{item.icon}</span>
              <span className="truncate text-base">{item.title}</span>
            </div>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 w-full px-4 pb-4">
        <div className="border-border bg-secondary/80 hover:bg-secondary/90 flex cursor-pointer items-center gap-3 rounded-xl border p-3 backdrop-blur-md transition-colors duration-200">
          <div className="bg-success/20 text-success flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
            MS
          </div>
          <div className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              Sri Manjunatheshwara Stores
            </span>
            <span className="text-muted-foreground block truncate text-xs">
              kumarkrwelcome@gmail.com
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const PaletteDemoPage = () => {
  const [useLinearLight, setUseLinearLight] = useState(false);
  const [activePalette, setActivePalette] = useState("a");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [demoCheck, setDemoCheck] = useState(true);
  const [demoSwitch, setDemoSwitch] = useState(true);
  const [dropdownChecked, setDropdownChecked] = useState(false);

  const selectedPaletteVars = PRIMARY_PALETTES.find(p => p.id === activePalette)?.vars || {};

  return (
    <div 
      className={cn(useLinearLight && "linear-light", "flex min-h-screen bg-background")}
      style={useLinearLight ? (selectedPaletteVars as React.CSSProperties) : undefined}
    >
      <DummySidebar />
      <div className="flex-1 overflow-auto">
        <div className="bg-background-secondary border-border/70 mx-auto max-w-6xl border-x px-8 py-6 min-h-screen">
        {/* ─── HEADER ─── */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight">
              Palette Demo
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              All component variants rendered with current CSS variables. Toggle
              below to compare <code className="bg-muted rounded px-1">:root</code> vs{" "}
              <code className="bg-muted rounded px-1">.linear-light</code>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {useLinearLight && (
              <Select value={activePalette} onValueChange={setActivePalette}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Select Palette" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_PALETTES.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="bg-muted flex items-center gap-0 rounded-lg p-0.5 shadow-xs">
              <button
                onClick={() => setUseLinearLight(false)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  !useLinearLight
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Sun size={15} />
                Current
              </button>
              <button
                onClick={() => setUseLinearLight(true)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  useLinearLight
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Moon size={15} />
                Linear Light
              </button>
            </div>
          </div>
        </div>

        {/* ─── 1. COLOR PALETTE SWATCHES ─── */}
        <section className="mb-12">
          <SectionHeading id="colors">Color Palette</SectionHeading>
          <DemoGrid>
            <ColorSwatch label="Background" variable="--background" className="bg-background" />
            <ColorSwatch
              label="BG Secondary"
              variable="--background-secondary"
              className="bg-background-secondary"
            />
            <ColorSwatch label="Foreground" variable="--foreground" className="bg-foreground" />
            <ColorSwatch
              label="Card"
              variable="--card"
              className="bg-card border-border"
            />
            <ColorSwatch
              label="Card Foreground"
              variable="--card-foreground"
              className="bg-card-foreground"
            />
            <ColorSwatch
              label="Popover"
              variable="--popover"
              className="bg-popover border-border"
            />
            <ColorSwatch
              label="Popover Foreground"
              variable="--popover-foreground"
              className="bg-popover-foreground"
            />
            <ColorSwatch
              label="Primary"
              variable="--primary"
              className="bg-primary"
            />
            <ColorSwatch
              label="Primary Foreground"
              variable="--primary-foreground"
              className="bg-primary-foreground"
            />
            <ColorSwatch
              label="Secondary"
              variable="--secondary"
              className="bg-secondary"
            />
            <ColorSwatch
              label="Secondary Foreground"
              variable="--secondary-foreground"
              className="bg-secondary-foreground"
            />
            <ColorSwatch
              label="Accent"
              variable="--accent"
              className="bg-accent"
            />
            <ColorSwatch
              label="Accent Foreground"
              variable="--accent-foreground"
              className="bg-accent-foreground"
            />
            <ColorSwatch
              label="Muted"
              variable="--muted"
              className="bg-muted"
            />
            <ColorSwatch
              label="Muted Foreground"
              variable="--muted-foreground"
              className="bg-muted-foreground"
            />
            <ColorSwatch
              label="Destructive"
              variable="--destructive"
              className="bg-destructive"
            />
            <ColorSwatch
              label="Destructive FG"
              variable="--destructive-foreground"
              className="bg-destructive-foreground"
            />
            <ColorSwatch
              label="Success"
              variable="--success"
              className="bg-success"
            />
            <ColorSwatch
              label="Success FG"
              variable="--success-foreground"
              className="bg-success-foreground"
            />
            <ColorSwatch
              label="Warning"
              variable="--warning"
              className="bg-warning"
            />
            <ColorSwatch
              label="Warning FG"
              variable="--warning-foreground"
              className="bg-warning-foreground"
            />
            <ColorSwatch label="Info" variable="--info" className="bg-info" />
            <ColorSwatch
              label="Info FG"
              variable="--info-foreground"
              className="bg-info-foreground"
            />
            <ColorSwatch
              label="Border"
              variable="--border"
              className="bg-border"
            />
            <ColorSwatch
              label="Input"
              variable="--input"
              className="bg-input"
            />
            <ColorSwatch
              label="Ring"
              variable="--ring"
              className="bg-ring"
            />
            <ColorSwatch
              label="Sidebar"
              variable="--sidebar"
              className="bg-sidebar"
            />
            <ColorSwatch
              label="Sidebar FG"
              variable="--sidebar-foreground"
              className="bg-sidebar-foreground"
            />
            <ColorSwatch
              label="Chart 1"
              variable="--chart-1"
              className="bg-chart-1"
            />
            <ColorSwatch
              label="Chart 2"
              variable="--chart-2"
              className="bg-chart-2"
            />
            <ColorSwatch
              label="Chart 3"
              variable="--chart-3"
              className="bg-chart-3"
            />
          </DemoGrid>
        </section>

        {/* ─── 2. TYPOGRAPHY ─── */}
        <section className="mb-12">
          <SectionHeading id="typography">Typography</SectionHeading>
          <div className="bg-card border-border space-y-3 rounded-xl border p-6 shadow-sm">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
              h1 — Heading 1
            </h1>
            <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
              h2 — Heading 2
            </h2>
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              h3 — Heading 3
            </h3>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              h4 — Heading 4
            </h4>
            <h5 className="scroll-m-20 text-lg font-semibold tracking-tight">
              h5 — Heading 5
            </h5>
            <h6 className="scroll-m-20 text-base font-semibold tracking-tight">
              h6 — Heading 6
            </h6>
            <p className="text-base leading-7">
              Body paragraph — The quick brown fox jumps over the lazy dog. This
              is regular paragraph text at 16px base size.
            </p>
            <p className="text-muted-foreground text-sm">
              Muted paragraph text — Used for descriptions, hints, and secondary
              information.
            </p>
              <p className="text-muted-foreground">
              <small className="text-xs font-medium leading-none">
                Small text — Captions, footnotes, metadata.
              </small>
            </p>
            <p className="text-muted-foreground font-light">
              Light weight text — 300 weight variant.
            </p>
          </div>
        </section>

        {/* ─── 3. BUTTONS ─── */}
        <section className="mb-12">
          <SectionHeading id="buttons">Buttons</SectionHeading>

          <div className="mb-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              Variants
            </h3>
            <DemoGrid>
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </DemoGrid>
          </div>

          <div className="mb-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              Sizes
            </h3>
            <DemoGrid>
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Icon">
                <Plus />
              </Button>
              <Button size="icon-sm" aria-label="Icon small">
                <Search />
              </Button>
              <Button size="icon-lg" aria-label="Icon large">
                <Bell />
              </Button>
            </DemoGrid>
          </div>

          <div className="mb-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              States
            </h3>
            <DemoGrid>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" disabled>
                Disabled Secondary
              </Button>
              <Button variant="outline" disabled>
                Disabled Outline
              </Button>
              <Button variant="destructive" disabled>
                Disabled Destructive
              </Button>
            </DemoGrid>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              With Icons
            </h3>
            <DemoGrid>
              <Button>
                <Plus /> New Item
              </Button>
              <Button variant="outline">
                <Copy /> Duplicate
              </Button>
              <Button variant="secondary">
                <Eye /> Preview
              </Button>
              <Button variant="ghost">
                <Pencil /> Edit
              </Button>
              <Button variant="destructive">
                <Trash2 /> Delete
              </Button>
              <Button variant="outline" size="sm">
                <Check /> Confirm
              </Button>
            </DemoGrid>
          </div>
        </section>

        <Separator className="my-8" />

        {/* ─── 4. BADGES ─── */}
        <section className="mb-12">
          <SectionHeading id="badges">Badges</SectionHeading>

          <div className="mb-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              Variants
            </h3>
            <DemoGrid>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </DemoGrid>
          </div>

          <div className="mb-6">
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              Semantic (custom app tokens)
            </h3>
            <DemoGrid>
              <span className="bg-success/15 text-success border-success/20 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">
                <Check size={12} className="mr-1" /> Synced
              </span>
              <span className="bg-warning/15 text-warning border-warning/20 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">
                <AlertTriangle size={12} className="mr-1" /> Pending
              </span>
              <span className="bg-destructive/15 text-destructive border-destructive/20 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">
                <X size={12} className="mr-1" /> Failed
              </span>
              <span className="bg-info/15 text-info border-info/20 inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium">
                <Info size={12} className="mr-1" /> Info
              </span>
            </DemoGrid>
          </div>

          <div>
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              Size variants
            </h3>
            <DemoGrid>
              <Badge className="px-1.5 py-0 text-[10px]">Tiny</Badge>
              <Badge>Regular</Badge>
              <Badge className="px-3 py-1 text-sm">Large</Badge>
            </DemoGrid>
          </div>
        </section>

        {/* ─── 5. CARDS ─── */}
        <section className="mb-12">
          <SectionHeading id="cards">Cards</SectionHeading>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>
                  Card description with secondary information about this card.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Card content goes here. This is the main body of the card
                  component. It can contain text, forms, or other elements.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell size={18} /> Highlighted Card
                </CardTitle>
                <CardDescription>
                  A card variant with primary tint background.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  This card uses <code className="bg-muted rounded px-1 text-xs">bg-primary/5</code>{" "}
                  for subtle highlighting. Useful for featured content or active
                  selections.
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm" className="w-full">
                  Action
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="flex flex-col items-center py-10">
                <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Eye size={28} className="text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">Empty State Card</CardTitle>
                <CardDescription className="mt-1 text-center">
                  Used when there&apos;s no data to show.
                </CardDescription>
                <Button className="mt-4" size="sm">
                  <Plus /> Add Item
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <Settings size={20} className="text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">With Icon Header</CardTitle>
                  <CardDescription>Card with leading icon</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Cards can have custom header layouts with icons, avatars, or
                  actions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── 6. DIALOGS ─── */}
        <section className="mb-12">
          <SectionHeading id="dialogs">Dialogs</SectionHeading>
          <DemoGrid>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Settings /> Open Dialog
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Settings</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile settings here. Click save when
                    you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name-demo" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name-demo"
                      defaultValue="QuickCart Store"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email-demo" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email-demo"
                      defaultValue="store@example.com"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setDialogOpen(false)}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 /> Open Alert Dialog
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the selected item and remove its data from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => setAlertOpen(false)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DemoGrid>
        </section>

        {/* ─── 7. FORM ELEMENTS ─── */}
        <section className="mb-12">
          <SectionHeading id="forms">Form Elements</SectionHeading>

          <div className="bg-card border-border grid gap-8 rounded-xl border p-6 shadow-sm md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-foreground text-sm font-semibold">
                Inputs
              </h3>

              <div className="space-y-2">
                <Label htmlFor="input-default">Default</Label>
                <Input id="input-default" placeholder="Placeholder text..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-disabled">Disabled</Label>
                <Input
                  id="input-disabled"
                  placeholder="Disabled input..."
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-icon">With Icon</Label>
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="input-icon"
                    placeholder="Search..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-file">File Input</Label>
                <Input id="input-file" type="file" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="input-error">Error State</Label>
                <Input
                  id="input-error"
                  defaultValue="invalid@"
                  className="border-destructive ring-destructive/20"
                />
                <p className="text-destructive mt-1 text-xs">
                  Please enter a valid email address.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-foreground text-sm font-semibold">
                Select, Checkbox &amp; Switch
              </h3>

              <div className="space-y-2">
                <Label htmlFor="select-demo">Select</Label>
                <Select>
                  <SelectTrigger id="select-demo" className="w-full">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option-1">Option 1</SelectItem>
                    <SelectItem value="option-2">Option 2</SelectItem>
                    <SelectItem value="option-3">Option 3</SelectItem>
                    <SelectItem value="option-4" disabled>
                      Disabled Option
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Checkboxes</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={demoCheck}
                      onCheckedChange={(checked) => setDemoCheck(checked === true)}
                    />
                    {demoCheck ? "Checked" : "Unchecked"}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox defaultChecked={false} disabled />
                    Disabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox defaultChecked disabled />
                    Disabled checked
                  </label>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Switches</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={demoSwitch}
                      onCheckedChange={setDemoSwitch}
                    />
                    {demoSwitch ? "On" : "Off"}
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch defaultChecked={false} disabled />
                    Disabled
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch defaultChecked disabled />
                    Disabled On
                  </label>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Label with Input</Label>
                <div className="flex items-center gap-3">
                  <Label htmlFor="inline-input" className="whitespace-nowrap">
                    Price
                  </Label>
                  <Input
                    id="inline-input"
                    type="number"
                    defaultValue="0.00"
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">Rs.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8. TABS ─── */}
        <section className="mb-12">
          <SectionHeading id="tabs">Tabs</SectionHeading>
          <Tabs defaultValue="tab1" className="w-full">
            <TabsList>
              <TabsTrigger value="tab1">Tab One</TabsTrigger>
              <TabsTrigger value="tab2">Tab Two</TabsTrigger>
              <TabsTrigger value="tab3" disabled>
                Disabled
              </TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm">
                    Content for Tab One. This panel shows when the first tab is
                    active. The tabs component uses the
                    <code className="bg-muted mx-1 rounded px-1 text-xs">--muted</code> background
                    for the tab list rail and
                    <code className="bg-muted mx-1 rounded px-1 text-xs">--background</code> for
                    the active tab.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tab2">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm">
                    Content for Tab Two. Each tab panel can hold different
                    content like forms, tables, or settings.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* ─── 9. TABLE ─── */}
        <section className="mb-12">
          <SectionHeading id="tables">Table</SectionHeading>
          <div className="bg-card border-border rounded-xl border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "Amul Gold Milk 1L",
                    price: 72,
                    qty: 2,
                    total: 144
                  },
                  {
                    name: "Britannia Bread",
                    price: 45,
                    qty: 1,
                    total: 45
                  },
                  {
                    name: "Tata Tea Leaf 500g",
                    price: 285,
                    qty: 1,
                    total: 285
                  }
                ].map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>₹{row.price}</TableCell>
                    <TableCell>{row.qty}</TableCell>
                    <TableCell className="text-right">
                      ₹{row.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* ─── 10. OVERLAYS ─── */}
        <section className="mb-12">
          <SectionHeading id="overlays">Tooltip, Popover &amp; Dropdown Menu</SectionHeading>
          <DemoGrid>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">
                  <Info /> Hover for Tooltip
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>This is a tooltip with helpful information.</p>
              </TooltipContent>
            </Tooltip>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Settings /> Open Popover
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-muted-foreground text-sm">
                      Set the dimensions for the layout.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="width-demo">Width</Label>
                      <Input
                        id="width-demo"
                        defaultValue="100%"
                        className="col-span-2 h-8"
                      />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label htmlFor="height-demo">Height</Label>
                      <Input
                        id="height-demo"
                        defaultValue="auto"
                        className="col-span-2 h-8"
                      />
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <User /> Dropdown Menu <ChevronDown size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownSep />
              <DropdownMenuItem>
                  <User /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell /> Notifications
                </DropdownMenuItem>
              <DropdownSep />
              <DropdownMenuCheckboxItem
                  checked={dropdownChecked}
                  onCheckedChange={setDropdownChecked}
                >
                  Show details
                </DropdownMenuCheckboxItem>
                <DropdownSep />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <LogOut /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DemoGrid>
        </section>

        {/* ─── 11. SEPARATOR ─── */}
        <section className="mb-12">
          <SectionHeading id="separators">Separator</SectionHeading>
          <div className="bg-card border-border space-y-8 rounded-xl border p-6 shadow-sm">
            <div>
              <h3 className="text-sm font-medium">Horizontal Separator</h3>
              <p className="text-muted-foreground text-sm">
                Content above the separator
              </p>
              <Separator className="my-4" />
              <p className="text-muted-foreground text-sm">
                Content below the separator
              </p>
            </div>
            <div className="flex h-24 items-center gap-4">
              <span className="text-sm">Left</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Center</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Right</span>
            </div>
          </div>
        </section>

        {/* ─── 12. ALERT BANNERS / STATUS BOXES ─── */}
        <section className="mb-12">
          <SectionHeading id="alerts">Alert Banners &amp; Status</SectionHeading>
          <div className="grid gap-3">
            <div className="border-l-4 border-l-success bg-success/10 rounded-r-lg border border-y border-r px-4 py-3">
              <div className="flex items-center gap-2">
                <Check size={18} className="text-success shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  Success — Item saved successfully
                </p>
              </div>
            </div>
            <div className="border-l-4 border-l-warning bg-warning/10 rounded-r-lg border border-y border-r px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-warning shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  Warning — This action cannot be undone
                </p>
              </div>
            </div>
            <div className="border-l-4 border-l-destructive bg-destructive/10 rounded-r-lg border border-y border-r px-4 py-3">
              <div className="flex items-center gap-2">
                <X size={18} className="text-destructive shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  Error — Failed to save. Please try again.
                </p>
              </div>
            </div>
            <div className="border-l-4 border-l-info bg-info/10 rounded-r-lg border border-y border-r px-4 py-3">
              <div className="flex items-center gap-2">
                <Info size={18} className="text-info shrink-0" />
                <p className="text-sm font-medium text-foreground">
                  Info — You have 3 new notifications
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 13. SEMANTIC TEXT COLORS ─── */}
        <section className="mb-12">
          <SectionHeading id="semantic-text">Semantic Text Colors</SectionHeading>
          <div className="bg-card border-border flex flex-wrap gap-6 rounded-xl border p-6 shadow-sm">
            <span className="text-primary font-medium">Primary text</span>
            <span className="text-secondary-foreground font-medium">
              Secondary text
            </span>
            <span className="text-muted-foreground">Muted text</span>
            <span className="text-destructive font-medium">
              Destructive text
            </span>
            <span className="text-success font-medium">Success text</span>
            <span className="text-warning font-medium">Warning text</span>
            <span className="text-info font-medium">Info text</span>
            <span className="text-primary/70">Primary / 70</span>
            <span className="text-foreground/60">Foreground / 60</span>
            <span className="text-foreground/40">Foreground / 40</span>
          </div>
        </section>

        {/* ─── FOOTER NOTE ─── */}
        <Separator className="my-6" />
        <p className="text-muted-foreground text-center text-xs">
          Edit <code className="bg-muted rounded px-1">src/index.css</code> to
          change color tokens. Toggle between palette scopes above to A/B
          compare. All tokens listed in the swatches section above.
        </p>
        <div className="mt-2" />
        </div>
      </div>
    </div>
  );
};

export default PaletteDemoPage;
