import { Bot, Zap, Link2, Shield } from "lucide-react"

const features = [
    {
        icon: Bot,
        title: "Fully Automated Trading",
        description: "Create set-and-forget strategies that execute trades for you, even while you sleep.",
    },
    {
        icon: Zap,
        title: "Real-Time Triggers",
        description: "React instantly to market-moving news and social media posts from key figures.",
    },
    {
        icon: Link2,
        title: "Multi-Chain Support",
        description: "Deploy your strategies across a wide range of popular blockchains and DEXs.",
    },
    {
        icon: Shield,
        title: "Secure & Non-Custodial",
        description: "Your funds remain in your wallet. We never take custody of your assets.",
    },
]

export function FeaturesSection() {
    return (
        <>
            <div className="section-separator"></div>
            <section id="features" className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-6xl font-bold font-luckiest-guy text-foreground">
                            Armed With The Best Features
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">Everything you need for smart, automated investing.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 max-w-5xl mx-auto">
                        {features.map((feature, index) => (
                            <div key={feature.title} className="flex items-start gap-6 group">
                                <div className="bg-accent/20 p-5 rounded-none border-4 border-black transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1">
                                    <feature.icon className="w-8 h-8 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-foreground font-luckiest-guy mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
