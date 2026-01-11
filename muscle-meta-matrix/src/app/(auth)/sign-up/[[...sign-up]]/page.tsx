import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Muscle-Meta Matrix</h1>
        <p className="mt-2 text-gray-600">
          Join the founding cohort and optimize your muscle-metabolic health
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-teal-600 hover:bg-teal-700",
            card: "shadow-xl",
          },
        }}
        redirectUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}
