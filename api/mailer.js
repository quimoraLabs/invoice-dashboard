// api/mailer.js
import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("[Mailer] EMAIL_USER or EMAIL_PASS not configured.");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
  });
}

/**
 * 1. Security Alert Email (Triggered when someone fails passcode or unauthorized access is attempted)
 */
export async function sendSecurityAlertEmail({
  ownerEmail,
  workspaceName,
  actorInfo,
  details,
  timestamp,
}) {
  const transporter = getTransporter();
  if (!transporter || !ownerEmail) return false;

  const formattedTime = timestamp || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 16px; background-color: #ffffff;">
      <!-- Alert Banner -->
      <div style="text-align: center; margin-bottom: 24px; padding: 16px; background-color: #fef2f2; border-radius: 12px; border: 1px solid #fecaca;">
        <div style="width: 50px; height: 50px; background-color: #ef4444; color: #ffffff; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; line-height: 50px; text-align: center;">
          ⚠️
        </div>
        <h2 style="color: #991b1b; margin: 12px 0 4px 0; font-size: 20px; font-weight: 700;">Security Alert: Unauthorized Passcode Attempt</h2>
        <p style="color: #b91c1c; font-size: 13px; margin: 0;">Invomora Workspace Protection System</p>
      </div>

      <p style="font-size: 15px; color: #1f2937; line-height: 1.6;">
        Hello,
      </p>

      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        An incorrect security passcode was entered while attempting to access or perform operations on your workspace:
      </p>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #374151;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #6b7280; width: 140px;">Workspace:</td>
            <td style="padding: 6px 0; font-weight: 700; color: #111827;">${workspaceName || "Business Workspace"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #6b7280;">Attempted By:</td>
            <td style="padding: 6px 0; color: #111827;">${actorInfo || "Unknown / Local Session"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #6b7280;">Details:</td>
            <td style="padding: 6px 0; color: #ef4444; font-weight: 600;">${details || "Invalid 6-digit security passcode entered"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600; color: #6b7280;">Date & Time:</td>
            <td style="padding: 6px 0; color: #111827;">${formattedTime}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px 16px; margin: 20px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 13px; color: #166534; line-height: 1.5;">
          🔒 <strong>Your Data is Safe:</strong> Access was blocked because the 6-digit workspace passcode was not verified.
        </p>
      </div>

      <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
        If you suspect your desk or open account was compromised, please visit <strong>Workspace Settings</strong> in your dashboard and click <strong>"Regenerate Passcode"</strong> immediately.
      </p>

      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;">

      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
        &copy; ${new Date().getFullYear()} Invomora Dashboard. All rights reserved.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Invomora Security" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `[SECURITY ALERT] Failed Passcode Attempt on ${workspaceName || "Workspace"}`,
      html,
    });
    console.log(`[Mailer] Security alert email successfully dispatched to ${ownerEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer] Failed to send security alert email:`, err.message);
    return false;
  }
}

/**
 * 2. Workspace Invitation Email (Sent to invitee with the 6-digit passcode)
 */
export async function sendWorkspaceInviteEmail({
  toEmail,
  workspaceName,
  inviterName,
  role = "accountant",
  invitePasscode,
  appUrl,
}) {
  const transporter = getTransporter();
  if (!transporter || !toEmail) return false;

  const loginUrl = appUrl || process.env.APP_URL || "http://localhost:5173";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;">
      <!-- Brand Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 52px; height: 52px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; line-height: 52px; text-align: center;">
          I
        </div>
        <h2 style="color: #111827; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">Workspace Invitation</h2>
        <p style="color: #6b7280; font-size: 13px; margin: 0;">Invomora Business Invoicing & Financial Portal</p>
      </div>

      <p style="font-size: 15px; color: #1f2937; line-height: 1.6;">
        Hello,
      </p>

      <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
        <strong>${inviterName || "A business owner"}</strong> has invited you to collaborate on the <strong>"${workspaceName}"</strong> workspace as an <strong style="text-transform: capitalize; color: #4f46e5;">${role}</strong>.
      </p>

      <!-- Security Passcode Box -->
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
        <p style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">
          Your 6-Digit Security Passcode
        </p>
        <div style="font-size: 32px; font-weight: 800; font-family: monospace; letter-spacing: 8px; color: #4f46e5; background: #eef2ff; display: inline-block; padding: 8px 24px; border-radius: 8px; border: 1px solid #c7d2fe;">
          ${invitePasscode || "------"}
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 10px 0 0 0;">
          You will be prompted to enter this passcode when accepting your invitation.
        </p>
      </div>

      <!-- Accept CTA -->
      <div style="text-align: center; margin: 28px 0;">
        <a href="${loginUrl}" 
           target="_blank" 
           style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 10px; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
          Open Dashboard & Accept Invite
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;">

      <p style="font-size: 11px; color: #9ca3af; text-align: center; margin: 0;">
        If you did not expect this invitation, you can simply ignore this email or decline it in the dashboard.<br>
        &copy; ${new Date().getFullYear()} Invomora Dashboard. All rights reserved.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Invomora" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Invitation to collaborate on ${workspaceName} - Invomora`,
      html,
    });
    console.log(`[Mailer] Invitation email successfully sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer] Failed to send invitation email:`, err.message);
    return false;
  }
}

/**
 * 3. Forgot Passcode Email
 */
export async function sendForgotPasscodeEmail({
  toEmail,
  workspaceName,
  passcode,
}) {
  const transporter = getTransporter();
  if (!transporter || !toEmail) return false;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 50px; height: 50px; background-color: #eef2ff; color: #4f46e5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; line-height: 50px;">
          🔑
        </div>
        <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px; font-weight: 700;">Passcode Recovery Request</h2>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Invomora Workspace Security</p>
      </div>

      <p style="font-size: 15px; color: #1e293b; line-height: 1.6;">
        Hello,
      </p>

      <p style="font-size: 15px; color: #334155; line-height: 1.6; font-weight: 600;">
        Your account wants to open, your passcode is <span style="color: #4f46e5; font-size: 18px; letter-spacing: 2px;">${passcode}</span>
      </p>

      <div style="text-align: center; margin: 24px 0; padding: 18px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">
          Workspace Passcode for ${workspaceName || "Your Workspace"}
        </p>
        <span style="font-size: 32px; font-weight: 800; font-family: monospace; letter-spacing: 8px; color: #4f46e5; background: #eef2ff; padding: 6px 20px; border-radius: 8px;">
          ${passcode}
        </span>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Use this 6-digit passcode on your standby lock screen to unlock and resume your session. If you did not make this request, someone may be attempting to access your unattended device.
      </p>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;">

      <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
        &copy; ${new Date().getFullYear()} Invomora Dashboard. All rights reserved.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Invomora Security" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Passcode Recovery: Your account wants to open, your passcode is ${passcode}`,
      html,
    });
    console.log(`[Mailer] Forgot passcode email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`[Mailer] Failed to send forgot passcode email:`, err.message);
    return false;
  }
}

