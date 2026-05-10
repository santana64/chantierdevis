import "server-only";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachment?: {
    fileName: string;
    contentBase64: string;
    contentType: string;
  };
};

export async function sendTransactionalEmail(input: SendEmailInput) {
  const provider = process.env.EMAIL_PROVIDER || "resend";
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "ChantierDevis <devis@chantierdevis.fr>";

  if (provider !== "resend") {
    return {
      status: "FAILED" as const,
      provider,
      providerMessageId: null,
      errorMessage: `EMAIL_PROVIDER non supporté: ${provider}`,
    };
  }

  if (!apiKey) {
    return {
      status: "SKIPPED" as const,
      provider,
      providerMessageId: null,
      errorMessage: "RESEND_API_KEY non configuré",
    };
  }

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachment
          ? [
              {
                filename: input.attachment.fileName,
                content: input.attachment.contentBase64,
                content_type: input.attachment.contentType,
              },
            ]
          : undefined,
      }),
    });
  } catch {
    return {
      status: "FAILED" as const,
      provider,
      providerMessageId: null,
      errorMessage: "Service email indisponible. Réessayez plus tard.",
    };
  }

  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok) {
    return {
      status: "FAILED" as const,
      provider,
      providerMessageId: payload?.id ?? null,
      errorMessage: payload?.message ?? "Erreur d'envoi email",
    };
  }

  return {
    status: "SENT" as const,
    provider,
    providerMessageId: payload?.id ?? null,
    errorMessage: null,
  };
}
