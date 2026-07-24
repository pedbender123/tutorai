// O servidor nunca envia dados pessoais (nome, instituição) pra API externa de LLM —
// em vez disso, o modelo recebe instrução pra usar tokens literais como <nome> no
// texto. A substituição pelo valor real acontece só aqui, no cliente, na hora de
// renderizar — o valor real nunca trafega de volta pro modelo em nenhum turno.
export function substitutePiiTags(text: string, values: { nome?: string; instituicao?: string }): string {
  let out = text;
  if (values.nome) out = out.replaceAll('<nome>', values.nome);
  out = out.replaceAll('<instituicao>', values.instituicao || 'sua instituição');
  return out;
}
