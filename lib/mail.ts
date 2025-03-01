import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL;

export const sendTwoFactorTokenEmail = async (
    email: string, 
    token: string
) => {
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Global Legal 2FA Code",
        html: `<p>Tu codigo 2FA ${token}.</p>`
    });
};

export const sendPasswordResetEmail = async (
    email: string, 
    token: string
) => {
    const resetLink = `${domain}/auth/new-password?token=${token}`;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Resetear contraseña en Global Legal",
        html: `<p>Click <a href="${resetLink}">aqui</a> para resetear tu contraseña.</p>`
    });
};

export const sendVerificationEmail = async (
    email: string, 
    token: string
) => {
    const confirmLink = `${domain}/auth/new-verification?token=${token}`;

    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Correo de verificación Global Legal",
        html: `<p>Click <a href="${confirmLink}">aqui</a> para confirmar tu correo.</p>`
    });
};

type QuizFormData = {
    pregunta1?: string;
    pregunta2A?: string;
    pregunta2B?: string;
    pregunta3A?: string;
    pregunta3B?: string;
    pregunta3C?: string;
    pregunta3D?: string;
    email?: string;
    // ... otras posibles respuestas
};

export const sendQuizResultsEmail = async (
    email: string, 
    answers: QuizFormData
) => {
    const formattedAnswers = Object.entries(answers)
        .map(([question, answer]) => `<p>${question}: ${answer}</p>`)
        .join('');

    // Enviar correo al usuario
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Resultados del Cuestionario",
        html: `
            <h1>Resultados del Cuestionario</h1>
            ${formattedAnswers}
            <p>Por haber participado en esta encuesta tendrás acceso prioritario a la plataforma como creador al momento de su lanzamiento.</p>
        `
    });

    // Enviar correo al equipo
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: "frankensmonstersestudios@gmail.com",
        subject: "Resultados del Cuestionario - Usuario",
        html: `
            <h1>Resultados del Cuestionario</h1>
            ${formattedAnswers}
            <p>Correo del usuario: ${email}</p>
        `
    });
};