-- Marca quando o email de recibo foi disparado pra evitar enviar 2× quando
-- a donation chega tanto pelo confirmDonation (server action no client
-- após pagamento) quanto pelo webhook payment_intent.succeeded.
alter table public.donations
  add column if not exists receipt_sent_at timestamptz;
