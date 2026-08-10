export type OtpMailer = {
  sendOtp(email: string, code: string): Promise<void>;
};

export class ConsoleOtpMailer implements OtpMailer {
  async sendOtp(email: string, code: string): Promise<void> {
    console.log(`[Briefs OAuth] OTP for ${email}: ${code}`);
  }
}

export class ResendOtpMailer implements OtpMailer {
  constructor(private readonly apiKey: string, private readonly from: string) {}

  async sendOtp(email: string, code: string): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: this.from,
        to: [email],
        subject: "Your Briefs sign-in code",
        html: `<p>Your Briefs sign-in code is <strong>${code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
      }),
    });
    if (!response.ok) throw new Error(`OTP email delivery failed: ${response.status}`);
  }
}
