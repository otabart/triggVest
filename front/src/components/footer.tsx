import Link from "next/link"

export function Footer() {
    return (
        <footer className="bg-secondary border-t">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6 py-8">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-sans text-foreground">Triggvest</span>
                </Link>
                <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Triggvest. All Rights Reserved.</p>
                <div className="flex gap-4">{/* Add social links here if needed */}</div>
            </div>
        </footer>
    )
}
