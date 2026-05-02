-- Mensagem de agradecimento personalizada que o criador escreve uma vez
-- e que aparece pro doador na tela de sucesso (e no email do recibo).
alter table public.campaigns
  add column if not exists thank_you_message text;

-- Toggle pra exibir o ranking de top doadores na página da campanha.
-- Default off por privacidade — criador opta in.
alter table public.campaigns
  add column if not exists show_top_donors boolean default false not null;

-- Toggle do doador: aceita ser destacado no ranking. Sem isso, fica
-- privacy-by-default — só aparece no top quem opt-in.
alter table public.donations
  add column if not exists shown_in_top boolean default false not null;
