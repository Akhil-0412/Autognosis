import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-14 items-center px-4 lg:px-6 border-b">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold text-xl">SaaS Platform</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/dashboard">
            Login
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-black text-white">
          <div className="container px-4 md:px-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Autognosis
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
                  Manage your business with Role-Based Access Control, Audit Logging, and Seamless Billing.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button className="bg-white text-black hover:bg-gray-200" size="lg">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#">
                  <Button variant="outline" className="text-white border-white hover:bg-gray-800" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:px-10 md:gap-16 md:grid-cols-3">
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <h3 className="text-lg font-bold">Role-Based Access</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Granular control over who sees what. Admins and Users have distinct views.
                </p>
              </div>
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-blue-500" />
                <h3 className="text-lg font-bold">Audit Logs</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Track every login and profile update for security and compliance.
                </p>
              </div>
              <div className="space-y-2">
                <CheckCircle className="h-8 w-8 text-purple-500" />
                <h3 className="text-lg font-bold">Stripe Billing</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Integrated billing management using Stripe Checkout.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 SaaS Platform. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
