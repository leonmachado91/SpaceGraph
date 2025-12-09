import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="text-4xl font-bold tracking-tighter">NeoGraph</h1>
      <p className="text-muted-foreground">Deep Space Knowledge Environment</p>
      <Link href="/graph">
        <Button size="lg" className="rounded-full">Enter System</Button>
      </Link>
    </div>
  );
}
