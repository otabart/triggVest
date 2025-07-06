import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DashboardOverview } from "@/components/dashboard-overview"
import { WalletsSection } from "@/components/wallets-section"
import { TransactionsSection } from "@/components/transactions-section"
import { DashboardCharts } from "@/components/dashboard-charts"

export default function DashboardPage() {
    return (
        <div className="bg-background">
            <Header />
            <main>
                <DashboardOverview />
                <DashboardCharts />
                <div className="grid lg:grid-cols-2 gap-8 container mx-auto px-4 md:px-6 py-8">
                    <WalletsSection />
                    <TransactionsSection />
                </div>
            </main>
            <Footer />
        </div>
    )
}
