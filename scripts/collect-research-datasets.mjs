import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const outDir = path.resolve("tarot-data/source-datasets");
const checkedAt = new Date().toISOString();

const sources = [
  {
    id: "S01",
    name: "A.E. Waite: The Pictorial Key to the Tarot",
    url: "https://sacred-texts.com/tarot/pkt/index.htm",
    sourceType: "public_domain_book",
    authority: "high",
    license: "public_domain",
    usePolicy: "direct_use",
    collectMode: "full_card_meanings",
  },
  {
    id: "S02",
    name: "Biddy Tarot card meanings",
    url: "https://biddytarot.com/tarot-card-meanings/",
    sourceType: "copyrighted_card_meaning_site",
    authority: "high",
    license: "copyright_protected",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S03",
    name: "Labyrinthos tarot meanings list",
    url: "https://labyrinthos.co/blogs/tarot-card-meanings-list",
    sourceType: "copyrighted_card_meaning_site",
    authority: "medium",
    license: "copyright_protected",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S04",
    name: "LearnTarot card meanings",
    url: "https://learntarot.com/card-meanings",
    sourceType: "copyrighted_card_meaning_site",
    authority: "medium",
    license: "copyright_protected",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S05",
    name: "Nes Tarot",
    url: "https://nes-tarot.com/tarot-meanings-us",
    sourceType: "copyright_unclear_card_meaning_site",
    authority: "medium",
    license: "unknown",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S06",
    name: "Mofa Tarot",
    url: "https://mofatarot.com/tarot-learn/wand-cards",
    sourceType: "copyright_unclear_card_meaning_site",
    authority: "medium",
    license: "unknown",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S07",
    name: "The Tarot Lady card meanings",
    url: "https://www.thetarotlady.com/tarot-card-meanings/",
    sourceType: "copyrighted_card_meaning_site",
    authority: "high",
    license: "copyright_protected",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S08",
    name: "American Tarot Association Code of Ethics",
    url: "https://www.americantarot.org/Guidelines/CodeofEthics.pdf",
    sourceType: "tarot_ethics_pdf",
    authority: "high",
    license: "free_distribution_reported",
    usePolicy: "direct_use_summary",
    collectMode: "safety_derivation",
  },
  {
    id: "S09",
    name: "Tarosophy code of ethics",
    url: "https://www.tarotassociation.net/tarosophy-code/",
    sourceType: "tarot_ethics_code",
    authority: "high",
    license: "public_web_reference",
    usePolicy: "direct_use_summary",
    collectMode: "safety_derivation",
  },
  {
    id: "S10",
    name: "Biddy Tarot ethics blog",
    url: "https://biddytarot.com/tarot-spreads/ethics-tarot-reading/",
    sourceType: "copyrighted_ethics_blog",
    authority: "high",
    license: "copyright_protected",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S11",
    name: "TarotBalance FAQ",
    url: "https://tarotbalance.com/tarot-faq",
    sourceType: "copyrighted_ai_tarot_faq",
    authority: "low",
    license: "copyright_protected",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S12",
    name: "Brown University AI chatbots and mental health",
    url: "https://www.brown.edu/news/2025-10-21/ai-chatbots-mental-health",
    sourceType: "ai_safety_research_news",
    authority: "high",
    license: "public_web_reference",
    usePolicy: "direct_use_summary",
    collectMode: "safety_derivation",
  },
  {
    id: "S13",
    name: "Microsoft responsible AI research",
    url: "https://www.microsoft.com/en-us/research/project/responsible-ai/",
    sourceType: "ai_safety_framework",
    authority: "high",
    license: "public_web_reference",
    usePolicy: "direct_use_summary",
    collectMode: "safety_derivation",
  },
  {
    id: "S14",
    name: "FTC inquiry into AI chatbots",
    url: "https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-chatbots",
    sourceType: "government_ai_safety_reference",
    authority: "high",
    license: "public_web_reference",
    usePolicy: "direct_use_summary",
    collectMode: "safety_derivation",
  },
  {
    id: "S15",
    name: "The Print AI performance comparison report",
    url: "https://theprint.in/tech/chatgpt-claude-ai-performance-comparison/",
    sourceType: "secondary_ai_safety_news",
    authority: "medium",
    license: "copyright_protected",
    usePolicy: "reference_rewrite",
    collectMode: "metadata_only",
  },
  {
    id: "S16",
    name: "NIST AI Risk Management Framework 1.0",
    url: "https://www.nist.gov/itl/ai-risk-management-framework-1-0",
    sourceType: "ai_safety_framework",
    authority: "high",
    license: "public_web_reference",
    usePolicy: "direct_use_summary",
    collectMode: "safety_derivation",
  },
  {
    id: "S17",
    name: "Hugging Face Dendory tarot",
    url: "https://huggingface.co/datasets/Dendory/tarot",
    sourceType: "open_dialogue_dataset",
    authority: "low",
    license: "mit_reported",
    usePolicy: "verify_before_use",
    collectMode: "metadata_only",
  },
  {
    id: "S18",
    name: "Hugging Face Blacik tarot-card-meanings-78",
    url: "https://huggingface.co/datasets/Blacik/tarot-card-meanings-78",
    sourceType: "open_card_meaning_dataset",
    authority: "medium",
    license: "cc_by_sa_4_0_reported",
    usePolicy: "verify_before_use",
    collectMode: "metadata_only",
  },
  {
    id: "S19",
    name: "Deckaura tarot-card-meanings PyPI",
    url: "https://pypi.org/project/tarot-card-meanings/",
    sourceType: "open_card_meaning_package",
    authority: "medium",
    license: "mit",
    usePolicy: "direct_use_with_attribution",
    collectMode: "package_metadata",
  },
  {
    id: "S20",
    name: "Wikimedia Commons Rider-Waite tarot deck",
    url: "https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck",
    sourceType: "public_domain_image_repository",
    authority: "high",
    license: "file_level_license",
    usePolicy: "direct_use_after_file_license_check",
    collectMode: "image_metadata",
  },
  {
    id: "S21",
    name: "Metabismuth tarot-json",
    url: "https://github.com/metabismuth/tarot-json",
    sourceType: "open_json_card_dataset",
    authority: "high",
    license: "mit",
    usePolicy: "direct_use",
    collectMode: "full_json_dataset",
  },
  {
    id: "S22",
    name: "TarotSchema",
    url: "https://tarotschema.com",
    sourceType: "open_schema_dataset",
    authority: "high",
    license: "mit_structure_cc_by_4_text",
    usePolicy: "direct_use_with_attribution",
    collectMode: "schema_json_dataset",
  },
  {
    id: "S23",
    name: "a11ce/tarot",
    url: "https://github.com/a11ce/tarot",
    sourceType: "gpl_card_library",
    authority: "medium",
    license: "gpl_3_0",
    usePolicy: "metadata_only",
    collectMode: "metadata_only",
  },
  {
    id: "S24",
    name: "Kaggle complete tarot card meanings",
    url: "https://www.kaggle.com/datasets/morrispoint/complete-tarot-card-meanings-all-78-cards",
    sourceType: "open_card_meaning_dataset",
    authority: "medium",
    license: "cc_by_sa_4_0",
    usePolicy: "verify_before_use",
    collectMode: "metadata_only",
  },
];

