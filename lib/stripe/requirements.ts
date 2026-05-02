/**
 * Mapeia chaves de requirement do Stripe pra um label legível em PT.
 * Mantido fora de `actions.ts` porque Next exige que arquivos com
 * "use server" exportem só funções async.
 */
export function describeRequirement(key: string): string {
  const map: Record<string, string> = {
    "individual.verification.document": "Documento de identidade (RG, CNH ou passaporte)",
    "individual.verification.additional_document": "Comprovante de endereço",
    "individual.id_number": "CPF",
    "individual.first_name": "Nome",
    "individual.last_name": "Sobrenome",
    "individual.dob.day": "Data de nascimento",
    "individual.dob.month": "Data de nascimento",
    "individual.dob.year": "Data de nascimento",
    "individual.address.line1": "Endereço",
    "individual.address.city": "Cidade",
    "individual.address.state": "Estado",
    "individual.address.postal_code": "CEP",
    "individual.phone": "Telefone",
    "individual.email": "Email",
    "company.tax_id": "CNPJ",
    "company.name": "Razão social",
    "company.verification.document": "Documento da empresa",
    "company.address.line1": "Endereço da empresa",
    "company.address.city": "Cidade",
    "company.address.state": "Estado",
    "company.address.postal_code": "CEP",
    external_account: "Dados bancários para receber",
    "tos_acceptance.date": "Aceite dos termos do Stripe",
    "tos_acceptance.ip": "Aceite dos termos do Stripe",
    "business_profile.url": "Link público da campanha (URL do site)",
    "business_profile.mcc": "Categoria do negócio",
    "business_profile.product_description":
      "Descrição do que está sendo financiado",
    "settings.payments.statement_descriptor":
      "Descrição que aparece no extrato",
  };
  return map[key] ?? key;
}

/**
 * Agrupa keys de requirement por label humano (vários keys podem mapear pro
 * mesmo label, ex: as três partes de date_of_birth viram "Data de nascimento").
 */
export function summarizeRequirements(keys: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    const label = describeRequirement(key);
    if (!seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}
