import type { QuestionDiagnosis } from "@/lib/interpretation/analysis/types";
import type { SpreadReadingTemplate } from "@/lib/interpretation/templates";

type ChoiceLabels = {
  a: string;
  b: string;
};

export type QualityRequirement = {
  id: string;
  severity: "repairable" | "retry";
  description: string;
};

export type QualityGateInput = {
  question: string;
  template: SpreadReadingTemplate;
  diagnosis: QuestionDiagnosis;
  requiredCardNames?: string[];
  intentDomain?: "career" | "love" | "study" | "relationship" | "self" | "decision";
  userFeedbackTerms?: string[];
};

export type QualityGateResult = {
  text: string;
  requirements: QualityRequirement[];
  issues: QualityIssue[];
  repaired: boolean;
  needsRetry: boolean;
};

export type QualityIssue = {
  id: string;
  severity: "repairable" | "retry";
  message: string;
};

const absolutePredictionPattern =
  /(?:一定会|一定能|一定是|必然|必定|注定|命中注定|绝对会|绝对不会|保证|肯定会|肯定不会)/;
const preciseDatePattern =
  /(?:\d{1,2}\s*(?:月|号|日)|后天|下周[一二三四五六日天]?|周[一二三四五六日天]|星期[一二三四五六日天])[^。！？\n]{0,18}(?:会|将|出现|发生|通过|失败|成功|联系|回来|录用|淘汰)/;
const promptLeakagePattern =
  /(?:把这张牌压缩成|放到你选择的领域里|这个位置的任务是|牌面给出的关键词是|先抓住最关键的一张牌|结构分析笔记|占卜师结构分析|领域牌义|用户未填写|这一节用于|不新增用户没有提供的背景)/;
const impossibleSingleCardPattern =
  /(?:整组牌|牌与牌之间|从第一张牌到|四种花色全部缺席|没有明显的花色主导|没有抽到对应牌位)/;
const rawMeaningCopyPattern =
  /(?:^|\n|\s)(?:感情|事业|學業|事業|財務|健康)[：:]|(?:在事業與工作層面|在感情占卜中|在職場環境中|當這張牌出現|錢幣八的深層意義|寶劍十正位通常|權杖六正位通常|聖杯四正位通常)/;
const safetyHedgePattern =
  /(?:不做绝对|不是绝对|只讨论趋势|只看趋势|不提供精确|不能保证|不是保证|并不保证|不等于必然)/;

const safeAbsoluteSentence =
  "这次解读只讨论趋势、条件和可观察信号，不做绝对承诺，也不提供精确日期。";
const highRiskSentence =
  "如果涉及现实里的高成本决定，请先核对现金流、时间线、替代方案和止损点，再决定是否行动。";
const relationshipRiskSentence =
  "如果这是关系里的重大决定，请先看沟通边界、支持系统、可暂停空间和观察信号，不把一时情绪当成最终判决。";
const mindReadingSentence =
  "关于他人的想法，我不会替对方内心下结论，只把重点放在互动模式和可观察行为上。";