const majorNames = [
  "The Magician",
  "The High Priestess",
  "The Empress",
  "The Emperor",
  "The Hierophant",
  "The Lovers",
  "The Chariot",
  "Strength",
  "The Hermit",
  "Wheel of Fortune",
  "Justice",
  "The Hanged Man",
  "Death",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Star",
  "The Moon",
  "The Sun",
  "Judgement",
  "The Fool",
  "The World",
];

const courtRanks = ["King", "Queen", "Knight", "Page"];
const numberRanks = ["Ten", "Nine", "Eight", "Seven", "Six", "Five", "Four", "Three", "Two", "Ace"];
const suits = ["Wands", "Cups", "Swords", "Pentacles"];
const minorNames = suits.flatMap((suit) => [...courtRanks, ...numberRanks].map((rank) => `${rank} of ${suit}`));
const waiteCardNames = [...majorNames, ...minorNames];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&#32;/g, " ")
    .replace(/&#8203;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function fetchTextWithPowerShell(url) {
  const script = [
    "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8",
    `$r=Invoke-WebRequest -UseBasicParsing '${url.replace(/'/g, "''")}' -TimeoutSec 45`,
    "$r.Content",
  ].join("; ");
  return execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
}

function fetchJsonWithPowerShell(url) {
  return JSON.parse(fetchTextWithPowerShell(url));
}

