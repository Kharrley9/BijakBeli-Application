import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingCart, TrendingDown, PiggyBank, BarChart3, Store, Shield } from 'lucide-react';
import Button from '../components/Button';

const features = [
  { icon: TrendingDown, title: 'Price Comparison', desc: 'Compare prices across AEON Big, BP Mall & Square One instantly' },
  { icon: ShoppingCart, title: 'Smart Shopping List', desc: 'Build lists and find the cheapest store for your entire cart' },
  { icon: PiggyBank, title: 'Budget Planner', desc: 'Set monthly budgets and track your grocery spending' },
  { icon: BarChart3, title: 'Savings Reports', desc: 'Visualize your savings with detailed charts and analytics' },
  { icon: Store, title: 'Store Promotions', desc: 'Never miss a deal with real-time promotion tracking' },
  { icon: Shield, title: 'Trusted Data', desc: 'Verified prices from supermarkets in Batu Pahat, Johor' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-4 glass sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <span className="text-xl font-bold text-white">B</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Bijak<span className="text-primary-500">Beli</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-96 h-96 bg-primary-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent-400 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-16 py-24 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="inline-block px-4 py-1.5 bg-primary-500/10 text-primary-400 text-sm font-medium rounded-full mb-6 border border-primary-500/20">
              🛒 Batu Pahat's #1 Grocery Companion
            </span>
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Compare Grocery Prices.{' '}
              <span className="text-gradient">Save Money.</span>
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 mb-10 max-w-2xl">
              BijakBeli helps you find the best prices across AEON Big, BP Mall, and Square One Mall.
              Create smart shopping lists, track promotions, and save up to 30% on groceries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Saving Today <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                  Login to Account
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
          >
            {[
              { value: '3', label: 'Supermarkets' },
              { value: '500+', label: 'Products' },
              { value: 'RM150+', label: 'Avg Monthly Savings' },
              { value: '1000+', label: 'Happy Users' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                <p className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 lg:px-16 bg-gray-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">Features</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mt-3">
              Everything You Need to Shop Smart
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
            Join thousands of smart shoppers in Batu Pahat who save money every week with BijakBeli.
          </p>
          <Link to="/register">
            <Button size="lg">
              Create Free Account <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-slate-700 py-8 px-6 lg:px-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} BijakBeli. All rights reserved.</p>
          <p className="text-sm text-gray-500">Made for Batu Pahat, Johor, Malaysia 🇲🇾</p>
        </div>
      </footer>
    </div>
  );
}
