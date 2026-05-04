import astrologyDailyGuidanceSeed from "../../../tarot-data/astrology-daily-guidance-seed.json";

export type DailyAstrologyGuidance = {
  signId: string;
  signNameZh: string;
  signNameEn: string;
  element: string;
  elementNameZh: string;
  modality: string;
  modalityNameZh: string;
  rulingPlanet: string;
  dailyFocus: string;
  watchPoint: string;
  microPrompt: string;
  elementTone: string;
  modalityAdvice: string;
  defaultQuestion: string;
  sourceDatasetId: string;
  resolvedForDate: string;
};

type SignSeed = (typeof astrologyDailyGuidanceSeed.signs)[number];

function toMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isWithinRange(monthDay: string, start: string, end: string) {
  if (start <= end) {
    return monthDay >= start && monthDay <= end;
  }

  return monthDay >= start || monthDay <= end;
}

function findSeasonSign(date: Date): SignSeed {
  const monthDay = toMonthDay(date);
  return (
    astrologyDailyGuidanceSeed.signs.find((sign) =>
      isWithinRange(monthDay, sign.dateRange.start, sign.dateRange.end),
    ) ?? astrologyDailyGuidanceSeed.signs[0]
  );
}

export function resolveDailyAstrologyGuidance(date = new Date()): DailyAstrologyGuidance {
  const sign = findSeasonSign(date);
  const element =
    astrologyDailyGuidanceSeed.elementToneMap[
      sign.element as keyof typeof astrologyDailyGuidanceSeed.elementToneMap
    ];
  const modality =
    astrologyDailyGuidanceSeed.modalityToneMap[
      sign.modality as keyof typeof astrologyDailyGuidanceSeed.modalityToneMap
    ];

  return {
    signId: sign.id,
    signNameZh: sign.nameZh,
    signNameEn: sign.nameEn,
    element: sign.element,
    elementNameZh: element.nameZh,
    modality: sign.modality,
    modalityNameZh: modality.nameZh,
    rulingPlanet: sign.rulingPlanet,
    dailyFocus: sign.dailyFocus,
    watchPoint: sign.watchPoint,
    microPrompt: sign.microPrompt,
    elementTone: element.tone,
    modalityAdvice: modality.adviceStyle,
    defaultQuestion: astrologyDailyGuidanceSeed.runtimeRecipe.defaultQuestion,
    sourceDatasetId: astrologyDailyGuidanceSeed.datasetId,
    resolvedForDate: date.toISOString().slice(0, 10),
  };
}
