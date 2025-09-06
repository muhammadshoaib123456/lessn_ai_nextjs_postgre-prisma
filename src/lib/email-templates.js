// src/lib/email-templates.js
export function welcomeEmail(name = "there", baseUrl = "") {
  return {
    subject: "Welcome to Lessn!",
    text: `Welcome, ${name}! Start exploring lessons: ${baseUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif">
        <h2>Welcome, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p><a href="${baseUrl}" style="color:#6c2bd9">Start exploring lessons</a></p>
      </div>`,
  };
}

export function resetEmail(resetUrl) {
  return {
    subject: "Reset your Lessn password",
    text: `Reset your password: ${resetUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif">
        <p>We received a request to reset your password.</p>
        <p><a href="${resetUrl}" style="color:#6c2bd9">Click here to set a new password</a> (valid for 1 hour)</p>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>`,
  };
}
