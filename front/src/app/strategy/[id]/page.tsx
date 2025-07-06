import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StrategyDetailView } from "@/components/strategy-detail-view"

interface StrategyDetailPageProps {
    params: {
        id: string
    }
}

export default async function StrategyDetailPage({ params }: StrategyDetailPageProps) {
    const { id } = await params

    return (
        <div className="bg-background">
            <Header />
            <main>
                <StrategyDetailView strategyId={id} />
            </main>
            <Footer />
        </div>
    )
}
