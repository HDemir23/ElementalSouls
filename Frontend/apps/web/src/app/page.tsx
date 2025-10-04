import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';

const features = [
  {
    title: '🔥 Mint Your Soul',
    description: 'Choose from Fire, Water, Earth, or Air elements and mint your unique Elemental Soul NFT',
    href: '/mint'
  },
  {
    title: '✨ Evolve & Level Up',
    description: 'Evolve your NFT to higher levels using our Level Up Gateway system',
    href: '/evolve'
  },
  {
    title: '📊 View Your Collection',
    description: 'See all your Elemental Souls and track their progress',
    href: '/profile'
  }
];

const Page = () => (
  <div className="flex flex-col gap-12">
    <section className="grid gap-6 rounded-3xl bg-gradient-to-br from-purple-100 via-white to-blue-100 p-10 shadow-lg">
      <Badge className="w-max">Monad Testnet</Badge>
      <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Forge and evolve your <span className="text-primary">Elemental Souls</span>
      </h2>
      <p className="max-w-2xl text-lg text-muted-foreground">
        Connect your wallet, choose your element, and evolve your NFT through levels on Monad blockchain
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Link 
          href="/mint"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-6 py-3"
        >
          Start Minting 🚀
        </Link>
        <Link 
          href="/evolve"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-transparent hover:bg-muted hover:text-foreground text-lg px-6 py-3"
        >
          Evolve Your Soul
        </Link>
      </div>
    </section>

    <section className="grid gap-6 md:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.title} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link 
              href={feature.href as any}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-0 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
            >
              Get Started →
            </Link>
          </CardContent>
        </Card>
      ))}
    </section>

    <section className="rounded-lg border bg-muted/50 p-6">
      <h3 className="text-xl font-semibold mb-3">🎮 How It Works</h3>
      <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
        <li>Connect your MetaMask wallet to Monad Testnet</li>
        <li>Choose one of four elements (Fire, Water, Earth, Air)</li>
        <li>Mint your Level 0 Elemental Soul NFT</li>
        <li>Evolve your NFT to higher levels through the gateway</li>
      </ol>
    </section>
  </div>
);

export default Page;
