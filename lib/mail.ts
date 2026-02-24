import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL;

// Plantilla base para todos los correos con estilo Caletas
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Caletas</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Montserrat', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #203324 0%, #354B3A 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
        }
        .header p {
            font-size: 1.1rem;
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
        }
        .content h2 {
            color: #203324;
            font-size: 1.8rem;
            font-weight: 600;
            margin: 0 0 20px 0;
        }
        .content p {
            color: #4a5568;
            font-size: 1rem;
            margin: 0 0 15px 0;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: linear-gradient(135deg, #203324 0%, #354B3A 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 12px;
            margin: 25px 0;
            font-weight: 600;
            font-size: 1rem;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(32, 51, 36, 0.3);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(32, 51, 36, 0.4);
        }
        .footer {
            text-align: center;
            padding: 30px;
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }
        .footer p {
            font-size: 0.875rem;
            color: #64748b;
            margin: 5px 0;
        }
        .code {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: 4px;
            margin: 25px 0;
            color: #203324;
            border: 2px solid #e2e8f0;
        }
        .highlight {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
            margin: 20px 0;
        }
        .highlight p {
            margin: 0;
            color: #92400e;
            font-weight: 500;
        }
        .logo {
            font-size: 2rem;
            font-weight: 700;
            color: white;
            margin-bottom: 10px;
        }
        .tagline {
            font-size: 1rem;
            opacity: 0.8;
            font-weight: 400;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CALETAS</div>
            <p class="tagline">Comparte y aprende con tu comunidad</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
            <p>© ${new Date().getFullYear()} Caletas. Todos los derechos reservados.</p>
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
        <p>¡Hola!</p>
        <p>Has solicitado un código de verificación de dos factores para acceder a tu cuenta en Caletas.</p>
        <p>Tu código de verificación es:</p>
        <div class="code">${token}</div>
        <div class="highlight">
            <p>⚠️ Este código expirará en 10 minutos por seguridad.</p>
        </div>
        <p>Si no has solicitado este código, por favor ignora este correo y contacta a soporte inmediatamente.</p>
        <p>¡Gracias por usar Caletas!</p>
    `;

    await resend.emails.send({
        from: "Caletas <bienvenido@caleta.top>",
        to: email,
        subject: "Tu código de verificación 2FA - Caletas",
        html: baseTemplate(content)
    });
};

export const sendPasswordResetEmail = async (
    email: string, 
    token: string
) => {
    const resetLink = `${domain}/new-password?token=${token}`;
    
    const content = `
        <h2>Restablecer tu contraseña</h2>
        <p>¡Hola!</p>
        <p>Has solicitado restablecer tu contraseña en Caletas.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <p style="text-align: center;">
            <a href="${resetLink}" class="button">Restablecer Contraseña</a>
        </p>
        <div class="highlight">
            <p>🔒 Este enlace expirará en 1 hora por seguridad.</p>
        </div>
        <p>Si no has solicitado restablecer tu contraseña, por favor ignora este correo y contacta a soporte inmediatamente.</p>
        <p>¡Gracias por usar Caletas!</p>
    `;

    await resend.emails.send({
        from: "Caletas <bienvenido@caleta.top>",
        to: email,
        subject: "Restablecer contraseña - Caletas",
        html: baseTemplate(content)
    });
};

export const sendBetterAuthResetPasswordEmail = async (
    email: string,
    url: string,
) => {
    const content = `
        <h2>Restablecer tu contraseña</h2>
        <p>¡Hola!</p>
        <p>Has solicitado restablecer tu contraseña en Caletas.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <p style="text-align: center;">
            <a href="${url}" class="button">Restablecer Contraseña</a>
        </p>
        <div class="highlight">
            <p>🔒 Este enlace expirará en 1 hora por seguridad.</p>
        </div>
        <p>Si no has solicitado restablecer tu contraseña, por favor ignora este correo y contacta a soporte inmediatamente.</p>
        <p>¡Gracias por usar Caletas!</p>
    `;

    await resend.emails.send({
        from: "Caletas <bienvenido@caleta.top>",
        to: email,
        subject: "Restablecer contraseña - Caletas",
        html: baseTemplate(content),
    });
};

export const sendVerificationEmail = async (
    email: string, 
    token: string
) => {
    const confirmLink = `${domain}/new-verification?token=${token}`;
    
    const content = `
        <h2>¡Bienvenido a Caletas!</h2>
        <p>¡Hola!</p>
        <p>Gracias por registrarte en Caletas. Para completar tu registro y acceder a todo el material universitario, por favor verifica tu correo electrónico.</p>
        <p>Haz clic en el siguiente botón para verificar tu correo:</p>
        <p style="text-align: center;">
            <a href="${confirmLink}" class="button">Verificar Correo</a>
        </p>
        <div class="highlight">
            <p>📚 Una vez verificado, podrás acceder a material universitario creado por estudiantes para estudiantes.</p>
        </div>
        <p>Este enlace expirará en 24 horas.</p>
        <p>Si no has creado una cuenta en Caletas, por favor ignora este correo.</p>
        <p>¡Nos vemos en la comunidad!</p>
    `;

    await resend.emails.send({
        from: "Caletas <bienvenido@caleta.top>",
        to: email,
        subject: "¡Bienvenido a Caletas! Verifica tu correo",
        html: baseTemplate(content)
    });
};

export const sendBetterAuthVerificationEmail = async (
    email: string,
    url: string,
) => {
    const content = `
        <h2>¡Bienvenido a Caletas!</h2>
        <p>¡Hola!</p>
        <p>Gracias por registrarte en Caletas. Para completar tu registro y acceder a todo el material universitario, por favor verifica tu correo electrónico.</p>
        <p>Haz clic en el siguiente botón para verificar tu correo:</p>
        <p style="text-align: center;">
            <a href="${url}" class="button">Verificar Correo</a>
        </p>
        <div class="highlight">
            <p>📚 Una vez verificado, podrás acceder a material universitario creado por estudiantes para estudiantes.</p>
        </div>
        <p>Si no has creado una cuenta en Caletas, por favor ignora este correo.</p>
        <p>¡Nos vemos en la comunidad!</p>
    `;

    await resend.emails.send({
        from: "Caletas <bienvenido@caleta.top>",
        to: email,
        subject: "¡Bienvenido a Caletas! Verifica tu correo",
        html: baseTemplate(content),
    });
};