import { Router, type IRouter } from "express";
import { db, contactMessagesTable } from "@workspace/db";
import { SendContactMessageBody, SendContactMessageResponse } from "@workspace/api-zod";
import nodemailer from "nodemailer";

const router: IRouter = Router();

// Tạo transporter Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "",
    pass: process.env.GMAIL_PASS || "",
  },
});

async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const receiver = process.env.CONTACT_RECEIVER || process.env.GMAIL_USER || "";
  if (!receiver) return;

  await transporter.sendMail({
    from: `"naman.atelier" <${process.env.GMAIL_USER}>`,
    to: receiver,
    replyTo: data.email,
    subject: `[Contact] ${data.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:8px;">
        <h2 style="font-size:20px;margin-bottom:24px;color:#1a1a1a;">New message from naman.atelier</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#666;width:100px;vertical-align:top;font-size:13px;">NAME</td>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;vertical-align:top;font-size:13px;">EMAIL</td>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;"><a href="mailto:${data.email}" style="color:#1a1a1a;">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;vertical-align:top;font-size:13px;">SUBJECT</td>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;">${data.subject}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#666;vertical-align:top;font-size:13px;">MESSAGE</td>
            <td style="padding:8px 0;color:#1a1a1a;font-size:14px;white-space:pre-wrap;">${data.message}</td>
          </tr>
        </table>
        <hr style="margin:24px 0;border:none;border-top:1px solid #e0e0e0;">
        <p style="color:#999;font-size:11px;margin:0;">Sent via naman.atelier contact form</p>
      </div>
    `,
  });
}

router.post("/contact", async (req, res): Promise<void> => {
  const parsed = SendContactMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Lưu vào database
  await db.insert(contactMessagesTable).values(parsed.data);

  // Gửi email thông báo (không block response nếu lỗi)
  sendContactEmail(parsed.data as any).catch(err => {
    console.error("Send contact email error:", err?.message);
  });

  res.json(SendContactMessageResponse.parse({ success: true }));
});

export default router;
