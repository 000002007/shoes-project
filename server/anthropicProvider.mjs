// Заглушка. Реальный вызов Claude API + веб-поиск (вариант b) добавим, когда
// будет ключ ANTHROPIC_API_KEY. Сейчас сигнализируем «не настроено».
export async function anthropicLookup(/* model */) {
  throw new Error('ANTHROPIC_PROVIDER_NOT_CONFIGURED');
}
