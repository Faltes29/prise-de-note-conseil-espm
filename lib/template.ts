export function joinWithEt(items: string[]): string {
  const clean = items.filter((item) => item.trim().length > 0);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(", ")} et ${clean[clean.length - 1]}`;
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  let result = template.replace(
    /{{#if\s+([\w]+)}}([\s\S]*?){{\/if}}/g,
    (_match, key: string, content: string) => (vars[key]?.trim() ? content : "")
  );

  result = result.replace(/{{\s*([\w]+)\s*}}/g, (_match, key: string) => vars[key] ?? "");

  return result
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildAiPrompt(commentText: string, genre: "Féminin" | "Masculin" | "Non-défini"): string {
  return `!!! Coller en texte brut dans l'IA !!!

Tu es correcteur·rice pour des bulletins scolaires. Corrige UNIQUEMENT les passages grammaticalement incorrects du texte ci-dessous (orthographe, conjugaison, accords).

Règles à respecter :
- Ne reformule pas les phrases, ne change pas le sens ni le style : corrige seulement ce qui est grammaticalement fautif.
- Respecte le ton d'un bulletin scolaire et le niveau de langue déjà utilisé.
- Conserve l'ordre des paragraphes tel quel.
- Accorde les pronoms et adjectifs selon le genre de l'élève : ${genre}.
- Pour les énumérations, utilise des virgules entre les éléments et "et" avant le dernier élément (pas de virgule avant le "et" final).
- Renvoie uniquement le texte corrigé, sans commentaire ni explication.

Texte à corriger :
"""
${commentText}
"""`;
}
