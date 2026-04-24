import type { Suit, TarotCard } from "@/lib/tarot/types";
import { slugify } from "@/lib/utils";

type MinorRankKey =
  | "ace"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "eight"
  | "nine"
  | "ten"
  | "page"
  | "knight"
  | "queen"
  | "king";

type MinorSeed = {
  key: MinorRankKey;
  keywordsUpright: string[];
  keywordsReversed: string[];
  meaningUpright: string;
  meaningReversed: string;
  loveMeaning: string;
  careerMeaning: string;
};

const rankMeta: Record<
  MinorRankKey,
  {
    number: number;
    zh: string;
    en: string;
  }
> = {
  ace: { number: 1, zh: "王牌", en: "Ace" },
  two: { number: 2, zh: "二", en: "Two" },
  three: { number: 3, zh: "三", en: "Three" },
  four: { number: 4, zh: "四", en: "Four" },
  five: { number: 5, zh: "五", en: "Five" },
  six: { number: 6, zh: "六", en: "Six" },
  seven: { number: 7, zh: "七", en: "Seven" },
  eight: { number: 8, zh: "八", en: "Eight" },
  nine: { number: 9, zh: "九", en: "Nine" },
  ten: { number: 10, zh: "十", en: "Ten" },
  page: { number: 11, zh: "侍者", en: "Page" },
  knight: { number: 12, zh: "骑士", en: "Knight" },
  queen: { number: 13, zh: "王后", en: "Queen" },
  king: { number: 14, zh: "国王", en: "King" },
};

const suitMeta: Record<
  Suit,
  {
    zh: string;
    en: string;
  }
> = {
  cups: { zh: "圣杯", en: "Cups" },
  wands: { zh: "权杖", en: "Wands" },
  swords: { zh: "宝剑", en: "Swords" },
  pentacles: { zh: "钱币", en: "Pentacles" },
};

