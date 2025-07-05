import { TrendingUp, TrendingDown } from "lucide-react"

const tweets = [
    {
        handle: "@realDonaldTrump",
        content: "Bitcoin is the future of money. America should lead in crypto innovation!",
        sentiment: "bullish" as const,
    },
    {
        handle: "@SECGov",
        content: "New enforcement action against unregistered crypto securities",
        sentiment: "bearish" as const,
    },
    {
        handle: "@elonmusk",
        content: "Dogecoin to the moon! 🚀 Tesla will accept DOGE payments soon",
        sentiment: "bullish" as const,
    },
    {
        handle: "@federalreserve",
        content: "Interest rates will remain elevated to combat inflation",
        sentiment: "bearish" as const,
    },
    {
        handle: "@VitalikButerin",
        content: "Ethereum's next upgrade will reduce gas fees by 90%",
        sentiment: "bullish" as const,
    },
    {
        handle: "@CoinDesk",
        content: "Major institutional investors are dumping crypto holdings",
        sentiment: "bearish" as const,
    },
    {
        handle: "@TheBlock__",
        content: "BlackRock's Bitcoin ETF sees record $2B inflows this week",
        sentiment: "bullish" as const,
    },
    {
        handle: "@WhiteHouse",
        content: "Executive order restricts crypto mining operations nationwide",
        sentiment: "bearish" as const,
    },
]

export function DataSourcesSection() {
    return (
        <>
            <div className="section-separator"></div>
            <section className="py-20 md:py-28 bg-secondary overflow-hidden">
                <div className="container mx-auto px-4 md:px-6 text-center">
                    <div>
                        <h2 className="text-5xl md:text-6xl font-bold font-luckiest-guy text-foreground">
                            Live Market-Moving Tweets
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground mb-16">
                            We track key accounts on X (formerly Twitter) and major news outlets in real-time.
                        </p>
                    </div>
                </div>
                <div className="relative w-full">
                    <div className="flex animate-marquee-infinite space-x-6">
                        {tweets.concat(tweets).map((tweet, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 bg-card p-6 rounded-none border-4 border-black min-w-[400px] max-w-[400px]"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-accent font-bold text-lg font-luckiest-guy">{tweet.handle}</span>
                                    <div
                                        className={`flex items-center gap-1 px-3 py-1 rounded-none border-2 border-black text-sm font-bold ${tweet.sentiment === "bullish" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {tweet.sentiment === "bullish" ? (
                                            <TrendingUp className="w-3 h-3" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3" />
                                        )}
                                        {tweet.sentiment.toUpperCase()}
                                    </div>
                                </div>
                                <p className="text-foreground text-left leading-relaxed">{tweet.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="container mx-auto px-4 md:px-6 text-center mt-12">
                    <p className="text-sm text-muted-foreground">
                        🔴 Live monitoring • ⚡ Instant triggers • 🎯 Automated execution
                    </p>
                </div>
            </section>
        </>
    )
}
