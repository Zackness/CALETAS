import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL;

// Plantilla base para todos los correos
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Legal</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #1a365d;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 20px;
            background-color: #f9fafb;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #6b7280;
        }
        .code {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Global Legal</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
            <p>© ${new Date().getFullYear()} Global Legal. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
`;

export const sendTwoFactorTokenEmail = async (
    email: string, 
    token: string
) => {
    const content = `
        <h2>Tu código de verificación 2FA</h2>
        <p>Hola,</p>
        <p>Has solicitado un código de verificación de dos factores para acceder a tu cuenta en Global Legal.</p>
        <p>Tu código de verificación es:</p>
        <div class="code">${token}</div>
        <p>Este código expirará en 10 minutos.</p>
        <p>Si no has solicitado este código, por favor ignora este correo y contacta a soporte inmediatamente.</p>
    `;

    await resend.emails.send({
        from: "Global Legal <bienvenida@globalegal.org>",
        to: email,
        subject: "Tu código de verificación 2FA - Global Legal",
        html: baseTemplate(content)
    });
};

export const sendPasswordResetEmail = async (
    email: string, 
    token: string
) => {
    const resetLink = `${domain}/auth/new-password?token=${token}`;
    
    const content = `
        <h2>Restablecer tu contraseña</h2>
        <p>Hola,</p>
        <p>Has solicitado restablecer tu contraseña en Global Legal.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <p style="text-align: center;">
            <a href="${resetLink}" class="button">Restablecer Contraseña</a>
        </p>
        <p>Este enlace expirará en 1 hora.</p>
        <p>Si no has solicitado restablecer tu contraseña, por favor ignora este correo y contacta a soporte inmediatamente.</p>
    `;

    await resend.emails.send({
        from: "Global Legal <bienvenida@globalegal.org>",
        to: email,
        subject: "Restablecer contraseña - Global Legal",
        html: baseTemplate(content)
    });
};

export const sendVerificationEmail = async (
    email: string, 
    token: string
) => {
    const confirmLink = `${domain}/auth/new-verification?token=${token}`;
    
    const content = `
        <h2>Verifica tu correo electrónico</h2>
        <p>Hola,</p>
        <p>Gracias por registrarte en Global Legal. Para completar tu registro, por favor verifica tu correo electrónico.</p>
        <p>Haz clic en el siguiente botón para verificar tu correo:</p>
        <p style="text-align: center;">
            <a href="${confirmLink}" class="button">Verificar Correo</a>
        </p>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no has creado una cuenta en Global Legal, por favor ignora este correo.</p>
    `;

    await resend.emails.send({
        from: "Global Legal <bienvenida@globalegal.org>",
        to: email,
        subject: "Verifica tu correo - Global Legal",
        html: baseTemplate(content)
    });
};