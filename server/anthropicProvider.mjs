// Заглушка. Реальный вызов Claude API + веб-поиск (вариант b) добавим, когда будет
// ключ ANTHROPIC_API_KEY. Сейчас сигнализируем «не настроено» ТИПИЗИРОВАННЫМ кодом
// ошибки (err.code), а не текстом сообщения — чтобы HTTP-слой не зависел от формулировки.
export async function anthropicLookup(/* model */) {
  const err = new Error('Anthropic-провайдер не настроен: нет ключа ANTHROPIC_API_KEY.');
  err.code = 'LLM_NOT_CONFIGURED';
  throw err;
}
