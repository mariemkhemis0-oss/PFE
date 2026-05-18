import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';

// ── CONFIGURATION SMTP ──
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── TEMPLATE EMAIL ──
const buildEmailTemplate = (resetUrl, userName) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe — ShieldOps</title>
</head>
<body style="margin:0;padding:0;background:#0a1628;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1628;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#0f1e3d;border-radius:24px;border:1px solid rgba(56,139,253,0.20);overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d2148,#1a3a6b);padding:40px 48px 36px;text-align:center;border-bottom:1px solid rgba(56,139,253,0.15);">
              <div style="display:inline-flex;align-items:center;gap:12px;">
                <div style="width:48px;height:48px;background:rgba(56,139,253,0.15);border-radius:14px;border:1px solid rgba(56,139,253,0.30);display:flex;align-items:center;justify-content:center;">
                  <span style="font-size:24px;">🛡️</span>
                </div>
                <div style="text-align:left;">
                  <div style="font-size:20px;font-weight:900;color:#CDD9F0;letter-spacing:-0.5px;">SHIELD<span style="color:#388BFD;">OPS</span></div>
                  <div style="font-size:9px;color:#6B8EBA;letter-spacing:3px;text-transform:uppercase;margin-top:2px;">SECURE VISION</div>
                </div>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:48px 48px 40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#CDD9F0;letter-spacing:-0.5px;text-transform:uppercase;font-style:italic;">
                Réinitialisation<br>de mot de passe
              </h1>
              <p style="margin:0 0 32px;font-size:13px;color:#6B8EBA;line-height:1.7;">
                Bonjour <strong style="color:#CDD9F0;">${userName}</strong>,<br>
                Vous avez demandé la réinitialisation de votre mot de passe.<br>
                Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
              </p>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#1158C7,#1668D8);color:#ffffff;text-decoration:none;border-radius:14px;font-weight:900;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;box-shadow:0 8px 24px rgba(17,88,199,0.45);">
                      🔑 &nbsp; RÉINITIALISER MON MOT DE PASSE
                    </a>
                  </td>
                </tr>
              </table>

              <!-- INFO BOX -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(56,139,253,0.07);border:1px solid rgba(56,139,253,0.15);border-radius:14px;padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:10px;font-weight:900;color:#388BFD;letter-spacing:2px;text-transform:uppercase;">ℹ️ &nbsp; Informations de sécurité</p>
                    <ul style="margin:0;padding:0 0 0 16px;color:#6B8EBA;font-size:12px;line-height:2.0;">
                      <li>Ce lien expire dans <strong style="color:#CDD9F0;">1 heure</strong></li>
                      <li>Utilisable <strong style="color:#CDD9F0;">une seule fois</strong></li>
                      <li>Si vous n'avez pas fait cette demande, ignorez cet email</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- FALLBACK URL -->
              <p style="margin:24px 0 0;font-size:11px;color:#364F6B;line-height:1.6;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                <a href="${resetUrl}" style="color:#388BFD;word-break:break-all;font-size:10px;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:rgba(0,0,0,0.20);padding:24px 48px;border-top:1px solid rgba(56,139,253,0.10);text-align:center;">
              <p style="margin:0 0 4px;font-size:10px;font-weight:900;color:#364F6B;letter-spacing:2px;text-transform:uppercase;">
                © Infrastructure Certifiée KSI V4.2
              </p>
              <p style="margin:0;font-size:10px;color:#364F6B;">
                Cet email a été envoyé automatiquement — ne pas répondre.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ─────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email requis' });

    const user = await User.findOne({ email: email.toLowerCase() });

    // Toujours répondre de la même façon (anti-énumération)
    const SAFE_MESSAGE = 'Si cet email existe, un lien de récupération a été envoyé.';

    if (!user) {
      // Attente simulée pour éviter timing attacks
      await new Promise(r => setTimeout(r, 500));
      return res.json({ message: SAFE_MESSAGE });
    }

    // Supprimer les anciens tokens non utilisés de cet utilisateur
    await PasswordReset.deleteMany({ userId: user._id, used: false });

    // Générer un token sécurisé
    const rawToken = crypto.randomBytes(48).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordReset.create({
      userId:    user._id,
      token:     hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 heure
    });

    // Construire l'URL de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?token=${rawToken}`;

    // Envoyer l'email
    await transporter.sendMail({
      from:    `"ShieldOps Security" <${process.env.SMTP_USER}>`,
      to:      user.email,
      subject: '🔑 Réinitialisation de votre mot de passe — ShieldOps',
      html:    buildEmailTemplate(resetUrl, user.name),
    });

    console.log(`[PASSWORD RESET] Token envoyé à: ${user.email}`);
    res.json({ message: SAFE_MESSAGE });

  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]', error.message);
    res.status(500).json({ error: 'Erreur serveur. Réessayez plus tard.' });
  }
};

// ─────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Les mots de passe ne correspondent pas' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Hasher le token reçu pour comparer
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const resetEntry = await PasswordReset.findOne({
      token:     hashedToken,
      used:      false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetEntry) {
      return res.status(400).json({ error: 'Lien invalide ou expiré. Faites une nouvelle demande.' });
    }

    // Mettre à jour le mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(resetEntry.userId, {
      $set: { password: hashedPassword, updatedAt: new Date() }
    });

    // Invalider le token
    await PasswordReset.findByIdAndUpdate(resetEntry._id, { used: true });

    console.log(`[PASSWORD RESET] Mot de passe mis à jour pour userId: ${resetEntry.userId}`);
    res.json({ message: 'Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter.' });

  } catch (error) {
    console.error('[RESET PASSWORD ERROR]', error.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ─────────────────────────────────────────────────
// GET /api/auth/verify-reset-token?token=XYZ
// ─────────────────────────────────────────────────
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ valid: false });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const entry = await PasswordReset.findOne({
      token:     hashedToken,
      used:      false,
      expiresAt: { $gt: new Date() },
    });

    res.json({ valid: !!entry });
  } catch (error) {
    res.status(500).json({ valid: false });
  }
};