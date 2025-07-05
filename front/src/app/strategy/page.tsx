import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StrategiesGridSection } from "@/components/strategies-grid-section"

export default function StrategyPage() {
    return (
        <div className="bg-background">
            <Header />
            <main>
                <StrategiesGridSection />
            </main>
            <Footer />
        </div>
    )
}
