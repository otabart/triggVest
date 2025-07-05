import { Button } from "@/components/ui/button"
import { Target } from "lucide-react"
import Image from "next/image"

export function HeroSection() {
    return (
        <section className="relative overflow-hidden py-20 md:py-32 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="z-10 space-y-6">
                        <div>
                            <h1 className="text-6xl md:text-8xl font-bold font-luckiest-guy text-foreground leading-tight tracking-wider">
                                You Set The Rules.
                                <br />
                                We Pull The Trigger.
                            </h1>
                        </div>
                        <div>
                            <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
                                Automate your crypto trades based on real-world events. Stop reacting to the market—start directing it
                                with Triggvest.
                            </p>
                        </div>
                        <div>
                            <Button
                                size="lg"
                                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8 py-6 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-2 hover:translate-y-2 active:translate-x-0 active:translate-y-0"
                            >
                                <Target className="w-5 h-5 mr-2" />
                                Create My First Strategy
                            </Button>
                        </div>
                    </div>
                    <div className="relative flex justify-center items-center">
                        <Image
                            src="/trigger-buy-gun.png"
                            alt="Triggvest Concept - A revolver with a BUY flag representing automated crypto trading triggers"
                            width={600}
                            height={600}
                            className="z-10"
                            priority
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
