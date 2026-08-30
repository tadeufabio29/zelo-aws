// ── Máscaras de formatação ─────────────────────────────────────────────────────

export function mascaraCPF(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function mascaraTelefone(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

// ── Validações ────────────────────────────────────────────────────────────────

export function validarCPF(cpf: string): boolean {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(c[i]) * (10 - i)
  let r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(c[9])) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(c[i]) * (11 - i)
  r = (soma * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(c[10])
}

export function validarEmail(email: string): boolean {
  return /\S+@\S+\.\S+/.test(email)
}

export function validarConselho(conselho: string, sigla: string): boolean {
  const ufs = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
               'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
  const regex = new RegExp(`^${sigla}/(?:${ufs.join('|')})\\s*\\d{1,2}-\\d{4,6}$`, 'i')
  return regex.test(conselho.trim())
}
