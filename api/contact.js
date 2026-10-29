const { Resend } = require('resend');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.RESEND_TO_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!apiKey || !toEmail || !fromEmail || !makeWebhookUrl) {
    return res.status(500).json({ error: 'O envio do formulário não está configurado no servidor.' });
  }

  let body;
  try {
    const parsedBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    body = parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody) ? parsedBody : {};
  } catch {
    return res.status(400).json({ error: 'O conteúdo enviado é inválido.' });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const whatsapp = String(body.whatsapp || '').trim();
  const company = String(body.company || '').trim();
  const cnpj = String(body.cnpj || '').replace(/\D/g, '');
  const message = String(body.message || '').trim() || 'Sem mensagem adicional.';

  if (!name || !company || !whatsapp || cnpj.length !== 14 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios e informe um CNPJ com 14 dígitos.' });
  }

  try {
    const resend = new Resend(apiKey);

    const results = await Promise.allSettled([
      resend.emails.send({
        from: fromEmail,
        to: [toEmail],
        replyTo: email,
        subject: `[LP SERVIÇOS] Solicitação de orçamento - ${name}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
            <p><strong>Nova solicitação de orçamento</strong></p>
            <p><strong>Origem:</strong> Landing page de Serviços</p>
            <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
            <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp || 'Não informado')}</p>
            <p><strong>Condomínio ou empresa:</strong> ${escapeHtml(company || 'Não informado')}</p>
            <p><strong>CNPJ:</strong> ${escapeHtml(cnpj)}</p>
            <p><strong>Mensagem:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
          </div>
        `
      }),
      fetch(makeWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, whatsapp, company, cnpj, message })
      }).then((response) => {
        if (!response.ok) {
          throw new Error(`Make webhook responded with status ${response.status}`);
        }
      })
    ]);

    const emailResult = results[0];
    const webhookResult = results[1];
    if (emailResult.status === 'rejected') {
      throw emailResult.reason;
    }
    if (emailResult.value.error) {
      throw emailResult.value.error;
    }
    if (webhookResult.status === 'rejected') {
      throw webhookResult.reason;
    }

    return res.status(200).json({ ok: true, id: emailResult.value.data?.id || null });
  } catch (error) {
    console.error('CONTACT_SUBMISSION_ERROR', error);
    return res.status(500).json({
      error: 'Não foi possível enviar a mensagem no momento.'
    });
  }
};