function stripSectionNumber(section: string) {
  return section.replace(/^\d+\.\s*/, "").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function headingTitleAliases(title: string) {
  const pathChoiceMatch = title.match(/^路径\s*([AB])\s*的机会与代价$/);
  if (!pathChoiceMatch) return [title];

  const label = pathChoiceMatch[1];
  return [
    `路径 ${label} 的机会与代价`,
    `路径${label}的机会与代价`,
    `路径 ${label}：机会与代价`,
    `路径${label}：机会与代价`,
    `路径 ${label}: 机会与代价`,
    `路径${label}: 机会与代价`,
    `路径 ${label} 机会与代价`,
    `路径${label}机会与代价`,
  ];
}

function headingPattern(section: string) {
  const title = stripSectionNumber(section);
  const flexibleTitles = headingTitleAliases(title).map((alias) =>
    escapeRegExp(alias).replace(/\\ /g, "\\s*"),
  );
  return new RegExp(`^\\s*(?:\\d+\\.\\s*)?(?:${flexibleTitles.join("|")})\\s*$`);
}

function findSection(text: string, section: string) {
  const lines = text.split("\n");
  const pattern = headingPattern(section);
  let offset = 0;

  for (const line of lines) {
    if (pattern.test(line.trim())) {
      return { index: offset, end: offset + line.length + 1 };
    }
    offset += line.length + 1;
  }

  return null;
}

function getSectionBody(text: string, sections: string[], sectionIndex: number) {
  const section = sections[sectionIndex];
  const current = findSection(text, section);
  if (!current) return "";

  const nextSection = sections
    .slice(sectionIndex + 1)
    .map((candidate) => findSection(text, candidate))
    .find((match): match is { index: number; end: number } => Boolean(match));

  return text.slice(current.end, nextSection?.index ?? text.length).trim();
}

function insertAfterFirstHeading(text: string, template: SpreadReadingTemplate, sentence: string) {
  if (text.includes(sentence)) return text;

  const first = template.sections[0];
  const match = first ? findSection(text, first) : null;
  if (!match) return `${first ?? "1. 一句话结论"}\n${sentence}\n\n${text}`.trim();

  return `${text.slice(0, match.end)}${sentence}\n${text.slice(match.end)}`.replace(
    /\n{3,}/g,
    "\n\n",
  );
}

function extractChoiceLabels(question: string): ChoiceLabels | null {
  const normalized = question.replace(/\s+/g, " ").trim();
  const patterns = [
    /A\s*(?:是|:|：)\s*([^，。；;,.]+?)[，。；;,.]\s*B\s*(?:是|:|：)\s*([^，。；;,.]+)/i,
    /A\s*(?:选项|路径)?\s*(?:是|:|：)\s*([^，。；;,.]+?)[，。；;,.]\s*B\s*(?:选项|路径)?\s*(?:是|:|：)\s*([^，。；;,.]+)/i,
    /(?:选择|路径)\s*A\s*([^，。；;,.]+?)[，。；;,.]\s*(?:选择|路径)\s*B\s*([^，。；;,.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1] && match?.[2]) {
      return { a: match[1].trim(), b: match[2].trim() };
    }
  }

  return null;
}

function hasHighRiskChecklist(text: string) {
  return [
    /现金流|资源|预算|储蓄/,
    /时间线|期限|节奏|周期/,
    /替代方案|备选|Plan B|退路/,
    /止损|退出|暂停|边界/,
  ].every((pattern) => pattern.test(text));
}

function isInterviewQuestion(question: string) {
  return /面试|求职|应聘|候选|岗位/.test(question);
}

function isHealthQuestion(question: string) {
  return /症状|严重|疼|痛|失眠|疾病|生病|发烧|抑郁|焦虑症|医院|医生|检查|治疗|高反|高原反应|拉萨|西藏|海拔|缺氧|呼吸/.test(
    question,
  );
}

function isMaterialRiskDecision(question: string) {
  const asksForAction = /要不要|该不该|是否|是不是该|能不能|可以不可以|值不值得|适合不适合|选|选择|决定|马上|立刻|现在/.test(
    question,
  );
  const materialRisk = /裸辞|辞职|离职|跳槽|离婚|搬家|借钱|贷款|投资|创业|买房|卖房|退学|休学|移民|手术|数字货币|币|股票|基金|理财|抄底/.test(
    question,
  );

  return asksForAction && materialRisk;
}

function isRelationshipRiskDecision(question: string) {
  return /(?:要不要|该不该|是否|是不是该|决定|马上|现在).{0,12}(?:分手|离开这段关系)|(?:分手|离开这段关系).{0,12}(?:要不要|该不该|是否|是不是该|决定|马上|现在)/.test(
    question,
  );
}

function textWithoutQuotedQuestion(text: string, question: string) {
  const trimmed = question.trim();
  if (!trimmed) return text;

  return text.split(trimmed).join("");
}

export function buildQualityRequirements(input: QualityGateInput): QualityRequirement[] {
  const requirements: QualityRequirement[] = [
    ...input.template.sections.map((section) => ({
      id: `section:${stripSectionNumber(section)}`,
      severity: "repairable" as const,
      description: `必须包含章节：${section}`,
    })),
    {
      id: "first-section-body",
      severity: "repairable",
      description: "第一节必须有正文，不能只有标题。",
    },
    {
      id: "no-absolute-promise",
      severity: "retry",
      description: "不得输出绝对预测、命定承诺或精确结果日期；可以承接用户原问题里的时间背景，但不能把它写成保证。",
    },
  ];

  if (input.requiredCardNames?.length) {
    requirements.push({
      id: "card-grounding",
      severity: "retry",
      description: `必须明确解读抽到的牌：${input.requiredCardNames.join("、")}。`,
    });
  }

  if (isInterviewQuestion(input.question)) {
    requirements.push({
      id: "interview-grounding",
      severity: "retry",
      description: "面试问题必须落到面试准备、现场表达、压力管理和可观察反馈，不得泛化成当前工作要结束。",
    });
  }

  if (isHealthQuestion(input.question)) {
    requirements.push({
      id: "health-safety",
      severity: "retry",
      description: "健康症状问题不得判断严重程度，必须建议持续或加重时寻求医生等专业支持。",
    });
  }

  if (input.userFeedbackTerms?.length) {
    requirements.push({
      id: "user-feedback-grounding",
      severity: "retry",
      description: `必须自然承接用户直觉反馈中的关键词：${input.userFeedbackTerms.join("、")}。`,
    });
  }

  if (input.diagnosis.flags.absolutePrediction || input.diagnosis.flags.preciseTiming) {
    requirements.push({
      id: "absolute-safety-sentence",
      severity: "repairable",
      description: `第一节必须包含安全句：${safeAbsoluteSentence}`,
    });
  }

  if (input.diagnosis.flags.highRiskDecision && isMaterialRiskDecision(input.question)) {
    requirements.push({
      id: "high-risk-checklist",
      severity: "repairable",
      description: "决策前动作必须包含现金流、时间线、替代方案、止损点。",
    });
  }

  if (input.diagnosis.flags.highRiskDecision && isRelationshipRiskDecision(input.question)) {
    requirements.push({
      id: "relationship-risk-boundary",
      severity: "repairable",
      description: `关系重大决定必须包含边界提醒：${relationshipRiskSentence}`,
    });
  }

  if (input.diagnosis.flags.mindReading) {
    requirements.push({
      id: "mind-reading-safety",
      severity: "repairable",
      description: `必须包含读心纠偏：${mindReadingSentence}`,
    });
  }

  const labels = extractChoiceLabels(input.question);
  if (input.template.slug === "path-of-choice" && labels) {
    requirements.push({
      id: "choice-labels",
      severity: "repairable",
      description: `路径 A 必须称为「${labels.a}」，路径 B 必须称为「${labels.b}」。`,
    });
  }

  return requirements;
}

function validateText(
  text: string,
  input: QualityGateInput,
  requirements: QualityRequirement[],
): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const ruleText = textWithoutQuotedQuestion(text, input.question);

  if (text.trim().length < Math.max(180, input.template.length.min * 0.35)) {
    issues.push({
      id: "too-short",
      severity: "retry",
      message: "输出明显过短，可能被截断。",
    });
  }

  input.template.sections.forEach((section, index) => {
    if (!findSection(text, section)) {
      issues.push({
        id: `missing-section:${stripSectionNumber(section)}`,
        severity: "retry",
        message: `缺少章节：${section}`,
      });
      return;
    }

    if (index === 0 && !getSectionBody(text, input.template.sections, 0)) {
      issues.push({
        id: "first-section-body",
        severity: "repairable",
        message: "第一节正文为空。",
      });
    }
  });

  if (
    (absolutePredictionPattern.test(ruleText) || preciseDatePattern.test(ruleText)) &&
    !safetyHedgePattern.test(ruleText)
  ) {
    issues.push({
      id: "absolute-language",
      severity: "repairable",
      message: "包含绝对预测或精确日期表达。",
    });
  }

  if (promptLeakagePattern.test(ruleText)) {
    issues.push({
      id: "prompt-leakage",
      severity: "retry",
      message: "输出暴露了内部提示、模板任务或资料拼接痕迹。",
    });
  }

  if (rawMeaningCopyPattern.test(ruleText)) {
    issues.push({
      id: "raw-meaning-copy",
      severity: "retry",
      message: "输出像直接复制原始牌义资料，或混入繁体资料文本。",
    });
  }

  const requiredCardNames = input.requiredCardNames ?? [];
  if (requiredCardNames.length && !requiredCardNames.every((cardName) => text.includes(cardName))) {
    issues.push({
      id: "missing-card-grounding",
      severity: "retry",
      message: "输出没有明确引用并解读抽到的牌。",
    });
  }

  if (input.template.slug === "single-guidance" && impossibleSingleCardPattern.test(text)) {
    issues.push({
      id: "single-card-structure-drift",
      severity: "retry",
      message: "单张牌解读出现多牌阵结构或明显脱离抽牌事实的表述。",
    });
  }

  const feedbackTerms = input.userFeedbackTerms ?? [];
  if (feedbackTerms.length && !feedbackTerms.some((term) => text.includes(term))) {
    issues.push({
      id: "missing-user-feedback",
      severity: "retry",
      message: "输出没有承接用户提供的直觉反馈。",
    });
  }

  if (input.intentDomain === "career" && /(?:感情[：:]|在感情占卜中|有伴侣者|单身者)/.test(text)) {
    issues.push({
      id: "wrong-domain-copy",
      severity: "retry",
      message: "事业问题混入了感情领域的资料化释义。",
    });
  }

  if (isInterviewQuestion(input.question)) {
    if (!/(?:面试|求职|应聘|简历|面试官|回答)/.test(ruleText)) {
      issues.push({
        id: "missing-interview-grounding",
        severity: "retry",
        message: "面试问题没有回到面试场景。",
      });
    }

    if (/(?:当前工作阶段|工作阶段已经走到|某个工作节奏|某个项目方向|当前工作或事业中|事业中让你感到疲惫|一份工作已经无法|一份工作或一个方向|职场关系出现问题|当前工作中最让我感到疲惫)/.test(ruleText)) {
      issues.push({
        id: "interview-domain-drift",
        severity: "retry",
        message: "面试问题被误读成当前工作结束或职场关系问题。",
      });
    }
  }

  if (isHealthQuestion(input.question)) {
    if (/严重|最后通牒|必须做出选择|被.*压垮|身体.*强制/.test(ruleText)) {
      issues.push({
        id: "health-alarmist-language",
        severity: "retry",
        message: "健康问题措辞过重或像在判断严重程度。",
      });
    }

    if (!/医生|医院|专业支持|专业人士|就医|检查/.test(ruleText)) {
      issues.push({
        id: "health-professional-support",
        severity: "retry",
        message: "健康问题缺少专业支持提醒。",
      });
    }
  }

  if (
    requirements.some((item) => item.id === "absolute-safety-sentence") &&
    !safetyHedgePattern.test(text)
  ) {
    issues.push({
      id: "absolute-safety-sentence",
      severity: "repairable",
      message: "缺少绝对预测纠偏安全句。",
    });
  }

  if (
    input.diagnosis.flags.highRiskDecision &&
    isMaterialRiskDecision(input.question) &&
    !hasHighRiskChecklist(text)
  ) {
    issues.push({
      id: "high-risk-checklist",
      severity: "repairable",
      message: "高风险决策缺少现金流、时间线、替代方案或止损点。",
    });
  }

  if (
    input.diagnosis.flags.highRiskDecision &&
    isRelationshipRiskDecision(input.question) &&
    !/沟通边界|支持系统|可暂停|观察信号|一时情绪/.test(text)
  ) {
    issues.push({
      id: "relationship-risk-boundary",
      severity: "repairable",
      message: "关系重大决定缺少边界提醒。",
    });
  }

  if (
    input.diagnosis.flags.mindReading &&
    !/不替.*内心|不会替.*内心|可观察行为|互动模式/.test(text)
  ) {
    issues.push({
      id: "mind-reading-safety",
      severity: "repairable",
      message: "缺少读心纠偏。",
    });
  }

  const labels = extractChoiceLabels(input.question);
  if (input.template.slug === "path-of-choice" && labels) {
    if (!text.includes(labels.a) || !text.includes(labels.b)) {
      issues.push({
        id: "choice-labels",
        severity: "repairable",
        message: "A/B 路径没有保留用户原始标签。",
      });
    }
  }

  return issues;
}

