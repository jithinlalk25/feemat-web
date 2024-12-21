import { Mail, Phone } from "lucide-react";

export function SupportPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Contact Support
          </h1>
          <p className="text-muted-foreground">
            Need help? Contact us through any of the following methods.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a
              href="mailto:support@feemat.com"
              className="text-sm hover:underline"
            >
              support@feemat.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2 items-center">
              <span className="text-sm">+91-7356245819</span>
              <a
                href="https://wa.me/917356245819"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                WhatsApp
              </a>
              <span className="text-sm text-muted-foreground">or</span>
              <a
                href="tel:+917356245819"
                className="text-sm text-blue-600 hover:underline"
              >
                Call
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
