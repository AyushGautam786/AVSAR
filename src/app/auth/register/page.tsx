import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EligibilityRegistrationForm from '@/components/EligibilityRegistrationForm'

export const metadata: Metadata = {
  title: 'Register - Join Our Platform',
  description: 'Create your account and start your journey with us.',
  openGraph: {
    title: 'Register - Join Our Platform',
    description: 'Create your account and start your journey with us.',
  },
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with back navigation */}
      <div className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="container max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Create Your Account
          </h1>
        </div>

        {/* Single-page Eligibility Registration Form */}
        <div className="max-w-2xl mx-auto">
          <EligibilityRegistrationForm />
        </div>
      </div>
    </div>
  )
}