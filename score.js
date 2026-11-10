// Metascore da crítica: jogos sem avaliação mantêm a aparência neutra.
export function scoreBand(score) {
  if (!Number.isFinite(score)) return 'unrated';
  if (score <= 50) return 'score-low';
  if (score <= 80) return 'score-mid';
  return 'score-high';
}