const minorSeedsBySuit: Record<Suit, MinorSeed[]> = {
  cups: [
    {
      key: "ace",
      keywordsUpright: ["情感开启", "直觉流动", "心门打开", "疗愈潜能"],
      keywordsReversed: ["情绪堵塞", "压抑感受", "关系回避", "爱意失衡"],
      meaningUpright: "情感开始重新流动，你更愿意诚实面对自己的感受，也更容易接住外界的善意与回应。",
      meaningReversed: "情绪被压住或溢出，表面平静不代表真的稳定，真正的问题是你还没有找到安全表达的方式。",
      loveMeaning: "关系里适合重新打开心门，主动表达善意或接受靠近；单身时也常是新的情感机会开始萌芽。",
      careerMeaning: "工作上像是投入感回来了，适合启动需要热情、审美、共情或创作的事情。",
    },
    {
      key: "two",
      keywordsUpright: ["互相吸引", "平等交流", "结盟", "关系靠近"],
      keywordsReversed: ["关系失衡", "误解加深", "信任受损", "情绪脱节"],
      meaningUpright: "双方愿意看见彼此，关系、合作或谈判进入可以真正对接的阶段。",
      meaningReversed: "表面还在互动，实则节奏和期待已经错位，不把问题说开只会继续消耗信任。",
      loveMeaning: "爱情里对应双向靠近、坦诚互动和关系确认；逆位则更像误解积压、拉扯加重或关系不对等。",
      careerMeaning: "事业上利于合作、签约和互补搭档；逆位提醒合作边界、分工和承诺没有对齐。",
    },
    {
      key: "three",
      keywordsUpright: ["庆祝", "社交支持", "轻松连结", "共享喜悦"],
      keywordsReversed: ["情绪过量", "圈层排斥", "第三方干扰", "表面热闹"],
      meaningUpright: "你可以从朋友、社群或熟人网络中得到支持，气氛更适合庆祝、共享和放松。",
      meaningReversed: "热闹不等于真连结，关系里可能掺杂八卦、比较或第三方因素，让情绪变得复杂。",
      loveMeaning: "适合朋友变恋人、一起出行或把关系从封闭压力里带回轻松互动；逆位要留意暧昧混线和外界干扰。",
      careerMeaning: "团队合作、社群传播和活动项目更容易推进；逆位则说明协作松散、责任不清或社交消耗过多。",
    },
    {
      key: "four",
      keywordsUpright: ["冷淡观望", "内在抽离", "情绪停滞", "重新审视"],
      keywordsReversed: ["重新感受", "愿意接住机会", "走出麻木", "情绪回温"],
      meaningUpright: "你不是没有机会，而是对眼前的一切提不起劲，情绪需要先被看见，行动才会重新启动。",
      meaningReversed: "你开始愿意把注意力从封闭状态拉回来，新的情感或机会也因此重新进入视野。",
      loveMeaning: "感情里常是心累、无感或对同样循环感到厌倦；逆位则表示愿意重新沟通、再给关系一次机会。",
      careerMeaning: "工作上要警惕倦怠和低投入；逆位适合重新找回兴趣点，接住之前忽略的资源。",
    },
    {
      key: "five",
      keywordsUpright: ["失落", "遗憾", "哀伤", "只看见损失"],
      keywordsReversed: ["走出悲伤", "开始修复", "接纳过去", "重新拾起希望"],
      meaningUpright: "你正在被失去感占据视线，问题不只是事情结束，而是你还没允许自己完成情绪上的告别。",
      meaningReversed: "悲伤仍在，但你已经开始回头看见还剩下什么，也更接近真正的复原与转身。",
      loveMeaning: "爱情里多与失望、分离、关系落空有关；逆位说明你在慢慢接受现实，准备重新出发。",
      careerMeaning: "事业上可能是项目受挫、机会流失或信心受打击；逆位则是复盘后重新站稳。",
    },
    {
      key: "six",
      keywordsUpright: ["怀旧", "善意", "旧情回流", "单纯连接"],
      keywordsReversed: ["沉溺过去", "幼态模式", "无法长大", "旧事牵绊"],
      meaningUpright: "过去的人事物带着温柔回流，提醒你看见初心、善意与那些真正滋养过你的连结。",
      meaningReversed: "你可能把熟悉误当安全，把回忆误当答案，真正卡住你的是不愿走出旧模式。",
      loveMeaning: "旧情、旧人、熟悉感和纯粹陪伴都可能被唤起；逆位则要区分是真想修复，还是只是不舍得放下。",
      careerMeaning: "适合回顾经验、借力旧资源或处理老客户；逆位提醒别让旧流程绑住成长。",
    },
    {
      key: "seven",
      keywordsUpright: ["幻想", "多重选择", "诱惑", "判断模糊"],
      keywordsReversed: ["看清现实", "收束选择", "停止空想", "回到重点"],
      meaningUpright: "可能性很多，但并非每个选项都值得投入，现在更需要分辨真实机会和情绪投射。",
      meaningReversed: "迷雾开始散去，你知道不能再同时抓住所有可能，接下来关键是做出收束与承诺。",
      loveMeaning: "感情里常见于理想化、暧昧过多或对关系抱有投射；逆位说明你开始看清谁值得认真投入。",
      careerMeaning: "事业上像是方向太多、灵感太散或被包装吸引；逆位适合聚焦真正能落地的一条线。",
    },
    {
      key: "eight",
      keywordsUpright: ["主动离开", "寻找意义", "情感抽身", "放下旧局"],
      keywordsReversed: ["不敢离开", "来回徘徊", "舍不得放手", "停在原地"],
      meaningUpright: "你知道仅靠维持现状已经不够，离开不是冲动，而是对更真实需求的回应。",
      meaningReversed: "你明知不适合，却仍在原地打转，真正拖住你的往往不是环境，而是放手前的恐惧。",
      loveMeaning: "关系里可能是准备离开无爱状态，或主动结束耗损性的互动；逆位则是想走又走不掉。",
      careerMeaning: "工作上适合离开失去意义的路径，寻找更有价值感的方向；逆位说明你在犹豫中持续内耗。",
    },
    {
      key: "nine",
      keywordsUpright: ["满足", "愿望实现", "情绪丰盛", "享受成果"],
      keywordsReversed: ["空心满足", "过度放纵", "期待过高", "自满失衡"],
      meaningUpright: "你有机会享受阶段性成果，感到满足、舒展，也更愿意承认自己值得被好好对待。",
      meaningReversed: "外在看起来不错，内心却未必真满足，若只追求即时愉悦，很容易忽略更深层的空缺。",
      loveMeaning: "爱情里是被宠爱、愿望靠近和关系里的幸福感；逆位提醒别把浪漫表象误当真正满足。",
      careerMeaning: "事业上可见阶段成绩、资源回报和自我肯定；逆位则提示虚荣、松懈或目标感变浅。",
    },
    {
      key: "ten",
      keywordsUpright: ["情感圆满", "家庭和谐", "关系归属", "长久幸福"],
      keywordsReversed: ["表面和谐", "家人张力", "理想化家庭", "情感落差"],
      meaningUpright: "这是情感层面的完整感，关系、家庭或内心归属感有机会进入更稳定的圆满状态。",
      meaningReversed: "你追求的圆满并没有真正落地，问题往往在于大家都想维持表面，而不愿面对深层不协调。",
      loveMeaning: "适合谈长期、同居、婚姻或更稳定的家庭式连结；逆位则代表家庭压力、价值观差异或关系表里不一。",
      careerMeaning: "工作上常是团队氛围和谐、长期合作稳定；逆位提醒别用漂亮愿景掩盖结构问题。",
    },
    {
      key: "page",
      keywordsUpright: ["感受敏锐", "情感讯息", "柔软好奇", "创意萌芽"],
      keywordsReversed: ["情绪幼态", "过度脆弱", "讯息失真", "不够负责"],
      meaningUpright: "新的情感讯号或灵感正在靠近，你需要用开放但不失边界的方式去接收它。",
      meaningReversed: "直觉和感受并非失效，而是被不稳定情绪干扰，导致你容易反应过度或说不清真实需求。",
      loveMeaning: "爱情里是心动、试探、浪漫讯号和愿意坦露脆弱；逆位提示情绪化表达、忽冷忽热或不够成熟。",
      careerMeaning: "事业上适合学习新方向、尝试创意表达或接新消息；逆位则说明执行经验不足，容易停在设想。",
    },
    {
      key: "knight",
      keywordsUpright: ["浪漫追求", "顺着感觉前进", "温柔行动", "邀请靠近"],
      keywordsReversed: ["情绪逃避", "理想化承诺", "反复无常", "不切实际"],
      meaningUpright: "你更愿意顺着心里的召唤行动，带着浪漫、温柔和想象力去靠近某个目标。",
      meaningReversed: "感受很多、行动也不算少，但容易被理想化牵着走，承诺和现实之间存在落差。",
      loveMeaning: "适合主动示好、表白、约会和制造情感流动；逆位则要警惕甜言蜜语、反复承诺或情绪逃避。",
      careerMeaning: "工作上利于提案、创意、艺术表达和对外沟通；逆位说明计划动人但落地度不足。",
    },
    {
      key: "queen",
      keywordsUpright: ["温柔洞察", "共情", "直觉成熟", "柔软边界"],
      keywordsReversed: ["情绪泛滥", "过度投射", "依赖关系", "内耗敏感"],
      meaningUpright: "你能用成熟的感受力理解局势，既保留温柔，也知道什么时候该守住自己的边界。",
      meaningReversed: "你过于容易被情绪带着走，别人的需求、评价和气氛都可能挤占你的内在空间。",
      loveMeaning: "感情里很适合深层沟通、照顾关系和接住彼此脆弱；逆位提示过度牺牲、自我迷失或情绪勒索。",
      careerMeaning: "事业上有利于咨询、照护、创意与需要高共情的工作；逆位说明情绪劳动过重，容易被人际拖垮。",
    },
    {
      key: "king",
      keywordsUpright: ["情绪成熟", "稳重包容", "慈悲有界", "温和主导"],
      keywordsReversed: ["情绪控制", "压抑感受", "冷处理", "操纵关系"],
      meaningUpright: "你有能力稳住情绪与氛围，用成熟、包容但不失原则的方式处理复杂关系。",
      meaningReversed: "表面冷静不等于成熟，若一直靠压抑、回避或情绪控制维持秩序，问题只会转入更深层。",
      loveMeaning: "爱情里代表可靠、能接住情绪的人，也适合谈承诺；逆位则像情绪封闭、若即若离或关系操控。",
      careerMeaning: "事业上利于管理、带人和稳定团队气氛；逆位提示你可能过度压抑真实问题，管理方式也容易失去温度。",
    },
  ],
  wands: [
    {
      key: "ace",
      keywordsUpright: ["火花启动", "热情", "主动出击", "创造力"],
      keywordsReversed: ["起步受阻", "热度不足", "消耗过快", "动力分散"],
      meaningUpright: "新的行动火花已经点燃，重点不是等完美时机，而是趁热把想法推到现实里。",
      meaningReversed: "你并非没有想法，而是动力被拖住或烧得太快，需要先清理分心和迟疑。",
      loveMeaning: "关系里有明显吸引力、行动意愿和推进热度；逆位提醒别只靠一时冲动制造靠近。",
      careerMeaning: "事业上适合启动项目、发起提案和打开新方向；逆位则说明资源与动力还没真正聚焦。",
    },
    {
      key: "two",
      keywordsUpright: ["规划前景", "远望", "布局", "准备扩张"],
      keywordsReversed: ["犹豫观望", "畏惧变化", "控制欲", "计划卡住"],
      meaningUpright: "你已经站上新的起点，现在更需要做的是看清远方、选定方向，并为扩张预留空间。",
      meaningReversed: "想前进又怕失控，导致你把时间耗在反复比较和过度规划上，行动迟迟起不来。",
      loveMeaning: "感情里常是思考要不要把关系往下一阶段推进；逆位则像想靠近却迟迟不敢做决定。",
      careerMeaning: "工作上适合中期规划、开新市场或为下一步布阵；逆位提示犹豫和保守正在拖慢机会。",
    },
    {
      key: "three",
      keywordsUpright: ["扩张", "前景打开", "等待回报", "协同推进"],
      keywordsReversed: ["延迟", "视野受限", "协作不顺", "推进变慢"],
      meaningUpright: "前期投入开始显现回响，你需要带着远见继续布局，而不是只盯眼前结果。",
      meaningReversed: "事情并非彻底停住，而是合作、节奏或判断还没形成合力，导致推进慢于预期。",
      loveMeaning: "适合把关系从局部互动推向更明确的未来感；逆位则说明双方节奏不同，期待未真正同步。",
      careerMeaning: "事业上利于扩张、跨团队协作和等待前期布局回收；逆位提醒协调成本和信息误差。",
    },
    {
      key: "four",
      keywordsUpright: ["庆典", "稳定落地", "里程碑", "归属感"],
      keywordsReversed: ["基础不稳", "表面庆祝", "家庭张力", "内部松动"],
      meaningUpright: "这是阶段性稳定与庆祝的牌，代表事情已经走出起步期，能暂时站稳脚跟。",
      meaningReversed: "表面像是到了可以松一口气的时候，但基础仍有松动，内部协调和安全感还不够。",
      loveMeaning: "常见于确定关系、见家人、共同生活或公开状态；逆位提醒关系的稳定感可能只是暂时的。",
      careerMeaning: "工作上是项目节点、团队成果或组织归属感提升；逆位则提示庆祝太早，底层结构还要补。",
    },
    {
      key: "five",
      keywordsUpright: ["竞争", "摩擦", "意见碰撞", "能量分散"],
      keywordsReversed: ["避战", "压抑冲突", "斗志耗尽", "暗中较劲"],
      meaningUpright: "周围声音很多，竞争和摩擦都在升级，关键不是消灭冲突，而是别让能量白白耗散。",
      meaningReversed: "冲突不一定消失了，只是转入闷着不说或彼此消极拉扯，久了更容易失真。",
      loveMeaning: "关系里可能是争强、互不相让或同一问题反复争执；逆位代表冷战、躲冲突或把不满憋住。",
      careerMeaning: "事业上常是竞争上升、团队意见打架或资源争夺；逆位提示低效内耗比正面争论更伤。 ",
    },
    {
      key: "six",
      keywordsUpright: ["胜利", "被看见", "进展顺势", "认可"],
      keywordsReversed: ["虚荣驱动", "认可延迟", "名不副实", "自信动摇"],
      meaningUpright: "你有机会在阶段性竞争中胜出，成果更容易被看见，也更容易得到外部认可。",
      meaningReversed: "真正的问题可能不是没有成绩，而是太在意外部掌声，导致节奏被评价牵着走。",
      loveMeaning: "感情里可见主动推进、关系被公开或彼此更愿意给回应；逆位提醒别把面子和占有欲当作爱。 ",
      careerMeaning: "事业上利于曝光、晋升、发布和拿到反馈；逆位则说明成果展示与真实实力之间有落差。",
    },
    {
      key: "seven",
      keywordsUpright: ["守住立场", "高地", "迎战压力", "不退让"],
      keywordsReversed: ["防御过度", "撑不住", "立场动摇", "被压力吞没"],
      meaningUpright: "你需要守住已经争取到的位置，不必讨好所有人，但要知道自己到底在捍卫什么。",
      meaningReversed: "长期应战让你疲惫、防御和焦躁，如果只是机械硬撑，迟早会被压力反噬。",
      loveMeaning: "关系里常是边界之争、谁让谁一步的问题；逆位提醒过度防卫会让沟通彻底失效。",
      careerMeaning: "工作上要守住原则、成果或岗位空间；逆位则说明持续对抗正在消耗你的判断力。",
    },
    {
      key: "eight",
      keywordsUpright: ["快速推进", "消息到来", "节奏拉快", "方向成形"],
      keywordsReversed: ["延误", "讯息混乱", "急躁失准", "推进打结"],
      meaningUpright: "事情开始加速，信息、机会和行动都在靠近，现在更需要顺势而动，而不是继续拖。",
      meaningReversed: "不是不能动，而是速度快于整合能力，导致方向、沟通或执行连续失误。",
      loveMeaning: "感情里是聊天升温、见面推进、关系节奏明显变快；逆位则要警惕误会、爽约和急于定义。",
      careerMeaning: "事业上适合快速沟通、推进流程和响应窗口期；逆位说明节奏乱了，越急越容易出错。",
    },
    {
      key: "nine",
      keywordsUpright: ["坚持到底", "警觉", "受伤后防守", "最后一搏"],
      keywordsReversed: ["疲惫不堪", "草木皆兵", "准备放弃", "消耗过度"],
      meaningUpright: "你已经走到关键阶段，虽然累，但也积累了经验，现在更需要有意识地守住最后一段路。",
      meaningReversed: "防御系统开太久会让人先耗垮自己，这张牌提醒你别再用硬撑代替恢复。",
      loveMeaning: "关系里往往是旧伤未愈、因此高度警觉；逆位说明你可能因为太累而不想再沟通。",
      careerMeaning: "工作上是高压尾声、冲刺节点和谨慎守成；逆位则提示倦怠已经影响判断与执行。",
    },
    {
      key: "ten",
      keywordsUpright: ["负重前行", "责任堆积", "硬扛", "快到极限"],
      keywordsReversed: ["卸下负担", "责任重分", "撑不住了", "学会放手"],
      meaningUpright: "你把太多任务、期待或责任都扛在自己身上，问题不只是累，而是已经影响效率与判断。",
      meaningReversed: "是时候停止逞强，重新分配责任、舍弃不必要负荷，局势才会真正变轻。",
      loveMeaning: "感情里可能是一方长期在扛关系、扛情绪或扛现实压力；逆位说明该谈分担和边界了。",
      careerMeaning: "事业上是典型过载、职责蔓延和硬撑局面；逆位提醒授权、减法和资源重排比继续拼更重要。",
    },
    {
      key: "page",
      keywordsUpright: ["探索", "新计划", "灵感冒头", "主动试水"],
      keywordsReversed: ["鲁莽试错", "有热情没落地", "幼稚表达", "三分钟热度"],
      meaningUpright: "你对新机会保持好奇和冲劲，适合先试、先做、先让火花落地。",
      meaningReversed: "热情不是问题，问题是缺乏耐性和结构，导致你容易一下子点燃、一下子熄火。",
      loveMeaning: "爱情里是主动追求、玩心、暧昧和鲜活吸引；逆位则提示口嗨、忽冷忽热或不够负责。",
      careerMeaning: "事业上适合试新项目、做原型和小步快跑；逆位说明执行经验不足，容易虎头蛇尾。",
    },
    {
      key: "knight",
      keywordsUpright: ["冲锋", "冒险精神", "高行动力", "热烈推进"],
      keywordsReversed: ["鲁莽", "脾气急", "不稳定", "推进过头"],
      meaningUpright: "行动欲非常强，适合破局、出击和快速拉动气氛，但要记得方向比速度更重要。",
      meaningReversed: "你可能太想证明自己，以至于推进方式变得急躁、失控甚至伤人。",
      loveMeaning: "感情里是强烈追求、主动示爱和迅速升温；逆位则常见于暧昧上头、承诺不稳或来得快去得也快。",
      careerMeaning: "工作上适合攻坚、拓展和抢先机；逆位提示冲太猛、情绪化决策或与人硬碰硬。",
    },
    {
      key: "queen",
      keywordsUpright: ["自信发光", "魅力", "热情管理", "创造领导"],
      keywordsReversed: ["嫉妒", "情绪易燃", "控制欲", "戏剧化"],
      meaningUpright: "你能够把热情稳定地转化为影响力，既有存在感，也有带动周围人的能力。",
      meaningReversed: "若热情失去中心，就容易变成急躁、较劲或用强烈情绪掌控场面。",
      loveMeaning: "关系里很有吸引力和主导感，也适合把热度带回生活；逆位则要留意占有欲和情绪化拉扯。",
      careerMeaning: "事业上适合带团队、做品牌、做表达和推进创意；逆位说明 ego 和情绪管理会成为绊脚石。",
    },
    {
      key: "king",
      keywordsUpright: ["愿景领导", "掌舵", "行动魄力", "创业能量"],
      keywordsReversed: ["专断", "急于控制", "自我中心", "战略失衡"],
      meaningUpright: "你有能力把愿景、资源和行动串起来，带领局势向前走，而不仅仅是自己很有劲。",
      meaningReversed: "领导力一旦变成控制欲，团队和关系就会先感受到压迫，随后才是效率下降。",
      loveMeaning: "爱情里代表愿意承担、主动规划和把关系往前带；逆位则可能变成强势主导或只顾自己节奏。",
      careerMeaning: "事业上有利于掌舵、创业、谈判和决策；逆位提醒你别让野心变成独断。",
    },
  ],
  swords: [
    {
      key: "ace",
      keywordsUpright: ["清晰", "真相浮现", "果断判断", "切开迷雾"],
      keywordsReversed: ["判断失准", "话语伤人", "混乱", "看不清重点"],
      meaningUpright: "你终于能用更清楚的认知切开混乱，核心不在情绪多强，而在是否愿意面对事实。",
      meaningReversed: "思绪仍在打架，表达也可能失焦，若急着下判断，容易伤人也伤到自己。",
      loveMeaning: "感情里适合把话说清、把需求讲明；逆位提醒不要用尖锐和防御代替真实沟通。",
      careerMeaning: "事业上利于定策略、做决断、切问题本质；逆位说明讯息不完整，判断需要再校准。",
    },
    {
      key: "two",
      keywordsUpright: ["僵持", "难以选择", "理性防卫", "暂时冻结"],
      keywordsReversed: ["打破僵局", "压力爆发", "回避失效", "情绪决堤"],
      meaningUpright: "你把自己放在一种先不动就不会错的位置，但长期冻结只会让问题继续积压。",
      meaningReversed: "被压住的矛盾开始浮出水面，虽然不舒服，却也是僵局终于有可能被打破的时候。",
      loveMeaning: "关系里常是各有顾虑、谁都不先说；逆位则是憋太久后冲突或真话集中爆出来。",
      careerMeaning: "工作上代表拖延决策、信息卡住或两难局面；逆位说明再不处理，代价会越来越高。",
    },
    {
      key: "three",
      keywordsUpright: ["心碎", "真相刺痛", "失望", "切割"],
      keywordsReversed: ["疗伤", "痛后修复", "仍在隐隐作痛", "开始释怀"],
      meaningUpright: "这张牌往往直指疼痛与失望，它逼你承认某些事实已经造成伤口，不能再假装没事。",
      meaningReversed: "伤并非立刻痊愈，但你已经开始把痛感转成理解、界限和恢复力。",
      loveMeaning: "爱情里可能是失恋、第三方伤害、失望或现实刺破幻想；逆位说明疗伤正在发生。",
      careerMeaning: "事业上可能对应关系破裂、决定割舍或某个真相令人失望；逆位则适合复原并重建判断。",
    },
    {
      key: "four",
      keywordsUpright: ["休整", "沉静", "恢复", "暂时抽离"],
      keywordsReversed: ["休息不足", "焦躁回归", "疲劳积累", "恢复被打断"],
      meaningUpright: "现在最重要的不是继续冲，而是给思绪、身体和判断一个真正恢复的空间。",
      meaningReversed: "你可能看似停下，实际仍在内耗，真正缺的不是更多努力，而是可持续的恢复。",
      loveMeaning: "关系里适合冷静期、暂停争执和给彼此呼吸空间；逆位说明问题未解，休息也不彻底。",
      careerMeaning: "工作上提醒你暂停高压模式、修复专注力；逆位则常见于还没恢复就被迫重返战场。",
    },
    {
      key: "five",
      keywordsUpright: ["赢得难看", "冲突升级", "自尊之战", "彼此受损"],
      keywordsReversed: ["停火", "愿意和解", "旧气未消", "学会收手"],
      meaningUpright: "这不是高质量的胜利，更多是每个人都想赢，结果关系和信任一起受损。",
      meaningReversed: "你已经知道继续斗下去没有意义，现在更关键的是能否真正放下输赢心。",
      loveMeaning: "感情里常是争一口气、谁都不肯退；逆位表示愿意和解，但余怒和旧账还在。",
      careerMeaning: "事业上是办公室权力战、沟通撕裂和不必要内斗；逆位提醒及时止损比证明自己更重要。",
    },
    {
      key: "six",
      keywordsUpright: ["过渡", "离开旧局", "缓慢前行", "心境转移"],
      keywordsReversed: ["带着包袱前进", "难以离开", "过渡受阻", "旧事回拖"],
      meaningUpright: "事情未必立刻好转，但你已经离开最混乱的位置，重点是允许自己慢慢渡过去。",
      meaningReversed: "形式上在前进，心理上却还没放下，所以你总觉得走了很远却没真正离开。",
      loveMeaning: "关系里可能是冷静分开、一起走出低谷，或从冲突转向平稳；逆位说明旧伤和旧模式仍在跟着你。",
      careerMeaning: "工作上适合转岗、换环境、走出高压局；逆位则提醒别把旧包袱搬去新地方。",
    },
    {
      key: "seven",
      keywordsUpright: ["策略", "保留底牌", "绕路处理", "试探边界"],
      keywordsReversed: ["策略失效", "真相暴露", "自欺", "无法再躲"],
      meaningUpright: "此刻你需要的是策略和机动，而不是凡事硬碰硬，但也要警惕过度防备和不够坦诚。",
      meaningReversed: "掩饰和回避已经难以继续，某些被隐藏的意图、漏洞或真相正在浮现。",
      loveMeaning: "感情里要留意试探、保留、说一半藏一半；逆位则可能是谎言暴露、猜疑升级或终于说实话。",
      careerMeaning: "事业上可见策略博弈、信息管理和低调推进；逆位说明隐藏问题开始反噬执行。",
    },
    {
      key: "eight",
      keywordsUpright: ["受限感", "被困住", "焦虑束缚", "自我设限"],
      keywordsReversed: ["松绑", "开始看见出口", "解除束缚", "意识转变"],
      meaningUpright: "看似是外部限制，其实更深层的是你已经习惯用最坏预设把自己困住。",
      meaningReversed: "出口并非突然出现，而是你终于愿意质疑那些一直限制自己的叙事。",
      loveMeaning: "关系里可能感到被困、无力、反复脑补最坏结果；逆位说明你开始恢复主导感和选择权。",
      careerMeaning: "工作上多与压力、低信心和觉得自己动不了有关；逆位适合打破自我设限，重新组织行动。",
    },
    {
      key: "nine",
      keywordsUpright: ["焦虑", "失眠", "预设灾难", "内疚反刍"],
      keywordsReversed: ["面对恐惧", "焦虑缓解", "停止反刍", "开始求助"],
      meaningUpright: "压力已经进入身心层面，很多痛苦来自反复回放和预设灾难，而不只是事情本身。",
      meaningReversed: "恐惧还没完全离开，但你开始愿意正面处理它，而不是继续一个人硬扛。",
      loveMeaning: "感情里常见于过度担心、想太多、夜里反复内耗；逆位说明你正在从焦虑模式里退出来。",
      careerMeaning: "事业上代表高压、责任感过重和精神负荷爆表；逆位适合求助、复盘和重新划边界。",
    },
    {
      key: "ten",
      keywordsUpright: ["彻底结束", "触底", "旧局终结", "无可回避"],
      keywordsReversed: ["痛感拖长", "慢慢复原", "最坏时刻已过", "还在收尾"],
      meaningUpright: "某个阶段确实走到了尽头，虽然难受，但它同时意味着旧模式已经无法再维持。",
      meaningReversed: "你已经从最黑的时刻慢慢起身，只是残局和后效应仍需要时间处理。",
      loveMeaning: "关系里可能是一次彻底的终止、真相翻面或再也回不去的分界点；逆位说明伤后复原开始发生。",
      careerMeaning: "工作上是项目结束、结构瓦解或不得不认清现实；逆位则是残局修复与重新站起来的阶段。",
    },
    {
      key: "page",
      keywordsUpright: ["观察", "警觉", "好奇提问", "信息捕捉"],
      keywordsReversed: ["多疑", "口舌", "幼稚争辩", "过度监控"],
      meaningUpright: "你处在一个需要保持头脑清醒和信息敏感度的位置，先观察、先理解，比急着定论更重要。",
      meaningReversed: "警觉一旦过头，就会变成猜疑、挑刺和用话语制造新的不安。",
      loveMeaning: "感情里是试探、观察、聊天摸底和想搞清楚对方；逆位则提醒别用怀疑和盘问破坏连接。",
      careerMeaning: "事业上适合调研、收集信息、学习和准备；逆位提示信息焦虑、流言和沟通方式不成熟。",
    },
    {
      key: "knight",
      keywordsUpright: ["迅速行动", "直冲目标", "果断", "强硬推进"],
      keywordsReversed: ["鲁莽争斗", "说话太冲", "判断仓促", "攻击性"],
      meaningUpright: "需要切开拖延和模糊的时候，这张牌很有力量，但前提是你的方向必须够清楚。",
      meaningReversed: "速度太快、语气太硬，容易把本可解决的问题推成更大的对立。",
      loveMeaning: "关系里是把话摊开、直球推进或快速做决定；逆位说明沟通可能变成冲撞和伤害。",
      careerMeaning: "工作上适合攻坚、辩论和抢窗口；逆位提醒别让锋利变成失控。",
    },
    {
      key: "queen",
      keywordsUpright: ["理性清明", "界限明确", "诚实", "独立判断"],
      keywordsReversed: ["尖刻", "冷硬", "受伤后的防御", "苛责"],
      meaningUpright: "你能够用清楚、诚实又有边界的方式看待局势，不被情绪轻易裹挟。",
      meaningReversed: "受过伤的理性容易变成刀锋，你可能是在保护自己，却让所有交流都先失去温度。",
      loveMeaning: "感情里适合坦白、厘清边界和看清真正需求；逆位则像冷战、批评过多或难以柔软。",
      careerMeaning: "事业上利于分析、判断、管理标准和做艰难决定；逆位提示过度苛刻会压坏协作气氛。",
    },
    {
      key: "king",
      keywordsUpright: ["策略", "秩序", "理性主导", "判断稳健"],
      keywordsReversed: ["僵硬控制", "过度理智", "独断", "缺乏温度"],
      meaningUpright: "你有能力把混乱的局面理顺，用结构、逻辑和原则稳住方向。",
      meaningReversed: "理性若只剩控制，就会让人听起来正确却难以信服，关系和团队都会先感到窒息。",
      loveMeaning: "爱情里代表成熟沟通、清楚边界和理性承担；逆位则要警惕冷处理、说理压人或拒绝共情。",
      careerMeaning: "事业上很适合做策略、定标准和掌控复杂局；逆位说明过硬的控制欲会让执行变形。",
    },
  ],
  pentacles: [
    {
      key: "ace",
      keywordsUpright: ["现实机会", "资源种子", "落地开端", "稳定增长"],
      keywordsReversed: ["错失机会", "起步不稳", "现实准备不足", "资源漏损"],
      meaningUpright: "新的现实机会已经出现，关键在于你是否愿意用耐心和执行把它真正种下去。",
      meaningReversed: "机会不一定消失了，但如果只停在想法层，或基础没准备好，它很难长成结果。",
      loveMeaning: "关系里可见更实际的承诺、见面安排、共同生活议题或稳稳落地的开始。",
      careerMeaning: "事业上适合新工作机会、项目启动、收入种子和可执行的长期布局。",
    },
    {
      key: "two",
      keywordsUpright: ["平衡资源", "灵活调度", "一边转一边稳", "多线处理"],
      keywordsReversed: ["顾此失彼", "失衡", "财务波动", "节奏混乱"],
      meaningUpright: "你需要在变化中维持平衡，不是追求完全稳定，而是练习灵活调度现实资源。",
      meaningReversed: "事情太多、节奏太乱，让你很难稳住基本盘，现在更需要做减法而不是继续硬接。",
      loveMeaning: "感情里是平衡关系与生活、时间与投入；逆位说明现实安排不当正影响关系稳定度。",
      careerMeaning: "事业上多见于同时兼顾多项目、现金流与时间管理；逆位提示资源分配正在失控。",
    },
    {
      key: "three",
      keywordsUpright: ["协作", "专业成长", "工艺打磨", "被看见的能力"],
      keywordsReversed: ["配合不良", "标准不齐", "能力未被用好", "低效协作"],
      meaningUpright: "你的能力需要放进协作场景里被打磨和认可，这不是单打独斗最有效的时候。",
      meaningReversed: "问题未必出在不够努力，而是沟通标准、专业分工或配合方式出了偏差。",
      loveMeaning: "关系里提醒双方要一起经营现实，不只是谈感觉；逆位说明一方投入、另一方却未真正配合。",
      careerMeaning: "工作上利于团队合作、专业训练和作品沉淀；逆位则提示协作失灵或质量把控不足。",
    },
    {
      key: "four",
      keywordsUpright: ["抓紧资源", "安全感", "守成", "不愿冒险"],
      keywordsReversed: ["松开控制", "安全感不足", "资源流失", "学会分享"],
      meaningUpright: "你很想守住现有成果，这没有错，但若抓得太紧，也会错过新的流动与成长。",
      meaningReversed: "松手不等于失去，真正需要处理的是匮乏感和对不确定性的恐惧。",
      loveMeaning: "感情里可能表现为不愿示弱、害怕失去或把关系管得太紧；逆位提醒信任和流动的重要性。",
      careerMeaning: "事业上代表保守理财、守住资产和控制风险；逆位则提示控制欲或财务焦虑开始反噬判断。",
    },
    {
      key: "five",
      keywordsUpright: ["匮乏", "失落感", "现实压力", "需要援手"],
      keywordsReversed: ["走出低谷", "援助出现", "恢复安全感", "重建基础"],
      meaningUpright: "现实层面的压力让你很容易只看见缺口，但这张牌也提醒你，不必把自己关在求助之外。",
      meaningReversed: "最难的时候正在过去，资源、支持或恢复的机会开始慢慢回到你身边。",
      loveMeaning: "关系里常是现实压力、金钱焦虑或被忽略的失落；逆位说明关系有机会从低谷里回暖。",
      careerMeaning: "事业上可能是收入压力、工作不稳或资源不足；逆位则意味着恢复、补位和重新站稳。",
    },
    {
      key: "six",
      keywordsUpright: ["给予与接受", "回馈", "资源流动", "互惠"],
      keywordsReversed: ["失衡施予", "带条件的帮助", "回报不对等", "资源控制"],
      meaningUpright: "资源在流动，重点不是谁更有，而是流动是否公平、是否真的有助于局势变好。",
      meaningReversed: "帮助并不总是无条件，若交换失衡或资源被拿来控制关系，压力会很快显现。",
      loveMeaning: "感情里要看双方投入是否互相回流；逆位提示一方不断给予、一方理所当然，久了会失衡。",
      careerMeaning: "事业上利于合作扶持、奖金分配和资源支持；逆位则要警惕不透明回报与权力不对等。",
    },
    {
      key: "seven",
      keywordsUpright: ["耐心等待", "评估回报", "长期耕耘", "收成前夜"],
      keywordsReversed: ["急于见效", "投入产出失衡", "方向不对", "耐心耗尽"],
      meaningUpright: "你已经投入了很多，眼下更需要做的是评估、修枝，而不是因为焦虑就把成果提前拔出来看。",
      meaningReversed: "若一直看不到回报，就要认真检查方式和方向，而不是盲目追加时间与精力。",
      loveMeaning: "关系里考验的是耐心经营和长期价值，不是即时情绪；逆位说明你们可能都对回报失去耐心。",
      careerMeaning: "工作上适合复盘投入产出、优化长期项目；逆位则提醒不要在错误方向上继续硬耗。",
    },
    {
      key: "eight",
      keywordsUpright: ["专注打磨", "修炼技能", "勤勉", "稳定进步"],
      keywordsReversed: ["机械重复", "偷工减料", "厌倦", "低质量努力"],
      meaningUpright: "你正处在靠重复、训练和细节积累实力的阶段，慢并不等于没进展。",
      meaningReversed: "努力如果失去目标感，就会变成机械消耗，甚至为了快而牺牲质量。",
      loveMeaning: "感情里提醒关系要靠持续经营和具体行动维护；逆位说明一边说重视，一边却懒得投入。",
      careerMeaning: "事业上适合深耕技能、练基本功和做长期积累；逆位提示疲劳工时与低质量产出。",
    },
    {
      key: "nine",
      keywordsUpright: ["独立丰盛", "自给自足", "品味生活", "成果成熟"],
      keywordsReversed: ["依赖舒适圈", "被物质绑住", "外强中干", "安全感不足"],
      meaningUpright: "这是靠长期经营换来的稳与美，代表你可以享受自己的成果，也有能力照顾好自己。",
      meaningReversed: "若只剩外在体面和舒适配置，却没有真正的自主与安全感，丰盛就会显得空心。",
      loveMeaning: "爱情里可能是先把自己过好，再选择关系；逆位提醒别为了外在条件牺牲真实需求。",
      careerMeaning: "事业上常见于稳定回报、个人品牌成熟和独立工作能力；逆位说明你可能被舒适圈困住。",
    },
    {
      key: "ten",
      keywordsUpright: ["长期稳定", "家族资源", "传承", "现实圆满"],
      keywordsReversed: ["基础松动", "家庭压力", "遗产议题", "稳定外壳裂开"],
      meaningUpright: "这是现实层面的完整感，代表长期积累、家族支持或稳固结构正在形成。",
      meaningReversed: "看似稳定的东西未必真的牢靠，尤其当家人、利益或旧规则开始互相牵扯时。",
      loveMeaning: "适合谈婚姻、家庭、长期规划和共同资产；逆位提醒家庭观念或现实条件可能带来压力。",
      careerMeaning: "事业上代表长期事业版图、家业、人脉沉淀和稳固资源；逆位提示基础问题会在后期集中冒出来。",
    },
    {
      key: "page",
      keywordsUpright: ["务实学习", "新机会探测", "稳步起步", "现实好奇"],
      keywordsReversed: ["拖延", "不够踏实", "计划悬空", "执行稚嫩"],
      meaningUpright: "你正用务实的姿态接近新机会，先学会、先做小、先站稳，比一口气做大更重要。",
      meaningReversed: "你可能想了很多，但真正落地的动作太少，现实层面的学习和执行还没跟上。",
      loveMeaning: "感情里是认真了解、慢慢培养稳定感和实际行动；逆位则像嘴上说想认真，行为却不踏实。",
      careerMeaning: "事业上利于实习、入门、学习理财或接触新行业；逆位说明执行懒散，容易错过成长窗口。",
    },
    {
      key: "knight",
      keywordsUpright: ["稳健前进", "可靠执行", "耐心推进", "脚踏实地"],
      keywordsReversed: ["停滞", "过度保守", "固执拖慢", "僵化重复"],
      meaningUpright: "这张牌不快，但很稳，适合一步一步推进那些需要耐性、纪律和兑现能力的事。",
      meaningReversed: "稳如果过头，就会变成磨蹭、固执和不愿调整，最后拖慢整个局面。",
      loveMeaning: "关系里适合用稳定行动证明诚意；逆位则表示一方节奏太慢、太钝，难以回应真实需求。",
      careerMeaning: "工作上有利于执行、流程、运营和长期任务；逆位提醒不要把谨慎活成停滞。",
    },
    {
      key: "queen",
      keywordsUpright: ["资源感", "务实照料", "丰盛管理", "稳定温度"],
      keywordsReversed: ["过度操心", "占有欲", "现实焦虑", "把照顾变控制"],
      meaningUpright: "你有能力把资源、生活和情绪都照顾到位，让稳定不只是口号，而是可感受到的支持。",
      meaningReversed: "当安全感不足时，你可能会用操心、控制和现实条件来绑住关系或局势。",
      loveMeaning: "感情里是会过日子、会照顾、也愿意给稳定支持；逆位则提示把爱变成管理和要求。",
      careerMeaning: "事业上利于财务管理、资源统筹和稳住团队后勤；逆位说明焦虑会让你过度抓细节。",
    },
    {
      key: "king",
      keywordsUpright: ["稳健掌舵", "财富管理", "长期主义", "可靠权威"],
      keywordsReversed: ["物质至上", "僵硬保守", "控制资源", "利益优先"],
      meaningUpright: "你具备长期经营和稳住基本盘的能力，适合做资源配置、资产判断和现实承诺。",
      meaningReversed: "若一切都只剩成本、收益和控制，局势会失去弹性，人也会变得越来越难合作。",
      loveMeaning: "爱情里代表现实承诺、稳定承担和可靠感；逆位则要警惕把关系变成条件交换或控制结构。",
      careerMeaning: "事业上适合管理预算、长期规划和稳健经营；逆位说明过分保守或利益导向会压垮成长空间。",
    },
  ],
};

export const minorArcana: TarotCard[] = (
  Object.entries(minorSeedsBySuit) as Array<[Suit, MinorSeed[]]>
).flatMap(([suit, cards]) => {
  const suitInfo = suitMeta[suit];

  return cards.map((card) => {
    const rank = rankMeta[card.key];
    const slug = slugify(`${suit}-${card.key}`);

    return {
      id: `${suit}-${String(rank.number).padStart(2, "0")}-${slug}`,
      slug,
      nameZh: `${suitInfo.zh}${rank.zh}`,
      nameEn: `${rank.en} of ${suitInfo.en}`,
      arcana: "minor" as const,
      suit,
      number: rank.number,
      keywordsUpright: card.keywordsUpright,
      keywordsReversed: card.keywordsReversed,
      meaningUpright: card.meaningUpright,
      meaningReversed: card.meaningReversed,
      loveMeaning: card.loveMeaning,
      careerMeaning: card.careerMeaning,
      imageUrl: `/tarot/${slug}.jpg`,
    };
  });
});
