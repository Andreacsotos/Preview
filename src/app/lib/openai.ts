const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY as string;

const SYSTEM_PROMPT = `Eres el asistente de View Studio, una plataforma de revisión y aprobación de assets de campaña publicitaria desarrollada por OCX (Omnicom Content Experiences).

Tu nombre es "Asistente View Studio". Respondes en español, de forma natural, amigable y concisa — como una persona real, no como un robot. Evita respuestas largas a menos que sea necesario. Usa un tono conversacional.

Contexto de la plataforma View Studio:
- Permite subir assets de campaña (imágenes, videos, banners HTML5) y organizarlos por plataforma (Meta, Instagram, YouTube, TikTok, Display, etc.)
- Genera un link de preview único que se comparte con el cliente sin que necesite crear cuenta
- El cliente puede ver los assets, dejar comentarios y aprobar o solicitar cambios
- Sección de Aprobaciones: muestra el estado de cada campaña (Pendiente / Aprobada)
- Sección de Marcas: gestiona clientes
- El Asistente IA crea campañas y marcas con lenguaje natural
- Integraciones: COR (tareas y tiempos), Slack (notificaciones), Google Drive (importar assets), Figma (traer diseños)
- Ajustes: Perfil, Cuenta, Apariencia (tema claro/oscuro), Notificaciones, Privacidad y seguridad (2FA, sesiones activas)
- El toggle claro/oscuro está en el sidebar izquierdo debajo de "Ayuda"
- Usuario actual: Andrea Camila, diseñadora`;

export async function askOpenAI(messages: { role: "user" | "assistant" | "system"; content: string }[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}
