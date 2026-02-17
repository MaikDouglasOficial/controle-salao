/**
 * Regra de validação para horários de agendamento (anteriores e posteriores):
 *
 * Um horário H só está disponível se:
 * 1. H (início) >= Término do agendamento anterior
 * 2. H (início) + Duração <= Início do próximo agendamento
 *
 * Se (Início + Duração) invadir qualquer minuto de um compromisso já existente,
 * o horário deve ser considerado OCUPADO.
 *
 * Exemplo: atendimento fixo 14:00-15:00 (1h).
 * - 12:00 (1h): termina 13:00 → OK (folga até 14:00)
 * - 13:00 (1h): termina 14:00 → OK (termina exatamente quando começa o próximo)
 * - 13:30 (1h): termina 14:30 → BLOQUEADO (sobrepõe 14:00-15:00)
 */

const SLOT_STEP_MS = 30 * 60 * 1000; // 30 min em ms
const MAX_SUGGESTIONS = 4;
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 20;

export interface Block {
  startMs: number;
  endMs: number;
}

/**
 * Verifica se o intervalo [newStartMs, newEndMs] sobrepõe algum bloco ocupado.
 * Sobreposição: newStart < blockEnd && newEnd > blockStart
 */
export function hasOverlap(
  newStartMs: number,
  newEndMs: number,
  blocks: Block[]
): boolean {
  return blocks.some(
    (b) => newStartMs < b.endMs && newEndMs > b.startMs
  );
}

/**
 * A partir dos agendamentos do dia, retorna os blocos ocupados (início e fim em ms)
 * ordenados por início.
 */
export function getOccupiedBlocks(
  appointments: { date: Date; service?: { duration?: number } | null }[]
): Block[] {
  const blocks: Block[] = appointments.map((a) => {
    const startMs = a.date.getTime();
    const dur = Math.max(1, a.service?.duration ?? 30);
    return {
      startMs,
      endMs: startMs + dur * 60 * 1000,
    };
  });
  blocks.sort((a, b) => a.startMs - b.startMs);
  return blocks;
}

/**
 * Calcula os próximos horários disponíveis que cabem na duração informada.
 * Retorna no máximo MAX_SUGGESTIONS horários (ISO string), os mais próximos do horário solicitado.
 * Considera passo de 30 min e expediente 08:00-20:00 no dia.
 */
export function getSuggestedSlotStarts(
  blocks: Block[],
  requestedStartMs: number,
  durationMinutes: number,
  startOfDayMs: number,
  endOfDayMs: number,
  nowMs: number
): string[] {
  const durationMs = durationMinutes * 60 * 1000;
  const workStartMs = startOfDayMs + WORK_START_HOUR * 60 * 60 * 1000;
  const workEndMs = startOfDayMs + WORK_END_HOUR * 60 * 60 * 1000;
  const candidates: number[] = [];

  // Gaps: antes do primeiro bloco, entre blocos, depois do último (limitado ao expediente)
  let gapStart = workStartMs;
  for (const b of blocks) {
    const gapEnd = Math.min(b.startMs, workEndMs);
    if (gapEnd > gapStart && gapEnd - gapStart >= durationMs) {
      for (let t = gapStart; t <= gapEnd - durationMs; t += SLOT_STEP_MS) {
        if (t >= nowMs) candidates.push(t);
      }
    }
    gapStart = Math.max(gapStart, b.endMs);
  }
  if (workEndMs - gapStart >= durationMs) {
    for (let t = gapStart; t <= workEndMs - durationMs; t += SLOT_STEP_MS) {
      if (t >= nowMs) candidates.push(t);
    }
  }

  // Ordenar por proximidade do horário solicitado e pegar até MAX_SUGGESTIONS
  const unique = [...new Set(candidates)].sort((a, b) => a - b);
  const sortedByProximity = unique.sort(
    (a, b) =>
      Math.abs(a - requestedStartMs) - Math.abs(b - requestedStartMs)
  );
  return sortedByProximity
    .slice(0, MAX_SUGGESTIONS)
    .map((ms) => new Date(ms).toISOString());
}
