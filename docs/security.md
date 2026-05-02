# Segurança & LGPD

## Princípios

1. **Zero trust em input do usuário**: tudo é validado e sanitizado.
2. **Princípio do menor privilégio**: cada chave/role tem só os permissions necessários.
3. **Defesa em profundidade**: validação no client, no server, no banco.
4. **Auditoria**: ações críticas geram log persistente.
5. **Privacy by design**: dados pessoais são minimizados, criptografados em trânsito, e respeitam direitos do titular (LGPD).

## Checklist de segurança

### Secrets

- [ ] `STRIPE_SECRET_KEY` apenas server-side
- [ ] `SUPABASE_SERVICE_ROLE_KEY` apenas server-side
- [ ] `STRIPE_WEBHOOK_SECRET` apenas server-side
- [ ] `RESEND_API_KEY` apenas server-side
- [ ] `.env*` no `.gitignore`
- [ ] Secrets armazenados no Vercel Environment Variables (não em código)
- [ ] Rotação de chaves a cada 6 meses (calendar reminder)

### Auth

- [ ] Google OAuth via Supabase Auth (sem custom session)
- [ ] Cookies httpOnly + secure + sameSite=lax
- [ ] CSRF protection automático via Next.js Server Actions
- [ ] Rate limit em `/auth/*` (Vercel Edge)
- [ ] Logout invalida sessão server-side (não só client)

### Database

- [ ] RLS habilitado em todas tabelas
- [ ] Policies revisadas e testadas (incluir caso "unauthenticated")
- [ ] Service role key nunca exposta
- [ ] Backups automáticos diários (Supabase Free já faz)
- [ ] Logs de query lentas monitorados

### Stripe

- [ ] Webhook signature verificada em todo endpoint
- [ ] Idempotency key em criação de PaymentIntent
- [ ] `application_fee_amount` nunca calculado no client
- [ ] Validação de `campaign.user_id` antes de criar PI (impede usar conta de outro)
- [ ] `paymentIntent.metadata` validado (não confiar cegamente)

### Inputs

- [ ] Zod em todas API routes e Server Actions
- [ ] HTML em descrições sanitizado (DOMPurify) antes de renderizar
- [ ] Upload de arquivos: validar mime type, tamanho max (5MB banner)
- [ ] URLs externas em campos: validar formato + protocol https
- [ ] Slugs: regex `^[a-z0-9-]+$` apenas

### Output

- [ ] Sem stack traces expostos em produção
- [ ] Erros 500 mostram mensagem genérica
- [ ] Headers de segurança (CSP, X-Frame-Options, etc) via Next.js config
- [ ] CORS restrito ao próprio domínio

### Operacional

- [ ] Sentry configurado pra capturar erros
- [ ] Logs estruturados (timestamp + nível + contexto + user_id se logado)
- [ ] Alertas pra: webhook failures, DB errors, payment failures > threshold
- [ ] Plano de incidente documentado (quem chamar, como reverter, etc)

## LGPD — Lei Geral de Proteção de Dados

### Dados pessoais coletados

| Dado | Origem | Finalidade | Base legal | Retenção |
|---|---|---|---|---|
| Nome, email, avatar | Google Sign-In | Identificar criador, contato | Execução de contrato | Enquanto conta ativa |
| CPF, endereço, data nasc | Stripe Onboarding | KYC obrigatório (lei) | Obrigação legal | 5 anos pós-encerramento |
| Conta bancária | Stripe Onboarding | Transferir doações | Execução de contrato | Enquanto conta ativa |
| Nome doador, email | Doação | Recibo, comunicação | Execução de contrato | 5 anos (fiscal) |
| Mensagem doador | Doação | Exibir na campanha | Consentimento | Até deletar campanha |
| IP, user agent | Logs | Segurança, antifraude | Legítimo interesse | 6 meses |

### Direitos do titular

App deve oferecer (V1):

- [ ] Acesso aos próprios dados (`/conta/dados`)
- [ ] Exportação em JSON (LGPD art. 18)
- [ ] Correção de dados
- [ ] Exclusão de conta (com aviso sobre dados retidos por obrigação legal)
- [ ] Anonimização opcional ao deletar conta
- [ ] Revogação de consentimento (mensagens públicas)

### Encarregado (DPO)

Designar pessoa responsável (pode ser o próprio fundador no início):

