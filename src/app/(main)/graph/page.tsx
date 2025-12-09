import { GraphCanvas } from "@/components/graph/GraphCanvas";

export default function GraphPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between">
            <GraphCanvas />
        </main>
    );
}
