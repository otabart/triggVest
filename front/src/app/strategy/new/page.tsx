import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CreateStrategyForm } from "@/components/create-strategy-form"

export default function NewStrategyPage() {
    return (
        <div className="bg-background">
            <Header />
            <main>
                <CreateStrategyForm />
            </main>
            <Footer />
        </div>
    )
}