async function fetchWithStatus(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "tarot-app-dataset-audit/1.0",
        accept: options.accept ?? "*/*",
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(url) {
  const response = await fetchWithStatus(url, { accept: "text/html, text/plain, application/json" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchJson(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchWithStatus(url, { accept: "application/json", timeoutMs: 45000 });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
      return response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  try {
    return fetchJsonWithPowerShell(url);
  } catch (error) {
    throw lastError ?? error;
  }
}

async function auditSource(source) {
  try {
    const response = await fetchWithStatus(source.url, { timeoutMs: 15000 });
    return {
      ...source,
      checkedAt,
      httpStatus: response.status,
      ok: response.ok,
      finalUrl: response.url,
      contentType: response.headers.get("content-type") ?? null,
    };
  } catch (error) {
    return {
      ...source,
      checkedAt,
      httpStatus: null,
      ok: false,
      finalUrl: null,
      contentType: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function collectWaite() {
  const sourceUrl = "https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot/Part_3";
  let html;
  try {
    html = await fetchText(sourceUrl);
  } catch {
    html = fetchTextWithPowerShell(sourceUrl);
  }

  const plain = stripHtml(html)
    .replace(/\s+\.\s+—/g, ".—")
    .replace(/\s+\.—/g, ".—")
    .replace(/Reversed&#160;:/g, "Reversed:")
    .replace(/\s+/g, " ");

  const cards = [];
  const minorSection = plain.slice(plain.indexOf("THE SUIT OF WANDS"), plain.indexOf("§ 3 THE GREATER ARCANA"));
  const greaterSection = plain.slice(
    plain.indexOf("§ 3 THE GREATER ARCANA"),
    plain.indexOf("§ 4 SOME ADDITIONAL MEANINGS"),
  );

  for (const suit of suits) {
    const suitStart = minorSection.indexOf(`THE SUIT OF ${suit.toUpperCase()}`);
    const nextSuit = suits[suits.indexOf(suit) + 1];
    const suitEnd = nextSuit ? minorSection.indexOf(`THE SUIT OF ${nextSuit.toUpperCase()}`) : minorSection.length;
    const section = minorSection.slice(suitStart, suitEnd);
    const ranks = [...courtRanks, ...numberRanks];

    const headingPositions = ranks
      .map((rank) => {
        const marker =
          rank === "King" ? `THE SUIT OF ${suit.toUpperCase()} ${rank}` : `${suit.toUpperCase()} ${rank}`;
        return {
          rank,
          marker,
          start: section.indexOf(marker),
        };
      })
      .filter((item) => item.start >= 0)
      .sort((a, b) => a.start - b.start);

    for (let index = 0; index < headingPositions.length; index += 1) {
      const { rank, marker, start } = headingPositions[index];
      const end = headingPositions[index + 1]?.start ?? section.length;
      const cardText = section.slice(start + marker.length, end).trim();
      const divinatoryStart = cardText.search(/Divinatory Meanings:/i);
      const reversedStart = cardText.search(/Reversed[:;]/i);
      const name = `${rank} of ${suit}`;
      cards.push({
        sourceId: "S01",
        sourceUrl,
        cardName: name,
        slug: slugify(name),
        arcana: "minor",
        suit: suit.toLowerCase(),
        status: "collected",
        description: divinatoryStart > -1 ? cardText.slice(0, divinatoryStart).trim() : "",
        upright:
          divinatoryStart > -1
            ? cardText
                .slice(divinatoryStart, reversedStart > -1 ? reversedStart : undefined)
                .replace(/^Divinatory Meanings:\s*/i, "")
                .trim()
            : "",
        reversed:
          reversedStart > -1
            ? cardText
                .slice(reversedStart)
                .replace(/^Reversed[:;]\s*/i, "")
                .trim()
            : "",
      });
    }
  }

  const majorPatterns = [
    ["1.", "The Magician"],
    ["2.", "The High Priestess"],
    ["3.", "The Empress"],
    ["4.", "The Emperor"],
    ["5.", "The Hierophant"],
    ["6.", "The Lovers"],
    ["7.", "The Chariot"],
    ["8.", "Fortitude"],
    ["9.", "The Hermit"],
    ["10.", "Wheel of Fortune"],
    ["11.", "Justice"],
    ["12.", "The Hanged Man"],
    ["13.", "Death"],
    ["14.", "Temperance"],
    ["15.", "The Devil"],
    ["16.", "The Tower"],
    ["17.", "The Star"],
    ["18.", "The Moon"],
    ["19.", "The Sun"],
    ["20.", "The Last Judgment"],
    ["Zero.", "The Fool"],
    ["21.", "The World"],
  ];

  for (const [prefix, label] of majorPatterns) {
    const marker = `${prefix} ${label}.—`;
    const start = greaterSection.indexOf(marker);
    if (start < 0) continue;
    const after = greaterSection.slice(start + marker.length);
    const nextStarts = majorPatterns
      .filter((item) => item[1] !== label)
      .map(([nextPrefix, nextLabel]) => after.indexOf(`${nextPrefix} ${nextLabel}.—`))
      .filter((index) => index > 0);
    const end = nextStarts.length ? Math.min(...nextStarts) : after.length;
    const cardText = after.slice(0, end).trim();
    const reversedStart = cardText.search(/Reversed\s*[:;]/i);
    const cardName = label === "Fortitude" ? "Strength" : label === "The Last Judgment" ? "Judgement" : label;
    cards.push({
      sourceId: "S01",
      sourceUrl,
      cardName,
      slug: slugify(cardName),
      arcana: "major",
      suit: null,
      status: "collected",
      description: "",
      upright: (reversedStart > -1 ? cardText.slice(0, reversedStart) : cardText).trim(),
      reversed:
        reversedStart > -1
          ? cardText
              .slice(reversedStart)
              .replace(/^Reversed\s*[:;]\s*/i, "")
              .trim()
          : "",
    });
  }

  return {
    sourceId: "S01",
    title: "The Pictorial Key to the Tarot card meanings",
    sourceUrl,
    license: "public_domain",
    checkedAt,
    cardCount: cards.filter((card) => card.status === "collected").length,
    cards,
  };
}

async function collectMetabismuth() {
  const [tarot, images] = await Promise.all([
    fetchJson("https://raw.githubusercontent.com/metabismuth/tarot-json/master/tarot.json"),
    fetchJson("https://raw.githubusercontent.com/metabismuth/tarot-json/master/tarot-images.json"),
  ]);

  return {
    sourceId: "S21",
    sourceUrl: "https://github.com/metabismuth/tarot-json",
    license: "MIT",
    checkedAt,
    tarot,
    images,
  };
}

async function collectTarotSchema() {
  const spreads = await fetchJson("https://tarotschema.com/spreads-schema.json").catch(() =>
    fetchJson("https://tarotsmith.com/spreads-schema.json"),
  );
  const decks = await fetchJson("https://tarotschema.com/decks-schema.json").catch(() =>
    fetchJson("https://tarotsmith.com/decks-schema.json"),
  );

  return {
    sourceId: "S22",
    sourceUrl: "https://tarotschema.com",
    license: "MIT structure; CC-BY 4.0 written content",
    attributionRequired: true,
    checkedAt,
    spreads,
    decks,
  };
}

async function collectWikimediaImages() {
  const api = "https://commons.wikimedia.org/w/api.php";
  const categories = [
    "Category:Rider-Waite tarot deck",
    "Category:The Pictorial Key to the Tarot",
    "Category:Rider-Waite tarot deck (Roses & Lilies)",
  ];
  const files = [];

  for (const category of categories) {
    let cmcontinue = null;
    do {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        generator: "categorymembers",
        gcmtitle: category,
        gcmtype: "file",
        gcmlimit: "500",
        prop: "imageinfo",
        iiprop: "url|mime|size|extmetadata",
      });
      if (cmcontinue) params.set("gcmcontinue", cmcontinue);
      const data = await fetchJson(`${api}?${params.toString()}`);
      const pages = Object.values(data.query?.pages ?? {});
      for (const page of pages) {
        const info = page.imageinfo?.[0] ?? {};
        files.push({
          sourceId: "S20",
          category,
          title: page.title,
          pageid: page.pageid,
          url: info.url ?? null,
          descriptionUrl: info.descriptionurl ?? null,
          mime: info.mime ?? null,
          width: info.width ?? null,
          height: info.height ?? null,
          licenseShortName: info.extmetadata?.LicenseShortName?.value ?? null,
          licenseUrl: info.extmetadata?.LicenseUrl?.value ?? null,
          usageTerms: info.extmetadata?.UsageTerms?.value ?? null,
          artist: stripHtml(info.extmetadata?.Artist?.value ?? ""),
          credit: stripHtml(info.extmetadata?.Credit?.value ?? ""),
        });
      }
      cmcontinue = data.continue?.gcmcontinue ?? null;
    } while (cmcontinue);
  }

  const unique = new Map(files.map((file) => [file.title, file]));
  return {
    sourceId: "S20",
    sourceUrl: "https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck",
    checkedAt,
    fileCount: unique.size,
    files: [...unique.values()].sort((a, b) => a.title.localeCompare(b.title)),
  };
}

async function collectPypiMetadata() {
  const data = await fetchJson("https://pypi.org/pypi/tarot-card-meanings/json");
  return {
    sourceId: "S19",
    sourceUrl: "https://pypi.org/project/tarot-card-meanings/",
    checkedAt,
    package: {
      name: data.info?.name,
      version: data.info?.version,
      summary: data.info?.summary,
      license: data.info?.license,
      projectUrls: data.info?.project_urls,
      classifiers: data.info?.classifiers,
    },
    releases: Object.entries(data.releases ?? {}).map(([version, files]) => ({
      version,
      files: files.map((file) => ({
        filename: file.filename,
        packagetype: file.packagetype,
        pythonVersion: file.python_version,
        size: file.size,
        uploadTime: file.upload_time_iso_8601,
        digests: file.digests,
        url: file.url,
      })),
    })),
  };
}

function buildSafetyRules() {
  return [
    {
      id: "self_harm_crisis",
      riskType: "self_harm_or_immediate_crisis",
      riskLevel: "blocked",
      sourceIds: ["S12", "S13", "S14", "S16"],
      triggers: ["自杀", "不想活", "自残", "伤害自己", "结束生命", "撑不下去"],
      forbidden: ["继续占卜预测", "把危机解释成命运或业力", "给延迟求助建议"],
      requiredResponse: ["停止占卜流程", "建议立即联系当地紧急服务或可信任的人", "鼓励寻求专业危机支持"],
      backendHardControl: true,
    },
    {
      id: "medical_boundary",
      riskType: "medical_or_health_advice",
      riskLevel: "boundary_only",
      sourceIds: ["S08", "S12", "S16"],
      triggers: ["疾病", "症状", "诊断", "治疗", "吃药", "手术", "怀孕", "疼痛", "失眠"],
      forbidden: ["诊断", "判断病情严重程度", "建议停药", "保证没事", "替代医生"],
      requiredResponse: ["说明不提供医疗判断", "可整理压力和照护线索", "建议症状持续或加重时寻求专业医疗支持"],
      backendHardControl: true,
    },
    {
      id: "legal_boundary",
      riskType: "legal_advice_or_case_prediction",
      riskLevel: "boundary_only",
      sourceIds: ["S08", "S09", "S16"],
      triggers: ["法院", "官司", "起诉", "胜诉", "败诉", "律师", "合同", "判决"],
      forbidden: ["预测胜诉败诉", "给法律意见", "鼓励冲动诉讼", "替律师判断"],
      requiredResponse: ["说明不是法律意见", "建议整理事实、证据和沟通记录", "建议咨询合格法律专业人士"],
      backendHardControl: true,
    },
    {
      id: "financial_boundary",
      riskType: "financial_or_investment_advice",
      riskLevel: "boundary_only",
      sourceIds: ["S08", "S16"],
      triggers: ["股票", "基金", "数字货币", "抄底", "梭哈", "贷款", "借钱", "买房", "投资"],
      forbidden: ["承诺收益", "给买卖点", "鼓励重仓", "建议借钱投资"],
      requiredResponse: ["转成风险承受度和现金流盘点", "建议独立核验信息", "必要时咨询持牌专业人士"],
      backendHardControl: true,
    },
    {
      id: "third_party_privacy",
      riskType: "third_party_mind_reading_or_privacy",
      riskLevel: "caution",
      sourceIds: ["S08", "S09"],
      triggers: ["他怎么想", "她怎么想", "TA怎么想", "对方心里", "是不是有别人", "爱不爱我"],
      forbidden: ["替第三方下内心结论", "断言背叛", "窥探隐私", "性别化默认称呼"],
      requiredResponse: ["回到可观察行为", "使用TA或对方", "关注用户感受和边界动作"],
      backendHardControl: true,
    },
    {
      id: "absolute_prediction",
      riskType: "absolute_or_precise_prediction",
      riskLevel: "caution",
      sourceIds: ["S08", "S13", "S16"],
      triggers: ["一定", "必然", "注定", "百分百", "具体哪天", "什么时候会"],
      forbidden: ["给绝对结论", "给精确日期", "命定论表达"],
      requiredResponse: ["改成趋势、条件和观察窗口", "保留用户选择权", "给可控行动"],
      backendHardControl: true,
    },
  ];
}

function buildDatasetManifest(files) {
  return {
    generatedAt: checkedAt,
    sourceReport: "tarot-data/deep-research-report (3).md",
    policy: {
      directUse: "Only public-domain, MIT, CC-BY/CC0, or similarly reusable data is saved as reusable data.",
      restrictedUse: "Copyrighted or unclear sources are metadata-only and must be rewritten by humans before product use.",
      attribution: "TarotSchema CC-BY written content and Wikimedia file-level licenses require attribution when surfaced.",
    },
    files,
  };
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const auditedSources = await Promise.all(sources.map((source) => auditSource(source)));

  const files = [];
  async function saveJson(name, data) {
    const target = path.join(outDir, name);
    await writeFile(target, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    files.push({
      file: `tarot-data/source-datasets/${name}`,
      records: Array.isArray(data)
        ? data.length
        : data.cards?.length ?? data.files?.length ?? data.releases?.length ?? data.spreads?.length ?? null,
    });
  }

  await saveJson("source_registry.verified.json", auditedSources);
  await saveJson("waite_pictorial_key_cards.json", await collectWaite());
  await saveJson("metabismuth_tarot_json.json", await collectMetabismuth());
  await saveJson("tarotschema_schema.json", await collectTarotSchema());
  await saveJson("wikimedia_rws_images.json", await collectWikimediaImages());
  await saveJson("deckaura_pypi_metadata.json", await collectPypiMetadata());
  await saveJson("derived_safety_rules.json", {
    generatedAt: checkedAt,
    note: "Project-owned safety rules derived from reusable ethics and AI-safety references; not copied from copyrighted text.",
    rules: buildSafetyRules(),
  });
  await saveJson("manifest.json", buildDatasetManifest(files));

  console.log(JSON.stringify(buildDatasetManifest(files), null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
