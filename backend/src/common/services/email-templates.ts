/**
 * Email HTML/text template builders.
 * Kept separate from EmailService to respect 300-line limit per file.
 */

export interface AuditSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  secure: number;
}

export interface ScanEmailParams {
  projectName: string;
  summary: AuditSummary;
  totalIssues: number;
  reportLink: string;
}

/** Wraps inner content in the base HTML email shell with shared styles. */
export function buildBaseHtml(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${content}
  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px;">
    <p style="margin: 0;">
      Este email foi enviado automaticamente pelo <strong>App Template</strong>.
    </p>
    <p style="margin: 8px 0 0 0;">
      Se voce nao reconhece esta atividade, por favor entre em contato conosco.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/** Builds a single severity row for the scan summary. */
function buildSeverityRow(
  count: number,
  label: string,
  bgColor: string,
  borderColor: string,
  textColor: string,
  numberColor: string,
): string {
  if (count <= 0) return '';
  return `
      <div style="display: flex; align-items: center; padding: 12px; background: ${bgColor}; border-radius: 8px; border-left: 4px solid ${borderColor};">
        <span style="font-size: 24px; font-weight: bold; color: ${numberColor}; margin-right: 12px;">${count}</span>
        <span style="color: ${textColor};">${label}</span>
      </div>`;
}

/** Builds the full HTML email for a completed scan. */
export function buildScanCompleteHtml(params: ScanEmailParams): string {
  const { projectName, summary, totalIssues, reportLink } = params;

  const severityRows = [
    buildSeverityRow(summary.critical, 'Vulnerabilidade(s) Critica(s)', '#fef2f2', '#dc2626', '#991b1b', '#dc2626'),
    buildSeverityRow(summary.high, 'Vulnerabilidade(s) de Alta Severidade', '#fff7ed', '#ea580c', '#c2410c', '#ea580c'),
    buildSeverityRow(summary.medium, 'Vulnerabilidade(s) de Media Severidade', '#fffbeb', '#d97706', '#b45309', '#d97706'),
    buildSeverityRow(summary.low, 'Vulnerabilidade(s) de Baixa Severidade', '#eff6ff', '#2563eb', '#1d4ed8', '#2563eb'),
  ].filter(Boolean).join('\n');

  const secureRow = `
      <div style="display: flex; align-items: center; padding: 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #059669;">
        <span style="font-size: 24px; font-weight: bold; color: #059669; margin-right: 12px;">${summary.secure}</span>
        <span style="color: #047857;">Teste(s) Aprovado(s)</span>
      </div>`;

  const alertBlock = totalIssues > 0
    ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <p style="margin: 0; color: #991b1b;">
      <strong>Atencao:</strong> Foram encontradas ${totalIssues} vulnerabilidade(s) que requerem sua atencao.
      Recomendamos revisar o relatorio completo e tomar as acoes necessarias.
    </p>
  </div>`
    : `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <p style="margin: 0; color: #047857;">
      <strong>Parabens!</strong> Nenhuma vulnerabilidade foi encontrada neste scan.
      Continue mantendo as boas praticas de seguranca.
    </p>
  </div>`;

  const content = `
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 30px; margin-bottom: 24px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
      Scan de Seguranca Finalizado
    </h1>
    <p style="color: #94a3b8; margin: 8px 0 0 0;">
      Projeto: <strong style="color: #ffffff;">${projectName}</strong>
    </p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">Resumo do Scan</h2>
    <div style="display: grid; gap: 12px;">
      ${severityRows}
      ${secureRow}
    </div>
  </div>

  ${alertBlock}

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${reportLink}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
      Ver Relatorio Completo
    </a>
  </div>`;

  return buildBaseHtml(`Scan Finalizado - ${projectName}`, content);
}

export interface CompanyInviteParams {
  companyName: string;
  inviterName: string;
  acceptUrl: string;
}

/** Builds the HTML email for a company invite. */
export function buildCompanyInviteHtml(params: CompanyInviteParams): string {
  const { companyName, inviterName, acceptUrl } = params;

  const content = `
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 12px; padding: 30px; margin-bottom: 24px;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
      Convite para ${companyName}
    </h1>
    <p style="color: #94a3b8; margin: 8px 0 0 0;">
      Voce recebeu um convite para colaborar
    </p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <p style="margin: 0 0 16px 0; font-size: 16px; color: #1e293b;">
      <strong>${inviterName}</strong> convidou voce para a empresa <strong>${companyName}</strong>.
    </p>
    <p style="margin: 0; font-size: 14px; color: #64748b;">
      Clique no botao abaixo para aceitar o convite e comecar a colaborar.
    </p>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${acceptUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
      Aceitar Convite
    </a>
  </div>

  <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      Este convite expira em 7 dias. Se voce nao solicitou este convite, ignore este email.
    </p>
  </div>`;

  return buildBaseHtml(`Convite - ${companyName}`, content);
}

/** Builds the plain-text version of the company invite email. */
export function buildCompanyInviteText(params: CompanyInviteParams): string {
  const { companyName, inviterName, acceptUrl } = params;
  return [
    `CONVITE PARA ${companyName.toUpperCase()}`,
    `============================`,
    ``,
    `${inviterName} convidou voce para a empresa ${companyName}.`,
    ``,
    `Aceite o convite acessando o link:`,
    acceptUrl,
    ``,
    `Este convite expira em 7 dias.`,
    ``,
    `---`,
    `App Template`,
  ].join('\n');
}

/** Builds the plain-text version of the scan completed email. */
export function buildTextContent(params: Omit<ScanEmailParams, 'reportLink'>): string {
  const { projectName, summary, totalIssues } = params;
  const lines = [
    `SCAN DE SEGURANCA FINALIZADO`,
    `============================`,
    ``,
    `Projeto: ${projectName}`,
    ``,
    `RESUMO DO SCAN:`,
    `---------------`,
  ];

  if (summary.critical > 0) lines.push(`- ${summary.critical} Vulnerabilidade(s) Critica(s)`);
  if (summary.high > 0) lines.push(`- ${summary.high} Vulnerabilidade(s) de Alta Severidade`);
  if (summary.medium > 0) lines.push(`- ${summary.medium} Vulnerabilidade(s) de Media Severidade`);
  if (summary.low > 0) lines.push(`- ${summary.low} Vulnerabilidade(s) de Baixa Severidade`);
  lines.push(`- ${summary.secure} Teste(s) Aprovado(s)`);
  lines.push(``);

  if (totalIssues > 0) {
    lines.push(`ATENCAO: Foram encontradas ${totalIssues} vulnerabilidade(s) que requerem sua atencao.`);
  } else {
    lines.push(`PARABENS: Nenhuma vulnerabilidade foi encontrada neste scan.`);
  }

  lines.push(``);
  lines.push(`Acesse a plataforma para ver o relatorio completo.`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`App Template`);

  return lines.join('\n');
}
