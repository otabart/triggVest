import { Target, Settings, Crosshair, Sparkles } from "lucide-react"

const steps = [
    {
        title: "Pick a Trigger",
        description: "Select a real-time data source, like a tweet from an influential account.",
        icon: Target,
    },
    {
        title: "Define an Action",
        description: "Choose what to do when the trigger fires: buy, sell, or swap.",
        icon: Settings,
    },
    {
        title: "Set Your Target",
        description: "Specify the exact token and blockchain for your automated action.",
        icon: Crosshair,
    },
    {
        title: "Let The Magic Happen",
        description: "Activate your strategy and let Triggvest handle the rest, 24/7.",
        icon: Sparkles,
    },
]

export function HowItWorksSection() {
    return (
        <>
            <div className="section-separator"></div>
            <section id="how-it-works" className="py-20 md:py-28 bg-secondary">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-6xl font-bold font-luckiest-guy text-foreground">Ready, Aim, Automate</h2>
                        <p className="mt-4 text-lg text-muted-foreground">Set up your first strategy in four simple steps.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, index) => (
                            <div key={step.title} className="relative">
                                <div className="bg-card p-8 rounded-none border-4 border-black text-center flex flex-col items-center transition-all duration-300 hover:translate-x-2 hover:translate-y-2 min-h-[320px] relative">
                                    {/* Prominent number in top-left corner */}
                                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-accent text-accent-foreground rounded-none border-4 border-black flex items-center justify-center z-10">
                                        <span className="text-2xl font-bold font-luckiest-guy">{index + 1}</span>
                                    </div>

                                    <div className="mb-6 bg-accent/20 rounded-none p-5 border-2 border-black mt-4">
                                        <step.icon className="w-8 h-8 text-accent" />
                                    </div>

                                    <h3 className="text-xl font-bold font-luckiest-guy text-foreground mb-4">{step.title}</h3>

                                    <p className="text-muted-foreground leading-relaxed text-sm flex-1">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}