function repairText(text: string, input: QualityGateInput, issues: QualityIssue[]) {
  let repaired = text.trim();

  if (issues.some((issue) => issue.id === "first-section-body")) {
    repaired = insertAfterFirstHeading(
      repaired,
      input.template,
      "这次牌面先给出一个可验证的方向，而不是替你把现实决定一次性定死。",
    );
  }

  if (
    issues.some(
      (issue) => issue.id === "absolute-safety-sentence" || issue.id === "absolute-language",
    )
  ) {
    repaired = insertAfterFirstHeading(repaired, input.template, safeAbsoluteSentence);
  }

  if (issues.some((issue) => issue.id === "high-risk-checklist")) {
    repaired = insertAfterFirstHeading(repaired, input.template, highRiskSentence);
  }

  if (issues.some((issue) => issue.id === "relationship-risk-boundary")) {
    repaired = insertAfterFirstHeading(repaired, input.template, relationshipRiskSentence);
  }

  if (issues.some((issue) => issue.id === "mind-reading-safety")) {
    repaired = insertAfterFirstHeading(repaired, input.template, mindReadingSentence);
  }

  const labels = extractChoiceLabels(input.question);
  if (labels && issues.some((issue) => issue.id === "choice-labels")) {
    repaired = insertAfterFirstHeading(
      repaired,
      input.template,
      `本次对比中，路径 A 指「${labels.a}」，路径 B 指「${labels.b}」。`,
    );
  }

  return repaired.replace(/\n{3,}/g, "\n\n").trim();
}

export function runQualityGate(text: string, input: QualityGateInput): QualityGateResult {
  const requirements = buildQualityRequirements(input);
  const issues = validateText(text, input, requirements);
  const repairableIssues = issues.filter((issue) => issue.severity === "repairable");
  const repairedText = repairableIssues.length ? repairText(text, input, repairableIssues) : text;
  const postRepairIssues = validateText(repairedText, input, requirements);
  const retryIssues = postRepairIssues.filter((issue) => issue.severity === "retry");

  return {
    text: repairedText,
    requirements,
    issues: postRepairIssues,
    repaired: repairedText !== text,
    needsRetry: retryIssues.length > 0,
  };
}

export function summarizeQualityRequirements(requirements: QualityRequirement[]) {
  return requirements.map((requirement) => `- ${requirement.description}`).join("\n");
}