- Email dedicado: `dpo@doatividade.com.br`
- Página `/lgpd` com informações de contato
- Política de Privacidade clara em pt-BR

### Política de Privacidade — pontos obrigatórios

1. Quem controla os dados (Doatividade — empresa X CNPJ Y)
2. Quais dados coleta (lista detalhada)
3. Por que coleta (finalidades)
4. Com quem compartilha (Stripe, Supabase, Resend, Google)
5. Como armazena (criptografia em trânsito TLS, em repouso AES-256 — herdado do Supabase/Stripe)
6. Quanto tempo guarda
7. Direitos do titular e como exercer
8. Contato do DPO
9. Data da última atualização

### Comunicação de incidente

Se vazar dado pessoal:
- Comunicar ANPD em até 72h (LGPD art. 48)
- Comunicar titulares afetados
- Documentar o incidente, causa, impacto e mitigação

## Antifraude

### Em campanhas

- [ ] Período de "review" automático de 24h pra contas novas (status `pending_review`)
- [ ] Limite inicial de meta: R$ 10.000 pra contas com 0 doações histórico
- [ ] Hash perceptual (pHash) do banner armazenado em `campaigns.banner_phash`
- [ ] Cron diário detecta phashes duplicadas → flagga campanha
- [ ] Texto: comparar embedding com campanhas conhecidas (V2)
- [ ] Botão "Denunciar" visível em todas campanhas
- [ ] Threshold de 3 denúncias pendentes → pausar campanha automaticamente

### Em doações

- [ ] Stripe Radar habilitado (vem ativo por padrão)
- [ ] Regras customizadas no Radar:
  - Block: cartão internacional sem 3DS
  - Review: doações > R$ 1.000 de cartão novo
  - Review: 5+ doações em 1h pra mesma campanha
- [ ] Velocity check: bloquear 10+ doações em 1min vindas mesmo IP

### Em contas

- [ ] Rate limit no signup: 5/hora por IP
- [ ] Rate limit em criar campanha: 3/dia por usuário novo
- [ ] Email verificado obrigatório pra publicar
- [ ] CPF único por conta (Stripe garante)
- [ ] Detecção de email "throwaway" (domínios conhecidos)

## Headers de segurança

Configurar em `next.config.js`:

```js
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://connect-js.stripe.com",
      "frame-src https://js.stripe.com https://connect-js.stripe.com https://hooks.stripe.com",
      "connect-src 'self' https://api.stripe.com https://*.supabase.co wss://*.supabase.co",
      "img-src 'self' data: https: blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
    ].join('; '),
  },
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};
```

## Termos de uso — pontos críticos

Texto deve incluir explicitamente:

1. **Doatividade é plataforma de tecnologia**, não responsável pelo conteúdo, veracidade ou execução das campanhas
2. Criador é o **único responsável** pelo cumprimento da finalidade declarada
3. Doadores têm direito a **estorno** apenas conforme regras do Stripe (cartão: chargeback; Pix: irreversível salvo fraude comprovada)
4. Doatividade **pode pausar/remover** campanhas a qualquer momento sem aviso prévio em caso de violação de termos
5. Conteúdo proibido: **política partidária, religião extremista, atividades ilegais, fraudes, conteúdo adulto**
6. Comunicação oficial só via emails `@doatividade.com.br`
7. Foro de Comarca de São Paulo (ou onde a empresa estiver sediada)

## Dependências externas — confiabilidade

Avaliar uptime e ter plano B:

| Serviço | SLA típico | Plano B |
|---|---|---|
| Vercel | 99.99% | — (alta confiabilidade) |
| Supabase | 99.9% | Backup diário no S3 (V2) |
| Stripe | 99.99% | — (alta confiabilidade) |
| Resend | 99.9% | SendGrid como fallback (V2) |
| Google OAuth | 99.9% | Email/password como alternativa (V2) |

## Auditoria periódica

Trimestralmente:
- [ ] Revisar policies RLS (alguma tabela nova sem RLS?)
- [ ] Revisar logs Sentry (padrões de erro?)
- [ ] Revisar Stripe Risk insights
- [ ] Revisar requests > 99th percentile (DoS?)
- [ ] Atualizar dependências (`pnpm update --interactive --latest`)
- [ ] Rodar `pnpm audit` e resolver high/critical
