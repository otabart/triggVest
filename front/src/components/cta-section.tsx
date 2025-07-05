import { Button } from "@/components/ui/button"
import { Target, ArrowRight } from "lucide-react"
import Link from "next/link"

export function CtaSection() {
    return (
        <>
            <div className="section-separator"></div>
            <section className="py-20 md:py-32 bg-background relative overflow-hidden">
                <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
                    <div>
                        <h2 className="text-5xl md:text-6xl font-bold font-sans text-foreground">
                            Ready to Be Quick on the Draw?
                        </h2>
                        <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
                            Stop letting opportunities slip by. Build your first automated strategy in minutes and take control of
                            your crypto portfolio.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link href="/strategy/new">
                                <Button
                                    size="lg"
                                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8 py-6 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-2 hover:translate-y-2 active:translate-x-0 active:translate-y-0"
                                >
                                    <Target className="w-5 h-5 mr-2" />
                                    Create My First Strategy
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
