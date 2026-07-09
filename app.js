/* ===================================================================
   错题本 · 智能错题集与自测系统
   纯前端单页应用，数据保存在 localStorage，无需后端。
   =================================================================== */
(function () {
  "use strict";

  /* ---------------- 常量配置 ---------------- */
  const SUBJECTS = ["语文", "数学", "英语", "物理", "化学", "生物", "政治", "历史", "地理", "其他"];

  // 各年级段经典易错题库（每学科 5 道），用于首次进入时按年级推送
  const GRADE_BANK = {
    "小学": {
      subjects: ["数学", "语文", "英语"],
      bank: {
        "数学": [
          { q: "计算 25 × 4 ÷ 25 × 4 = ?", wrong: "= 1", right: "= 16", analysis: "乘除法同级，应从左到右依次计算：25×4=100，100÷25=4，4×4=16。不能随便加括号先算 4÷25。" },
          { q: "一根绳子长 1 米，剪掉 1/3，还剩几分之几？", wrong: "还剩 1/3", right: "还剩 2/3", analysis: "把整根绳子看作单位“1”，剪掉 1/3，剩下 1 - 1/3 = 2/3。" },
          { q: "小明有 12 颗糖，给小红一半后两人一样多，小红原来有几颗？", wrong: "6 颗", right: "0 颗", analysis: "一半是 6 颗，小明给后剩 6 颗，两人一样多说明小红此时也是 6 颗，即原有 0 颗。" },
          { q: "3.05 吨 = ( )吨( )千克", wrong: "3 吨 5 千克", right: "3 吨 50 千克", analysis: "0.05 吨 = 0.05×1000 = 50 千克，不是 5 千克。" },
          { q: "周长相等的长方形和正方形，谁的面积更大？", wrong: "长方形", right: "正方形", analysis: "在周长固定时，越接近正方形（正四边形）面积越大，正方形面积最大。" },
        ],
        "语文": [
          { q: "“自( )”应填“己”还是“已”？", wrong: "已", right: "己", analysis: "“自己”用“己”（完全张开）；“已经”用“已”（半封闭）。口诀：己开已半封。" },
          { q: "“重”字在“重量 / 重新”中分别读？", wrong: "都读 zhòng", right: "重量 zhòng，重新 chóng", analysis: "表示“再、反复”时读 chóng，如重新、重来；表示分量大读 zhòng。" },
          { q: "“口( )”应填“令”还是“今”？", wrong: "今", right: "令", analysis: "口令、命令用“令”；“今”表示现在，如今天。" },
          { q: "下列没有错别字的是？A.再接再励 B.迫不急待 C.专心致志 D.穿流不息", wrong: "A 或 B", right: "C", analysis: "A 应为“再接再厉”，B 应为“迫不及待”，D 应为“川流不息”；C 正确。" },
          { q: "“欲穷千里目”中“穷”的意思是？", wrong: "贫穷", right: "尽 / 使……达到尽头", analysis: "“穷”这里是“穷尽”之意：想要看到更远，就要再上一层楼。" },
        ],
        "英语": [
          { q: "I ___ a student.（am / is / are）", wrong: "is", right: "am", analysis: "第一人称 I 后面固定用 am。" },
          { q: "There ___ some milk in the glass.（is / are）", wrong: "are", right: "is", analysis: "milk 是不可数名词，be 动词用 is。" },
          { q: "How many ___ do you have?（apple / apples）", wrong: "apple", right: "apples", analysis: "how many 后接可数名词复数，用 apples。" },
          { q: "写出 go 的过去式。", wrong: "goed", right: "went", analysis: "go 是不规则动词，过去式为 went，不是加 -ed。" },
          { q: "—What's this? —___ a book.（It's / This's）", wrong: "This's", right: "It's", analysis: "回答“这是什么”用 It's a book，不用 This's。" },
        ],
      },
    },
    "初中": {
      subjects: ["数学", "语文", "英语", "物理", "化学"],
      bank: {
        "数学": [
          { q: "解方程 x² = 9，x = ?", wrong: "x = 3", right: "x = ±3", analysis: "平方等于 9 的数有两个：3 和 -3，开方别忘了负根。" },
          { q: "(-2)² 与 -2² 分别等于多少？", wrong: "都等于 4 或都等于 -4", right: "(-2)²=4，-2²=-4", analysis: "-2² 表示 0 - 2² = -4，负号在平方之外；(-2)² 整体平方得 4。" },
          { q: "若 a > b，则 ac > bc 一定成立吗？", wrong: "一定成立", right: "不一定（c≤0 时不成立）", analysis: "不等式两边同乘负数要变号，c<0 时 ac<bc；c=0 时相等。" },
          { q: "一次函数 y=kx+b 过 (0,2) 和 (1,5)，求 k。", wrong: "k = 5", right: "k = 3", analysis: "斜率 k = (5-2)/(1-0) = 3；b 是 y 轴截距 = 2。" },
          { q: "√16 的值是？", wrong: "±4", right: "4", analysis: "√ 表示算术平方根，取非负值，√16 = 4；平方根才是 ±4。" },
        ],
        "语文": [
          { q: "“伛偻提携”中“伛偻”指？", wrong: "老人和小孩", right: "老人（提携指小孩）", analysis: "出自《醉翁亭记》：伛偻指老人，提携指被牵着走的小孩。" },
          { q: "下列句子没有语病的是？A.通过努力，使我进步 B.能否成功关键在于努力 C.他基本把错误全改了 D.我们要认真发现并改正错误", wrong: "A", right: "D", analysis: "A 缺主语（删“通过”或“使”）；B 两面对一面；C“基本”与“全”矛盾；D 语序正确。" },
          { q: "“汗青”在古代指代？", wrong: "汗水", right: "史册", analysis: "竹简烤干水分（出汗）便于书写，后借指史册，如“留取丹心照汗青”。" },
          { q: "“落红不是无情物”的下一句是？", wrong: "化作春泥护花", right: "化作春泥更护花", analysis: "出自龚自珍《己亥杂诗》，注意“更”字不能漏。" },
          { q: "“采菊东篱下，悠然见南山”的作者是？", wrong: "李白", right: "陶渊明", analysis: "出自陶渊明《饮酒·其五》。" },
        ],
        "英语": [
          { q: "He has ___ to Beijing twice.（gone / been）", wrong: "gone", right: "been", analysis: "has been to 表示“去过（已回）”；has gone to 表示“去了（未回）”。" },
          { q: "If it ___ tomorrow, we will stay home.（rains / will rain）", wrong: "will rain", right: "rains", analysis: "if 引导条件状语从句，主句用一般将来时，从句用一般现在时（主将从现）。" },
          { q: "The book is ___ .（interest / interesting / interested）", wrong: "interested", right: "interesting", analysis: "物作主语用 -ing（令人…的）；人作主语用 -ed（感到…的）。" },
          { q: "改为 too…to：He is so young that he can't go.", wrong: "too young to can't go", right: "too young to go", analysis: "too…to 本身含否定意义，后面直接接动词原形，不再加 not/can't。" },
          { q: "被动：They built the bridge in 1990. → The bridge ___ in 1990.", wrong: "built", right: "was built", analysis: "一般过去时被动：was/were + 过去分词，bridge 单数用 was built。" },
        ],
        "物理": [
          { q: "物体做匀速直线运动时，所受合力为？", wrong: "向前", right: "0", analysis: "匀速直线运动状态不变，合力为零（受平衡力）。" },
          { q: "一瓶水喝掉一半，剩余水的密度？", wrong: "减半", right: "不变", analysis: "密度是物质的特性，与质量、体积无关，同种物质密度不变。" },
          { q: "光在真空中的速度约为？", wrong: "340 m/s", right: "3×10⁸ m/s", analysis: "340 m/s 是空气中的声速；光速约 3×10⁸ m/s。" },
          { q: "体重约 50 kg 的人，重力约为？", wrong: "50 N", right: "约 500 N", analysis: "G = mg ≈ 50×10 = 500 N（g 取 10 N/kg）。" },
          { q: "近视眼成像位置在视网膜的？", wrong: "后方", right: "前方", analysis: "晶状体过厚、折光过强，像成在视网膜前方，用凹透镜矫正。" },
        ],
        "化学": [
          { q: "保持水化学性质的最小粒子是？", wrong: "氢原子和氧原子", right: "水分子", analysis: "由分子构成的物质，其化学性质由分子保持；水由水分子构成。" },
          { q: "CO₂ 中碳元素的化合价是？", wrong: "+2", right: "+4", analysis: "O 为 -2，2 个 O 共 -4，化合物化合价代数和为 0，故 C 为 +4。" },
          { q: "下列是纯净物的是？A.空气 B.海水 C.蒸馏水 D.食盐水", wrong: "A", right: "C", analysis: "蒸馏水是纯 H₂O，属纯净物；其余均为混合物。" },
          { q: "点燃氢气前必须做什么？", wrong: "直接点燃", right: "验纯", analysis: "氢气不纯点燃易爆炸，先验纯确保安全。" },
          { q: "区分硬水和软水可用？", wrong: "闻气味", right: "肥皂水", analysis: "加肥皂水，泡沫少、浮渣多的是硬水，泡沫多的是软水。" },
        ],
      },
    },
    "高中": {
      subjects: ["数学", "语文", "英语", "物理", "化学", "生物"],
      bank: {
        "数学": [
          { q: "sin(π - α) = ?", wrong: "cos α", right: "sin α", analysis: "诱导公式：奇变偶不变，符号看象限。π-α 中 π 是 π/2 的偶数倍，函数名不变；π-α 在第二象限 sin 为正，故为 sin α。" },
          { q: "函数 f(x)=x³ 在 R 上？", wrong: "有最大值", right: "单调递增且无最大值", analysis: "f'(x)=3x²≥0，函数在 R 上单调递增，趋于无穷无最值。" },
          { q: "logₐ(M·N) = ?", wrong: "logₐM × logₐN", right: "logₐM + logₐN", analysis: "对数运算法则：真数相乘→对数相加（注意不是相乘）。" },
          { q: "向量 a=(1,2), b=(2,4)，a 与 b 的夹角是？", wrong: "90°", right: "0°（共线同向）", analysis: "b = 2a，两向量共线且同向，夹角 0°。" },
          { q: "lim(x→0) sinx / x = ?", wrong: "0", right: "1", analysis: "重要极限：当 x→0 时，sinx/x → 1。" },
        ],
        "语文": [
          { q: "“锲而不舍，金石可镂”出自？", wrong: "《论语》", right: "《荀子·劝学》", analysis: "荀子以蚯蚓与螃蟹对比论证坚持的重要性。" },
          { q: "成语“万人空巷”形容？", wrong: "街上空无一人（冷清）", right: "人都从巷子里出来（热闹盛况）", analysis: "指庆祝、欢迎等盛况，家家户户都出来了，不是冷清。" },
          { q: "“不刊之论”的意思是？", wrong: "不能刊登的言论", right: "不可更改的正确言论", analysis: "“刊”指削改（古人在竹简上删改），不是“刊登”。" },
          { q: "“七月流火”指天气？", wrong: "炎热", right: "转凉", analysis: "“火”指火星西沉，表示夏去秋来、天气渐凉，不是酷热。" },
          { q: "“千钧一发”中“钧”是？", wrong: "时间单位", right: "重量单位（三十斤）", analysis: "钧是古代重量单位，千钧一发形容极危急。" },
        ],
        "英语": [
          { q: "It was not until midnight ___ he finished.（that / when）", wrong: "when", right: "that", analysis: "强调句型 It is/was + 被强调部分 + that/who，不用 when。" },
          { q: "The teacher recommended that he ___ early.（go / goes）", wrong: "goes", right: "(should) go", analysis: "suggest / recommend / insist 等后的宾语从句用虚拟语气：(should)+动词原形。" },
          { q: "Hardly ___ he sat down ___ the phone rang.（had…when / did…than）", wrong: "did…than", right: "had…when", analysis: "hardly…when 固定搭配且需部分倒装：Hardly had he sat down when…" },
          { q: "___ (Walk) in the park, I saw a flower.", wrong: "Walked", right: "Walking", analysis: "现在分词作状语，主语 I 与 walk 是主动关系，用 Walking。" },
          { q: "A number of students ___ here.（is / are）", wrong: "is", right: "are", analysis: "a number of 表“许多”，谓语用复数；the number of 才用单数。" },
        ],
        "物理": [
          { q: "平抛运动水平方向做什么运动？", wrong: "匀加速直线运动", right: "匀速直线运动", analysis: "水平方向不受力，保持初速度匀速；竖直方向自由落体。" },
          { q: "电场线越密的地方电场强度？", wrong: "越小", right: "越大", analysis: "电场线的疏密表示电场强弱，越密场强越大。" },
          { q: "一定质量的理想气体等温膨胀，内能？", wrong: "增大", right: "不变", analysis: "理想气体内能只与温度有关，温度不变则内能不变。" },
          { q: "闭合线圈在匀强磁场中平移，是否产生感应电流？", wrong: "有", right: "无", analysis: "平移时穿过线圈的磁通量不变，不产生感应电流（需切割磁感线或转动）。" },
          { q: "光从光疏介质进入光密介质，折射角比入射角？", wrong: "大", right: "小", analysis: "进入光密介质折射光向法线偏折，折射角小于入射角。" },
        ],
        "化学": [
          { q: "25℃ 时纯水的 pH = ?", wrong: "0 或 14", right: "7", analysis: "中性溶液 pH=7；pH<7 酸性，>7 碱性。" },
          { q: "增大压强，平衡 N₂+3H₂⇌2NH₃ 如何移动？", wrong: "逆向移动", right: "正向移动", analysis: "正反应气体体积减小，增压平衡向体积减小方向移动（勒夏特列原理）。" },
          { q: "原电池中发生氧化反应的是？", wrong: "正极", right: "负极", analysis: "负极失电子被氧化，正极得电子被还原。" },
          { q: "下列既能与酸又能与碱反应的是？A.Na₂O B.Al₂O₃ C.CO₂ D.CuO", wrong: "Na₂O", right: "Al₂O₃", analysis: "Al₂O₃ 是两性氧化物，既与酸也与碱反应。" },
          { q: "标准状况下 1 mol 任何气体的体积约为？", wrong: "无法确定", right: "约 22.4 L", analysis: "标准状况（0℃、101kPa）下气体摩尔体积 Vm≈22.4 L/mol。" },
        ],
        "生物": [
          { q: "光合作用的光反应阶段发生在？", wrong: "叶绿体基质", right: "类囊体薄膜", analysis: "光反应在类囊体薄膜上进行；暗反应在叶绿体基质中进行。" },
          { q: "DNA 的复制方式是？", wrong: "全保留复制", right: "半保留复制", analysis: "Meselson-Stahl 实验证明 DNA 复制为半保留：子代 DNA 各含一条母链。" },
          { q: "人体的遗传物质是？", wrong: "核酸", right: "DNA", analysis: "有细胞结构的生物遗传物质都是 DNA（少数病毒遗传物质是 RNA）。" },
          { q: "有氧呼吸的主要场所是？", wrong: "细胞质基质", right: "线粒体", analysis: "有氧呼吸第二阶段在线粒体基质、第三阶段在线粒体内膜，主要在线粒体。" },
          { q: "等位基因位于？", wrong: "姐妹染色单体上", right: "同源染色体上", analysis: "等位基因控制相对性状，位于一对同源染色体的相同位置。" },
        ],
      },
    },
  };
  // 各年级段每科 5 道易错题对应的「知识点」(与录入时的知识点对齐，用于举一反三匹配)
  const GRADE_KP = {
    "小学|数学": ["运算顺序", "分数意义", "和差倍问题", "单位换算", "周长与面积"],
    "小学|语文": ["形近字", "多音字", "形近字", "错别字辨析", "古诗文理解"],
    "小学|英语": ["主谓一致", "不可数名词", "名词复数", "动词过去式", "指示代词"],
    "初中|数学": ["平方根", "乘方符号", "不等式性质", "一次函数", "算术平方根"],
    "初中|语文": ["文言词义", "病句辨析", "文化常识", "古诗默写", "作家作品"],
    "初中|英语": ["时态辨析", "主将从现", "分词形容词", "too...to句型", "被动语态"],
    "初中|物理": ["合力与平衡", "密度特性", "光速声速", "重力计算", "近视眼矫正"],
    "初中|化学": ["分子概念", "化合价计算", "纯净物混合物", "氢气安全", "硬水软水"],
    "高中|数学": ["诱导公式", "函数单调性", "对数运算", "向量夹角", "重要极限"],
    "高中|语文": ["文学常识", "成语辨析", "成语辨析", "成语辨析", "文化常识"],
    "高中|英语": ["强调句型", "虚拟语气", "倒装句", "非谓语动词", "主谓一致"],
    "高中|物理": ["平抛运动", "电场强度", "理想气体内能", "电磁感应", "光的折射"],
    "高中|化学": ["溶液pH", "化学平衡", "原电池", "两性氧化物", "气体摩尔体积"],
    "高中|生物": ["光合作用", "DNA复制", "遗传物质", "细胞呼吸", "等位基因"],
  };

  // 举一反三内置题库：键为 "学科|知识点"，值为同类新题（q 题干 / a 正确答案 / an 解析）
  // 答错的新题会自动收入错题本，形成“练→错→再练”的闭环。可在此继续扩充。
  const KP_BANK = {
    // ===== 小学数学 =====
    "数学|运算顺序": [
      { q: "36 - 12 ÷ 3 = ?", a: "32", an: "先除后减：12÷3=4，36-4=32。易错先算 36-12。" },
      { q: "8 + 2 × 5 = ?", a: "18", an: "先乘后加：2×5=10，8+10=18。" }
    ],
    "数学|分数意义": [
      { q: "把 3/4 米平均分成 3 段，每段长几分之几米？", a: "1/4 米", an: "3/4 ÷ 3 = 1/4（米），平均分的是长度。" },
      { q: "3 个 1/5 相加是几分之几？", a: "3/5", an: "3 × 1/5 = 3/5。" }
    ],
    "数学|和差倍问题": [
      { q: "两数和是 20、差是 4，大数是？", a: "12", an: "(和+差)/2 = (20+4)/2 = 12。" },
      { q: "甲是乙的 3 倍，两人共 24，乙是？", a: "6", an: "乙 1 份、甲 3 份共 4 份=24，1 份=6。" }
    ],
    "数学|单位换算": [
      { q: "2.5 千克 = ( )克", a: "2500", an: "1 千克=1000 克，2.5×1000=2500。" },
      { q: "4 米 5 厘米 = ( )厘米", a: "405", an: "4 米=400 厘米，400+5=405。" }
    ],
    "数学|周长与面积": [
      { q: "边长 4 厘米的正方形面积是？", a: "16 平方厘米", an: "4×4=16 cm²，注意单位是面积不是周长。" },
      { q: "长 6 宽 2 的长方形周长？", a: "16", an: "(6+2)×2=16；易错算成面积 12。" }
    ],
    // ===== 小学语文 =====
    "语文|形近字": [
      { q: "“已往”与“自己”中“已/己”分别怎么写？", a: "已往、自己", an: "已(半封)表过去；己(全开)指自己。" },
      { q: "“辩论 / 分辨 / 辫子”分别对应哪个字？", a: "辩、辨、辫", an: "言字旁辩论，中间点分辨，丝旁辫子。" }
    ],
    "语文|多音字": [
      { q: "“爱好 / 好人”中“好”读音？", a: "hào、hǎo", an: "表喜爱读 hào，表优点读 hǎo。" },
      { q: "“步行 / 银行”中“行”读音？", a: "xíng、háng", an: "行走 xíng；行业、银行 háng。" }
    ],
    "语文|错别字辨析": [
      { q: "下列正确：A 迫不急待 B 迫不及待", a: "B", an: "“及”是赶上，非“急”。" },
      { q: "下列正确：A 穿流不息 B 川流不息", a: "B", an: "“川”指河流，非“穿”。" }
    ],
    "语文|古诗文理解": [
      { q: "“举头望明月”下一句？", a: "低头思故乡", an: "李白《静夜思》。" },
      { q: "“欲穷千里目”的下一句？", a: "更上一层楼", an: "王之涣《登鹳雀楼》。" }
    ],
    // ===== 小学英语 =====
    "英语|主谓一致": [
      { q: "She ___ a teacher.（am/is/are）", a: "is", an: "第三人称单数用 is。" },
      { q: "They ___ happy.（is/are）", a: "are", an: "复数 they 用 are。" }
    ],
    "英语|不可数名词": [
      { q: "There is some ___ on the table.（water/waters）", a: "water", an: "water 不可数，无复数形式。" },
      { q: "I need some ___ .（bread/breads）", a: "bread", an: "bread 不可数。" }
    ],
    "英语|名词复数": [
      { q: "one box, two ___", a: "boxes", an: "以 x 结尾加 es。" },
      { q: "one child, many ___", a: "children", an: "child 不规则复数 children。" }
    ],
    "英语|动词过去式": [
      { q: "eat 的过去式？", a: "ate", an: "不规则变化，非 eated。" },
      { q: "buy 的过去式？", a: "bought", an: "不规则变化。" }
    ],
    "英语|指示代词": [
      { q: "—What are those? —___ are books.（This/Those）", a: "Those", an: "问 those 答 those。" },
      { q: "—What is ___ ? —It's a cat.（that/those）", a: "that", an: "单数远处用 that。" }
    ],
    // ===== 初中数学 =====
    "数学|平方根": [
      { q: "x² = 16，x = ?", a: "±4", an: "平方等于 16 的数有两个：±4。" },
      { q: "9 的平方根是？", a: "±3", an: "平方根含正负，算术平方根才是 3。" }
    ],
    "数学|乘方符号": [
      { q: "-3² = ?", a: "-9", an: "负号在平方外，= -(3²) = -9。" },
      { q: "(-1)³ = ?", a: "-1", an: "奇次幂保留负号。" }
    ],
    "数学|不等式性质": [
      { q: "若 a>b 且 c<0，则 ac ___ bc", a: "<", an: "两边同乘负数要变号。" },
      { q: "若 -2x > 6，则 x ___", a: "< -3", an: "两边÷(-2)变号，得 x < -3。" }
    ],
    "数学|一次函数": [
      { q: "y=2x-1 中 k 与 b？", a: "k=2, b=-1", an: "y=kx+b，k 为 x 系数，b 为常数项。" },
      { q: "直线 y=-x+3 与 y 轴交点？", a: "(0,3)", an: "x=0 时 y=3。" }
    ],
    "数学|算术平方根": [
      { q: "√25 = ?", a: "5", an: "√ 表示算术平方根，取非负。" },
      { q: "√(9/16) = ?", a: "3/4", an: "√(9/16) = 3/4。" }
    ],
    // ===== 初中语文 =====
    "语文|文言词义": [
      { q: "“亡羊补牢”中“亡”的意思？", a: "丢失", an: "亡=丢失，非死亡。" },
      { q: "古汉语中“走”的意思？", a: "跑", an: "古“走”为跑。" }
    ],
    "语文|病句辨析": [
      { q: "下列无语病：A 通过努力，使我进步 B 改革开放成就巨大", a: "B", an: "A 缺主语（删“通过”或“使”）。" },
      { q: "下列无语病：A 他差不多做完 B 我们要认真改正错误", a: "B", an: "A “差不多”与“完”矛盾。" }
    ],
    "语文|文化常识": [
      { q: "“桑梓”在古文中指代？", a: "故乡", an: "古人宅旁植桑梓，代指家乡。" },
      { q: "“桃李”指代？", a: "学生", an: "“桃李满天下”指学生多。" }
    ],
    "语文|古诗默写": [
      { q: "“会当凌绝顶”下一句？", a: "一览众山小", an: "杜甫《望岳》。" },
      { q: "“海内存知己”下一句？", a: "天涯若比邻", an: "王勃《送杜少府之任蜀州》。" }
    ],
    "语文|作家作品": [
      { q: "《西游记》作者？", a: "吴承恩", an: "明代小说家。" },
      { q: "《红楼梦》作者？", a: "曹雪芹", an: "清代。" }
    ],
    // ===== 初中英语 =====
    "英语|时态辨析": [
      { q: "He has ___ to Beijing twice.（gone/been）", a: "been", an: "has been to 表“去过已回”。" },
      { q: "Where is Tom? —He has ___ to the library.", a: "gone", an: "has gone to 表“去了未回”。" }
    ],
    "英语|主将从现": [
      { q: "If it is sunny, we ___ a picnic.", a: "will have", an: "if 条件句主将从现。" },
      { q: "As soon as he comes, I ___ tell him.", a: "will", an: "as soon as 引导从句也用主将从现。" }
    ],
    "英语|分词形容词": [
      { q: "The story is ___ .（bored/boring）", a: "boring", an: "物作主语用 -ing（令人…的）。" },
      { q: "I am ___ in the book.（interested/interesting）", a: "interested", an: "人作主语用 -ed（感到…的）。" }
    ],
    "英语|too...to句型": [
      { q: "改：He is so old that he can't work.", a: "too old to work", an: "too…to 本身含否定，不再加 not。" },
      { q: "The box is too heavy ___ (carry).", a: "to carry", an: "too…to 后接动词原形。" }
    ],
    "英语|被动语态": [
      { q: "The book ___ by Lu Xun.（write）", a: "was written", an: "一般过去时被动：was + 过去分词。" },
      { q: "English ___ worldwide.（speak）", a: "is spoken", an: "一般现在时被动：is + 过去分词。" }
    ],
    // ===== 初中物理 =====
    "物理|合力与平衡": [
      { q: "静止在桌面上的书所受合力？", a: "0", an: "平衡状态合力为零（受平衡力）。" },
      { q: "二力平衡的条件？", a: "等大、反向、共线、作用同物", an: "四条件缺一不可。" }
    ],
    "物理|密度特性": [
      { q: "一杯水喝掉一半，剩余水密度？", a: "不变", an: "密度是物质特性，与质量体积无关。" },
      { q: "冰熔化成水，密度如何变化？", a: "变大", an: "冰密度小于水。" }
    ],
    "物理|光速声速": [
      { q: "真空中的光速约？", a: "3×10⁸ m/s", an: "注意区分声速 340 m/s。" },
      { q: "为什么先看到闪电后听到雷声？", a: "光速远大于声速", an: "光快声慢。" }
    ],
    "物理|重力计算": [
      { q: "质量 2kg 的物体重力（g=10）？", a: "20 N", an: "G=mg=2×10=20 N。" },
      { q: "g 的物理意义？", a: "重力与质量之比，约 9.8 N/kg", an: "是常数。" }
    ],
    "物理|近视眼矫正": [
      { q: "近视眼的成因？", a: "晶状体过厚，像成视网膜前方", an: "用凹透镜矫正。" },
      { q: "近视眼配戴什么透镜？", a: "凹透镜", an: "发散光线使像后移到视网膜。" }
    ],
    // ===== 初中化学 =====
    "化学|分子概念": [
      { q: "保持氧气化学性质的最小粒子？", a: "氧分子", an: "由分子构成的物质，化学性质由分子保持。" },
      { q: "糖水属于混合物是因为含？", a: "蔗糖分子和水分子", an: "含不同种分子。" }
    ],
    "化学|化合价计算": [
      { q: "H₂O 中 O 的化合价？", a: "-2", an: "H 为 +1，2 个共 +2，故 O 为 -2。" },
      { q: "NH₃ 中 N 的化合价？", a: "-3", an: "H 为 +1×3=+3，N 为 -3。" }
    ],
    "化学|纯净物混合物": [
      { q: "下列纯净物：A 空气 B 冰水混合物", a: "B", an: "冰、水都是 H₂O，属纯净物。" },
      { q: "下列混合物：A 氧气 B 糖水", a: "B", an: "糖+水含两种物质。" }
    ],
    "化学|氢气安全": [
      { q: "点燃氢气前必须做什么？", a: "验纯", an: "不纯点燃易爆炸。" },
      { q: "收集氢气可用什么方法？", a: "向下排空气法或排水法", an: "氢气密度比空气小且难溶。" }
    ],
    "化学|硬水软水": [
      { q: "区分硬水和软水可用？", a: "肥皂水", an: "泡沫少、浮渣多的是硬水。" },
      { q: "生活中软化硬水的方法？", a: "煮沸", an: "可除去部分钙镁离子。" }
    ],
    // ===== 高中数学 =====
    "数学|诱导公式": [
      { q: "cos(π/2 - α) = ?", a: "sin α", an: "奇变偶不变，符号看象限；π/2 奇数倍名变。" },
      { q: "cos(π + α) = ?", a: "-cos α", an: "π 偶数倍名不变，第三象限 cos 为负。" }
    ],
    "数学|函数单调性": [
      { q: "f(x)=e^x 在 R 上？", a: "单调递增", an: "指数函数在 R 上递增。" },
      { q: "f(x)=1/x 在 (0,+∞) 上？", a: "单调递减", an: "反比例函数在各区间递减。" }
    ],
    "数学|对数运算": [
      { q: "ln(e³) = ?", a: "3", an: "对数与指数互逆。" },
      { q: "logₐ(M/N) = ?", a: "logₐM - logₐN", an: "真数相除，对数相减。" }
    ],
    "数学|向量夹角": [
      { q: "a=(1,0), b=(0,1)，夹角？", a: "90°", an: "互相垂直。" },
      { q: "若 a·b = 0，则 a 与 b？", a: "垂直", an: "向量点积为 0 则垂直。" }
    ],
    "数学|重要极限": [
      { q: "lim(x→∞)(1+1/x)^x = ?", a: "e", an: "第二个重要极限。" },
      { q: "lim(x→0) sinx/x = ?", a: "1", an: "第一个重要极限。" }
    ],
    // ===== 高中语文 =====
    "语文|文学常识": [
      { q: "《史记》作者？", a: "司马迁", an: "纪传体通史。" },
      { q: "《窦娥冤》作者？", a: "关汉卿", an: "元曲大家。" }
    ],
    "语文|成语辨析": [
      { q: "“不以为然”的意思？", a: "不认为是对的", an: "非“不放在心上”（那是不以为意）。" },
      { q: "“首当其冲”的意思？", a: "最先受到冲击或灾难", an: "非“首先、第一个”。" }
    ],
    "语文|文化常识": [
      { q: "“社稷”指代？", a: "国家", an: "社为土神，稷为谷神。" },
      { q: "“椿萱”指代？", a: "父母", an: "代指双亲。" }
    ],
    // ===== 高中英语 =====
    "英语|强调句型": [
      { q: "It is Tom ___ helped me.", a: "that/who", an: "强调人用 that/who，不用 when。" },
      { q: "强调句基本结构？", a: "It is/was + 被强调部分 + that", an: "连接词只用 that/who。" }
    ],
    "英语|虚拟语气": [
      { q: "If I ___ you, I would go.（am/were）", a: "were", an: "与现在事实相反的假设用 were。" },
      { q: "I suggest he ___ now.（go/goes）", a: "(should) go", an: "suggest 后宾语从句用虚拟语气。" }
    ],
    "英语|倒装句": [
      { q: "Never ___ I seen such a thing.（have/has）", a: "have", an: "never 开头部分倒装，主语 I 用 have。" },
      { q: "Only then ___ he realize.（did/does）", a: "did", an: "only+状语开头部分倒装。" }
    ],
    "英语|非谓语动词": [
      { q: "___ the book, he learned a lot.（Read/Reading）", a: "Reading", an: "主动关系用现在分词。" },
      { q: "The ___ window needs repair.（break/broken）", a: "broken", an: "过去分词作定语表被动完成。" }
    ],
    // ===== 高中物理 =====
    "物理|平抛运动": [
      { q: "平抛运动竖直方向做什么运动？", a: "自由落体运动", an: "初速为 0 的匀加速直线运动。" },
      { q: "平抛落地时间由什么决定？", a: "抛出高度", an: "t=√(2h/g)，与初速无关。" }
    ],
    "物理|电场强度": [
      { q: "点电荷电场线方向？", a: "从正电荷发出，终止于负电荷", an: "电场线起于正止于负。" },
      { q: "匀强电场中 E 与 U 关系？", a: "E = U/d", an: "沿场强方向电势降低。" }
    ],
    "物理|理想气体内能": [
      { q: "一定质量理想气体内能只取决于？", a: "温度", an: "理想气体内能只与温度有关。" },
      { q: "等温膨胀时理想气体内能？", a: "不变", an: "温度不变内能不变。" }
    ],
    "物理|电磁感应": [
      { q: "产生感应电流的条件？", a: "闭合回路磁通量发生变化", an: "需闭合且磁通变化。" },
      { q: "楞次定律的核心？", a: "感应电流阻碍磁通量变化", an: "“阻碍”而非“阻止”。" }
    ],
    "物理|光的折射": [
      { q: "光从水进入空气，折射角比入射角？", a: "大", an: "进入光疏介质向法线外偏折。" },
      { q: "池水看起来比实际浅是因为？", a: "光的折射", an: "人眼逆着折射光看，像偏高。" }
    ],
    // ===== 高中化学 =====
    "化学|溶液pH": [
      { q: "pH < 7 的溶液显什么性？", a: "酸性", an: "<7 酸，=7 中，>7 碱。" },
      { q: "常温下 pH=3 与 pH=5 的 H⁺ 浓度比？", a: "100:1", an: "每差 1 个 pH，浓度差 10 倍。" }
    ],
    "化学|化学平衡": [
      { q: "增大反应物浓度，平衡如何移动？", a: "正向移动", an: "勒夏特列原理。" },
      { q: "催化剂对化学平衡？", a: "无影响（只加快达平衡）", an: "不改平衡位置。" }
    ],
    "化学|原电池": [
      { q: "铜锌原电池中正极是？", a: "铜", an: "较不活泼金属为正极。" },
      { q: "原电池负极发生什么反应？", a: "氧化（失电子）", an: "负极失电子被氧化。" }
    ],
    "化学|两性氧化物": [
      { q: "下列两性氧化物：A CaO B Al₂O₃", a: "B", an: "Al₂O₃ 既与酸也与碱反应。" },
      { q: "下列两性：A ZnO B Na₂O", a: "A", an: "ZnO 是两性氧化物。" }
    ],
    "化学|气体摩尔体积": [
      { q: "标准状况指？", a: "0℃、101 kPa", an: "注意非 25℃、1 atm。" },
      { q: "标准状况下 1 mol 气体体积约？", a: "22.4 L", an: "Vm≈22.4 L/mol。" }
    ],
    // ===== 高中生物 =====
    "生物|光合作用": [
      { q: "光合作用暗反应的场所？", a: "叶绿体基质", an: "不在类囊体薄膜。" },
      { q: "光反应为暗反应提供？", a: "ATP 和 [H]（NADPH）", an: "暗反应消耗二者固定 CO₂。" }
    ],
    "生物|DNA复制": [
      { q: "DNA 复制的方式？", a: "半保留复制", an: "子代各含一条母链。" },
      { q: "DNA 复制发生在细胞周期的？", a: "分裂间期（S 期）", an: "非分裂期。" }
    ],
    "生物|遗传物质": [
      { q: "有细胞结构的生物遗传物质？", a: "DNA", an: "细胞生物遗传物质均为 DNA。" },
      { q: "HIV 的遗传物质？", a: "RNA", an: "逆转录病毒，遗传物质为 RNA。" }
    ],
    "生物|细胞呼吸": [
      { q: "动物无氧呼吸产物？", a: "乳酸", an: "动物无氧呼吸不产生 CO₂。" },
      { q: "有氧呼吸产生 ATP 最多的阶段？", a: "第三阶段", an: "在线粒体内膜。" }
    ],
    "生物|等位基因": [
      { q: "等位基因控制？", a: "相对性状", an: "如高茎与矮茎。" },
      { q: "杂合子的基因型特点是？", a: "含一对等位基因（如 Aa）", an: "显、隐性各一个。" }
    ]
  };

  const GRADES = Object.keys(GRADE_BANK);

  // 固定积分规则
  const POINTS = { add: 10, practice: 5, checkin: 5, streakBonus: 20, master: 3 };

  // 段位等级（按累计积分）
  const RANKS = [
    { name: "青铜", min: 0, icon: "🥉" },
    { name: "白银", min: 100, icon: "🥈" },
    { name: "黄金", min: 300, icon: "🥇" },
    { name: "铂金", min: 600, icon: "💠" },
    { name: "钻石", min: 1000, icon: "💎" },
    { name: "大师", min: 1500, icon: "🏆" },
    { name: "王者", min: 2500, icon: "👑" },
  ];

  // 虚拟学习勋章
  const MEDALS = [
    { id: "first", name: "新手入门", icon: "🌱", desc: "录入第一道错题", check: (s) => s.qlen >= 1 },
    { id: "collector50", name: "错题收藏家", icon: "📚", desc: "录入 50 道错题", check: (s) => s.qlen >= 50 },
    { id: "collector100", name: "百题斩", icon: "💯", desc: "录入 100 道错题", check: (s) => s.qlen >= 100 },
    { id: "firstPractice", name: "初出茅庐", icon: "✏️", desc: "完成第一次自测", check: (s) => s.practiceCount >= 1 },
    { id: "practice10", name: "勤学苦练", icon: "🔥", desc: "完成 10 次自测", check: (s) => s.practiceCount >= 10 },
    { id: "streak7", name: "打卡达人", icon: "📅", desc: "连续打卡 7 天", check: (s) => s.bestStreak >= 7 },
    { id: "streak15", name: "半月坚守", icon: "🌟", desc: "连续打卡 15 天", check: (s) => s.bestStreak >= 15 },
    { id: "streak30", name: "月度之星", icon: "🌙", desc: "连续打卡 30 天", check: (s) => s.bestStreak >= 30 },
    { id: "extend", name: "举一反三", icon: "🧠", desc: "完成一次举一反三练习", check: (s) => s.extendCount >= 1 },
    { id: "master5", name: "全神贯注", icon: "🎯", desc: "单日掌握 5 道题", check: (s) => s.dailyMastered >= 5 },
    { id: "king", name: "登峰造极", icon: "👑", desc: "达到王者段位", check: (s) => s.points >= 2500 },
  ];

  const MASTERY = ["🔴 未掌握", "🟡 复习中", "🟢 已掌握"];
  const MASTERY_COLOR = ["var(--red)", "var(--yellow)", "var(--green)"];

  const LS_KEY = "cuotiji_state_v1";

  /* ---------------- 状态 ---------------- */
  let state = {
    questions: [],
    checkins: [],
    pointsLog: [],
    medals: [],
    masteryLog: [],
    practiceCount: 0,
    extendCount: 0,
    bestStreak: 0,
    settings: { name: "同学", theme: "light" },
  };

  let editingId = null;
  let listFilter = { subject: "all", mastery: "all", search: "" };
  let currentUser = null; // 登录用户（来自后端）
  let syncTimer = null;

  /* ---------------- 工具函数 ---------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function dateKey(d) {
    const x = d || new Date();
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }
  function today() { return dateKey(new Date()); }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function getVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function totalPoints() { return state.pointsLog.reduce((a, b) => a + b.amount, 0); }
  function currentRankIndex() {
    const p = totalPoints();
    let idx = 0;
    for (let i = 0; i < RANKS.length; i++) if (p >= RANKS[i].min) idx = i;
    return idx;
  }
  function currentRank() { return RANKS[currentRankIndex()]; }
  function rankProgress() {
    const p = totalPoints();
    const i = currentRankIndex();
    const cur = RANKS[i], next = RANKS[i + 1];
    if (!next) return 100;
    return Math.min(100, Math.round(((p - cur.min) / (next.min - cur.min)) * 100));
  }
  function currentStreak() {
    let s = 0;
    let d = new Date();
    if (!state.checkins.includes(dateKey(d))) d = addDays(d, -1);
    while (state.checkins.includes(dateKey(d))) { s++; d = addDays(d, -1); }
    return s;
  }
  function todayMastered() { const t = today(); return state.masteryLog.filter((d) => d === t).length; }
  function buildStats() {
    return {
      questions: state.questions, qlen: state.questions.length, points: totalPoints(),
      practiceCount: state.practiceCount || 0, extendCount: state.extendCount || 0,
      bestStreak: state.bestStreak || 0, dailyMastered: todayMastered(),
    };
  }

  let toastTimer = null;
  function toast(msg, medal) {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast show" + (medal ? " medal" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = "toast"; }, 2600);
  }
  function toastMedal(m) { toast("🏅 解锁勋章：" + m.name + " " + m.icon, true); }

  /* ---------------- 存储 ---------------- */
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { console.warn("保存失败", e); }
    if (currentUser) { clearTimeout(syncTimer); syncTimer = setTimeout(syncProfile, 600); }
  }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state = Object.assign(state, data);
        state.settings = Object.assign({ name: "同学", theme: "light" }, data.settings || {});
      }
    } catch (e) { console.warn("读取失败", e); }
  }

  /* ---------------- 积分 & 勋章 ---------------- */
  function addPoints(amount, reason) {
    state.pointsLog.push({ date: today(), reason, amount });
    save();
    renderHeader();
    checkMedals(false);
  }
  function checkMedals(silent) {
    const stats = buildStats();
    MEDALS.forEach((m) => {
      if (!state.medals.includes(m.id) && m.check(stats)) {
        state.medals.push(m.id);
        if (!silent) toastMedal(m);
      }
    });
    if (!silent) save();
  }

  /* ---------------- 主题 ---------------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("#theme-toggle").textContent = t === "eye" ? "👓" : "🌞";
    state.settings.theme = t;
  }
  function toggleTheme() {
    const t = document.documentElement.getAttribute("data-theme") === "eye" ? "light" : "eye";
    applyTheme(t);
    save();
    // 主题切换后刷新依赖颜色的图表
    const active = $(".view.active");
    if (active && active.id === "view-stats") renderStats();
    if (active && active.id === "view-rewards") renderRewards();
  }

  /* ---------------- 打卡 ---------------- */
  function doCheckin() {
    const t = today();
    if (state.checkins.includes(t)) { toast("今天已经打卡啦 📅"); return; }
    state.checkins.push(t);
    const streak = currentStreak();
    state.bestStreak = Math.max(state.bestStreak, streak);
    addPoints(POINTS.checkin, "每日打卡");
    if (streak > 0 && streak % 7 === 0) addPoints(POINTS.streakBonus, "连续打卡 " + streak + " 天奖励");
    save();
    renderHeader();
    renderDashboard();
    toast("打卡成功 +" + POINTS.checkin + " 积分 🔥");
  }

  /* ---------------- 顶栏渲染 ---------------- */
  function renderHeader() {
    const p = totalPoints();
    const r = currentRank();
    $("#hdr-points").textContent = p;
    $("#hdr-rank").textContent = r.name;
    $("#hdr-rank-icon").textContent = r.icon;
    $("#hdr-streak").textContent = currentStreak();
    $("#side-rank-fill").style.width = rankProgress() + "%";
    const btn = $("#btn-checkin");
    if (state.checkins.includes(today())) { btn.textContent = "✅ 已打卡"; btn.classList.add("done"); }
    else { btn.textContent = "📅 打卡"; btn.classList.remove("done"); }
  }

  /* ---------------- 路由 ---------------- */
  function showView(name) {
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
    $$(".nav-link").forEach((n) => n.classList.toggle("active", n.dataset.view === name));
    if (name === "dashboard") renderDashboard();
    else if (name === "list") renderList();
    else if (name === "practice") renderPracticeSetup();
    else if (name === "extend") renderExtendSetup();
    else if (name === "stats") renderStats();
    else if (name === "rewards") renderRewards();
    if (window.scrollTo) { try { window.scrollTo(0, 0); } catch (e) {} }
  }

  /* ---------------- 录入表单 ---------------- */
  function buildSubjectSelect(sel) {
    sel.innerHTML = SUBJECTS.map((s) => `<option value="${s}">${s}</option>`).join("") +
      `<option value="__custom__">+ 自定义科目</option>`;
  }
  function initAddForm() {
    const sel = $("#f-subject");
    buildSubjectSelect(sel);
    // 知识点候选（来自内置举一反三题库，便于自动匹配同类新题）
    const kpSet = new Set();
    Object.keys(KP_BANK).forEach((k) => kpSet.add(k.split("|")[1]));
    $("#kp-list").innerHTML = Array.from(kpSet).map((k) => `<option value="${esc(k)}"></option>`).join("");
    sel.addEventListener("change", () => {
      $("#f-subject-custom").classList.toggle("hidden", sel.value !== "__custom__");
    });

    $("#form-add").addEventListener("submit", (e) => {
      e.preventDefault();
      let subject = sel.value;
      if (subject === "__custom__") subject = $("#f-subject-custom").value.trim() || "其他";
      const q = {
        id: editingId || uid(),
        subject,
        type: $("#f-type").value.trim(),
        kp: $("#f-kp").value.trim(),
        question: $("#f-question").value.trim(),
        myAnswer: $("#f-my").value.trim(),
        correctAnswer: $("#f-correct").value.trim(),
        analysis: $("#f-analysis").value.trim(),
        difficulty: parseInt($("#f-difficulty").value, 10),
        mastery: parseInt($("#f-mastery").value, 10),
        image: $("#f-image").value.trim(),
        createdAt: editingId ? (findQ(editingId).createdAt) : today(),
        reviewCount: editingId ? (findQ(editingId).reviewCount || 0) : 0,
        lastReviewed: editingId ? (findQ(editingId).lastReviewed) : "",
      };
      if (!q.question || !q.type) { toast("请填写题干和题型标签"); return; }
      if (!q.kp) { toast("请填写知识点（用于举一反三匹配同类题）"); return; }
      if (editingId) {
        const i = state.questions.findIndex((x) => x.id === editingId);
        state.questions[i] = q;
        toast("已更新错题 ✅");
        cancelEdit();
      } else {
        state.questions.unshift(q);
        addPoints(POINTS.add, "录入错题");
        toast("录入成功 +" + POINTS.add + " 积分 ⭐");
        cancelEdit();
      }
      save();
      renderHeader();
      renderDashboard();
    });
  }
  function startEdit(id) {
    const q = findQ(id);
    if (!q) return;
    editingId = id;
    const sel = $("#f-subject");
    if (SUBJECTS.includes(q.subject)) sel.value = q.subject;
    else { sel.value = "__custom__"; $("#f-subject-custom").classList.remove("hidden"); $("#f-subject-custom").value = q.subject; }
    $("#f-type").value = q.type;
    $("#f-kp").value = q.kp || "";
    $("#f-question").value = q.question;
    $("#f-my").value = q.myAnswer;
    $("#f-correct").value = q.correctAnswer;
    $("#f-analysis").value = q.analysis;
    $("#f-difficulty").value = String(q.difficulty);
    $("#f-mastery").value = String(q.mastery);
    $("#f-image").value = q.image || "";
    const btn = $("#form-add button[type=submit]");
    btn.textContent = "更新错题";
    if (!$("#btn-cancel-edit")) {
      const c = document.createElement("button");
      c.type = "button"; c.id = "btn-cancel-edit"; c.className = "btn btn-ghost";
      c.textContent = "取消编辑"; c.onclick = cancelEdit;
      btn.insertAdjacentElement("afterend", c);
    }
    showView("add");
  }
  function cancelEdit() {
    editingId = null;
    $("#form-add").reset();
    $("#f-subject-custom").classList.add("hidden");
    const btn = $("#form-add button[type=submit]");
    btn.textContent = "保存错题（+10 积分）";
    const c = $("#btn-cancel-edit");
    if (c) c.remove();
  }

  /* ---------------- 错题本列表 ---------------- */
  function findQ(id) { return state.questions.find((x) => x.id === id); }
  function uniqueSubjects() { return Array.from(new Set(state.questions.map((q) => q.subject))); }

  function renderListFilters() {
    const subj = uniqueSubjects();
    const subs = `<select id="lf-subject" class="search-input" style="width:auto">
      <option value="all">全部科目</option>${subj.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
    </select>`;
    const masters = [["all", "全部"], ["0", "🔴 未掌握"], ["1", "🟡 复习中"], ["2", "🟢 已掌握"]]
      .map(([v, l]) => `<button class="filter-btn ${listFilter.mastery === v ? "active" : ""}" data-m="${v}">${l}</button>`).join("");
    $("#list-filters").innerHTML = `
      ${subs}
      ${masters}
      <input id="lf-search" class="search-input" placeholder="搜索题干 / 标签…" value="${esc(listFilter.search)}" />
      <span class="spacer"></span>
      <button class="btn btn-sm btn-ghost" id="lf-print">🖨 打印本筛选</button>`;
    $("#lf-subject").addEventListener("change", (e) => { listFilter.subject = e.target.value; renderList(); });
    $("#lf-search").addEventListener("input", (e) => { listFilter.search = e.target.value.trim(); renderList(); });
    $$("#list-filters .filter-btn").forEach((b) => b.addEventListener("click", () => {
      listFilter.mastery = b.dataset.m; renderListFilters(); renderList();
    }));
    $("#lf-print").addEventListener("click", () => { buildPrint(listFilter.mastery === "all" ? "all" : parseInt(listFilter.mastery, 10)); window.print(); });
  }

  function filteredQuestions() {
    return state.questions.filter((q) => {
      if (listFilter.subject !== "all" && q.subject !== listFilter.subject) return false;
      if (listFilter.mastery !== "all" && String(q.mastery) !== listFilter.mastery) return false;
      if (listFilter.search) {
        const k = listFilter.search.toLowerCase();
        if (!(q.question + q.type + q.analysis).toLowerCase().includes(k)) return false;
      }
      return true;
    });
  }

  function renderList() {
    renderListFilters();
    const list = filteredQuestions();
    const box = $("#list-container");
    $("#list-empty").classList.toggle("hidden", state.questions.length > 0);
    if (list.length === 0) { box.innerHTML = `<p class="hint">没有符合条件的错题。</p>`; return; }
    box.innerHTML = list.map((q) => `
      <div class="q-card m${q.mastery}">
        <div class="q-head">
          <span class="q-tag">${esc(q.type)}</span>
          <span class="q-subject">${esc(q.subject)}</span>
          ${q.kp ? `<span class="q-kp">📌${esc(q.kp)}</span>` : ""}
          <span class="q-mastery">
            <button class="mastery-btn" data-id="${q.id}" title="点击切换掌握程度">${MASTERY[q.mastery]}</button>
          </span>
        </div>
        <div class="q-body">
          <div class="q-q">${esc(q.question)}</div>
          ${q.myAnswer ? `<div class="q-ans"><div class="qa wrong"><div class="lbl">我的答案</div><div class="val">${esc(q.myAnswer)}</div></div>${q.correctAnswer ? `<div class="qa right"><div class="lbl">正确答案</div><div class="val">${esc(q.correctAnswer)}</div></div>` : ""}</div>` : (q.correctAnswer ? `<div class="q-ans"><div class="qa right"><div class="lbl">正确答案</div><div class="val">${esc(q.correctAnswer)}</div></div></div>` : "")}
          ${q.analysis ? `<div class="q-analysis"><span class="lbl">解析 / 错因：</span>${esc(q.analysis)}</div>` : ""}
          ${q.image ? `<img class="q-img" src="${esc(q.image)}" alt="配图" onerror="this.style.display='none'" />` : ""}
        </div>
        <div class="q-foot">
          <button class="btn btn-sm btn-ghost" data-edit="${q.id}">✏️ 编辑</button>
          <button class="btn btn-sm btn-ghost" data-del="${q.id}">🗑 删除</button>
          <span class="q-meta">复习 ${q.reviewCount || 0} 次 · 录入 ${q.createdAt}</span>
        </div>
      </div>`).join("");

    $$("#list-container .mastery-btn").forEach((b) => b.addEventListener("click", () => cycleMastery(b.dataset.id)));
    $$("#list-container [data-edit]").forEach((b) => b.addEventListener("click", () => startEdit(b.dataset.edit)));
    $$("#list-container [data-del]").forEach((b) => b.addEventListener("click", () => deleteQ(b.dataset.del)));
  }

  function cycleMastery(id) {
    const q = findQ(id);
    if (!q) return;
    setMastery(id, (q.mastery + 1) % 3);
  }
  function setMastery(id, val) {
    const q = findQ(id);
    if (!q) return;
    const old = q.mastery;
    q.mastery = val;
    q.reviewCount = (q.reviewCount || 0) + 1;
    q.lastReviewed = today();
    if (val === 2 && old !== 2) {
      addPoints(POINTS.master, "掌握错题");
      state.masteryLog.push(today());
    }
    save();
    renderList();
    renderHeader();
    renderDashboard();
    checkMedals(false);
  }
  function deleteQ(id) {
    if (!confirm("确定删除这道错题？")) return;
    state.questions = state.questions.filter((x) => x.id !== id);
    save();
    renderList();
    renderHeader();
    renderDashboard();
    toast("已删除");
  }

  /* ---------------- 练习引擎（自测 / 举一反三共用） ---------------- */
  function getPool(scope, subject, count) {
    let pool = state.questions.slice();
    if (scope === "red") pool = pool.filter((q) => q.mastery === 0);
    if (scope === "subject" && subject && subject !== "all") pool = pool.filter((q) => q.subject === subject);
    // 未掌握优先
    pool.sort((a, b) => a.mastery - b.mastery);
    if (count && count !== "all") pool = pool.slice(0, parseInt(count, 10));
    return pool;
  }

  function startSession(pool, title, kind) {
    if (pool.length === 0) { toast("没有可用的题目"); return; }
    const total = pool.length;
    let idx = 0, correct = 0;
    const area = kind === "extend" ? $("#extend-area") : $("#practice-area");
    const setup = kind === "extend" ? $("#extend-setup") : $("#practice-setup");
    setup.innerHTML = "";

    function renderQuestion() {
      const q = pool[idx];
      area.innerHTML = `
        <div class="practice-card">
          <div class="pc-progress"><span>${esc(title)}</span><span>第 ${idx + 1} / ${total} 题</span></div>
          <div class="pc-question">${q.isBank ? '<span class="new-badge">✨ 新题</span>' : ""}${esc(q.question)}</div>
          <textarea class="pc-input" id="pc-input" placeholder="写下你的解答…"></textarea>
          <div class="pc-actions">
            <button class="btn btn-primary" id="pc-submit">提交答案</button>
          </div>
          <div id="pc-feedback"></div>
        </div>`;
      $("#pc-submit").addEventListener("click", () => {
        const fb = $("#pc-feedback");
        fb.innerHTML = `
          <div class="pc-result">
            <div class="r-title">参考答案 & 解析</div>
            ${q.correctAnswer ? `<p><b>正确答案：</b>${esc(q.correctAnswer)}</p>` : ""}
            ${q.analysis ? `<p><b>解析：</b>${esc(q.analysis)}</p>` : ""}
            <div class="pc-actions">
              <button class="btn btn-primary" id="pc-right">我答对了 ✅</button>
              <button class="btn btn-ghost" id="pc-wrong">我答错了 ❌</button>
            </div>
          </div>`;
        $("#pc-right").addEventListener("click", () => {
          correct++;
          if (!q.isBank) adjustMastery(q.id, Math.min(2, q.mastery + 1));
          next();
        });
        $("#pc-wrong").addEventListener("click", () => {
          if (q.isBank) addBankWrong(q); else adjustMastery(q.id, 0);
          next();
        });
      });
      $("#pc-input").focus();
    }
    function adjustMastery(id, nv) {
      const q = findQ(id);
      if (!q) return;
      const old = q.mastery;
      q.mastery = nv;
      q.reviewCount = (q.reviewCount || 0) + 1;
      q.lastReviewed = today();
      if (nv === 2 && old !== 2) { addPoints(POINTS.master, "掌握错题"); state.masteryLog.push(today()); }
      save();
    }
    // 举一反三里答错的“新题”自动收入错题本（按题干去重，避免重复堆积）
    function addBankWrong(item) {
      const ex = state.questions.find((x) => x.question === item.question);
      if (ex) { ex.mastery = 0; save(); renderList(); return; }
      const now = today();
      state.questions.unshift({
        id: uid(), subject: item.subject, type: item.type, kp: item.kp,
        question: item.question, myAnswer: "", correctAnswer: item.correctAnswer,
        analysis: item.analysis, difficulty: 3, mastery: 0,
        image: "", createdAt: now, reviewCount: 0, lastReviewed: "",
        preset: false, fromExtend: true,
      });
      save();
      renderDashboard();
      renderList();
    }
    function next() {
      idx++;
      if (idx < total) renderQuestion();
      else finish();
    }
    function finish() {
      addPoints(POINTS.practice * total, kind === "extend" ? "举一反三练习" : "自测练习");
      if (kind === "extend") state.extendCount = (state.extendCount || 0) + 1;
      else state.practiceCount = (state.practiceCount || 0) + 1;
      save();
      renderHeader();
      renderDashboard();
      checkMedals(false);
      area.innerHTML = `
        <div class="practice-card pc-summary">
          <div class="big">${correct} / ${total}</div>
          <p>本次${kind === "extend" ? "举一反三" : "自测"}完成！获得 <b>+${POINTS.practice * total}</b> 积分 ⭐</p>
          <div class="pc-actions" style="justify-content:center">
            <button class="btn btn-primary" id="pc-again">再来一组</button>
            <button class="btn btn-ghost" id="pc-back">返回</button>
          </div>
        </div>`;
      $("#pc-again").addEventListener("click", () => { kind === "extend" ? renderExtendSetup() : renderPracticeSetup(); });
      $("#pc-back").addEventListener("click", () => showView(kind === "extend" ? "extend" : "practice"));
    }
    renderQuestion();
  }

  /* ---------------- 自测设置 ---------------- */
  function renderPracticeSetup() {
    $("#practice-area").innerHTML = "";
    const subjects = uniqueSubjects();
    const subjOpts = subjects.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
    $("#practice-setup").innerHTML = `
      <div class="setup-row">
        <div class="form-row"><label>练习范围</label>
          <select id="p-scope">
            <option value="red">优先未掌握</option>
            <option value="all">全部错题</option>
            <option value="subject">指定科目</option>
          </select></div>
        <div class="form-row hidden" id="p-subject-wrap"><label>科目</label>
          <select id="p-subject">${subjOpts}</select></div>
        <div class="form-row"><label>题量</label>
          <select id="p-count"><option value="5">5 题</option><option value="10">10 题</option><option value="15">15 题</option><option value="all">全部</option></select></div>
        <button class="btn btn-primary" id="p-start">开始自测</button>
      </div>`;
    const scope = $("#p-scope");
    scope.addEventListener("change", () => {
      $("#p-subject-wrap").classList.toggle("hidden", scope.value !== "subject");
    });
    $("#p-start").addEventListener("click", () => {
      const pool = getPool(scope.value, $("#p-subject").value, $("#p-count").value);
      startSession(pool, "自测练习", "practice");
    });
  }

  /* ---------------- 举一反三设置 ---------------- */
  function renderExtendSetup() {
    $("#extend-area").innerHTML = "";
    // 按“知识点(kp) 优先，缺则题型标签(type)”分组
    const groups = {};
    state.questions.forEach((q) => {
      const key = q.kp || q.type;
      if (!key) return;
      if (!groups[key]) groups[key] = { kp: key, subject: q.subject, own: 0 };
      else groups[key].own++;
    });
    const keys = Object.keys(groups);
    if (keys.length === 0) {
      $("#extend-setup").innerHTML = `<p class="hint">还没有错题，先去录入并填写「知识点」吧。</p>`;
      return;
    }
    const items = keys.map((k) => {
      const g = groups[k];
      const bankKey = g.subject + "|" + g.kp;
      const bank = KP_BANK[bankKey] || [];
      return { kp: g.kp, subject: g.subject, own: g.own + 1, bankCount: bank.length };
    }).sort((a, b) => b.own - a.own);
    $("#extend-setup").innerHTML = `
      <p class="hint">选择知识点，系统先让你重做自己的错题，再<strong>推送同知识点的同类新题</strong>（举一反三）。答错的新题会自动收入错题本。</p>
      <div class="toolbar" id="ext-tags">
        ${items.map((g) => `<button class="filter-btn" data-sub="${esc(g.subject)}" data-kp="${esc(g.kp)}">${esc(g.subject)}·${esc(g.kp)} <b>(${g.own}错题${g.bankCount ? " +" + g.bankCount + "新题" : ""})</b></button>`).join("")}
      </div>`;
    $$("#ext-tags .filter-btn").forEach((b) => b.addEventListener("click", () => startExtend(b.dataset.sub, b.dataset.kp)));
  }

  function startExtend(subject, kp) {
    // 自己的错题（同知识点）+ 题库里的同类新题
    const own = state.questions.filter((q) => (q.kp || q.type) === kp && q.subject === subject);
    const bankKey = subject + "|" + kp;
    const bank = (KP_BANK[bankKey] || []).map((it) => ({
      isBank: true, subject, kp, type: kp,
      question: it.q, correctAnswer: it.a, analysis: it.an,
    }));
    const pool = own.concat(bank);
    if (own.length === 0 && bank.length === 0) { toast("暂无可用题目"); return; }
    startSession(pool, "举一反三 · " + subject + "·" + kp, "extend");
  }

  /* ---------------- 概览 ---------------- */
  function renderDashboard() {
    const total = state.questions.length;
    const red = state.questions.filter((q) => q.mastery === 0).length;
    const green = state.questions.filter((q) => q.mastery === 2).length;
    const p = totalPoints();
    const gradeTxt = state.settings.grade ? state.settings.grade + " · " : "";
    $("#dash-greet").textContent = (state.settings.name ? state.settings.name + "，" : "") + gradeTxt + "欢迎回来，继续攻克你的错题吧！";
    $("#dash-stats").innerHTML = `
      <div class="dash-stat"><div class="ds-icon">📚</div><div class="ds-num">${total}</div><div class="ds-label">错题总数</div></div>
      <div class="dash-stat"><div class="ds-icon">🔴</div><div class="ds-num">${red}</div><div class="ds-label">待攻克（未掌握）</div></div>
      <div class="dash-stat"><div class="ds-icon">🟢</div><div class="ds-num">${green}</div><div class="ds-label">已掌握</div></div>
      <div class="dash-stat"><div class="ds-icon">⭐</div><div class="ds-num">${p}</div><div class="ds-label">累计积分</div></div>`;

    const recent = state.questions.slice(0, 5);
    $("#dash-recent").innerHTML = recent.length ? recent.map((q) => `
      <div class="recent-item">
        <span class="ri-dot" style="background:${MASTERY_COLOR[q.mastery]}"></span>
        <span class="ri-text"><div class="ri-title">${esc(q.question.slice(0, 40))}</div>
        <div class="ri-sub">${esc(q.subject)} · ${esc(q.type)}</div></span>
      </div>`).join("") : `<p class="hint">暂无错题</p>`;

    const tips = [];
    if (red > 0) tips.push({ icon: "✍️", text: `你有 ${red} 道未掌握错题，去「自测练习」巩固一下`, act: "practice" });
    if (!state.checkins.includes(today())) tips.push({ icon: "📅", text: "今天还没打卡，连续打卡可得额外积分", act: "checkin" });
    if (Object.keys(uniqueTags()).length > 0) tips.push({ icon: "🧠", text: "试试「举一反三」，同类题集中突破", act: "extend" });
    if (tips.length === 0) tips.push({ icon: "🎉", text: "保持得很好！继续录入错题保持手感", act: "add" });
    $("#dash-next").innerHTML = tips.map((t) => `
      <div class="next-item" ${t.act ? `data-act="${t.act}" style="cursor:pointer"` : ""}>
        <span class="ni-icon">${t.icon}</span><span>${t.text}</span></div>`).join("");
    $$("#dash-next .next-item[data-act]").forEach((el) => el.addEventListener("click", () => {
      const a = el.dataset.act;
      if (a === "checkin") doCheckin();
      else showView(a);
    }));
  }
  function uniqueTags() { const t = {}; state.questions.forEach((q) => { t[q.type] = 1; }); return t; }

  /* ---------------- 统计可视化 ---------------- */
  function getVarColor(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function renderStats() {
    const m = [0, 0, 0];
    state.questions.forEach((q) => m[q.mastery]++);
    const total = state.questions.length || 1;

    // 三色环形图
    const colors = [getVarColor("--red"), getVarColor("--yellow"), getVarColor("--green")];
    const r = 52, c = 2 * Math.PI * r, cx = 60, cy = 60;
    let off = 0, segs = "";
    m.forEach((v, i) => {
      const len = (v / total) * c;
      segs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="16" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;
      off += len;
    });
    const greenPct = Math.round((m[2] / total) * 100);
    const donut = `<svg width="120" height="120" viewBox="0 0 120 120">${segs}<text x="60" y="56" text-anchor="middle" font-size="20" font-weight="800" fill="${getVarColor("--text")}">${greenPct}%</text><text x="60" y="74" text-anchor="middle" font-size="10" fill="${getVarColor("--muted")}">已掌握</text></svg>`;
    const legend = `
      <div class="donut-legend">
        <div class="legend-item"><span class="legend-dot" style="background:${colors[0]}"></span>未掌握 ${m[0]}</div>
        <div class="legend-item"><span class="legend-dot" style="background:${colors[1]}"></span>复习中 ${m[1]}</div>
        <div class="legend-item"><span class="legend-dot" style="background:${colors[2]}"></span>已掌握 ${m[2]}</div>
      </div>`;

    // 科目柱状图
    const subjCount = {};
    state.questions.forEach((q) => { subjCount[q.subject] = (subjCount[q.subject] || 0) + 1; });
    const subjArr = Object.entries(subjCount).sort((a, b) => b[1] - a[1]);
    const maxS = subjArr.length ? subjArr[0][1] : 1;
    const bars = subjArr.map(([s, n]) => `
      <div class="bar-row"><span class="bar-label">${esc(s)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${Math.round((n / maxS) * 100)}%"></span></span>
      <span class="bar-val">${n}</span></div>`).join("") || `<p class="hint">暂无数据</p>`;

    // 积分成长曲线（按日累计）
    const byDay = {};
    state.pointsLog.forEach((l) => { byDay[l.date] = (byDay[l.date] || 0) + l.amount; });
    const days = Object.keys(byDay).sort();
    let cum = 0; const series = days.map((d) => { cum += byDay[d]; return { date: d, cum }; });
    const line = lineChart(series);

    // 打卡热力图（近 35 天）
    const heat = heatmap();

    $("#stats-charts").innerHTML = `
      <div class="stat-box"><h3>🎨 掌握程度分布</h3><div class="chart-donut">${donut}${legend}</div></div>
      <div class="stat-box"><h3>📚 各科目错题量</h3><div class="bar-chart">${bars}</div></div>
      <div class="stat-box"><h3>📈 积分成长曲线</h3>${line}</div>
      <div class="stat-box"><h3>🔥 打卡热力图（近 35 天）</h3>${heat}</div>`;
  }

  function lineChart(series) {
    if (!series.length) return `<p class="hint">暂无积分记录</p>`;
    const w = 480, h = 170, pad = 28;
    const max = Math.max(...series.map((p) => p.cum), 1);
    const n = series.length;
    const X = (i) => pad + (i * (w - 2 * pad)) / Math.max(n - 1, 1);
    const Y = (v) => h - pad - (v / max) * (h - 2 * pad);
    const pts = series.map((p, i) => `${X(i).toFixed(1)},${Y(p.cum).toFixed(1)}`).join(" ");
    const area = `M ${X(0).toFixed(1)},${(h - pad).toFixed(1)} L ` + series.map((p, i) => `${X(i).toFixed(1)},${Y(p.cum).toFixed(1)}`).join(" L ") + ` L ${X(n - 1).toFixed(1)},${(h - pad).toFixed(1)} Z`;
    const stroke = getVarColor("--primary");
    return `<svg class="line-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      <path d="${area}" fill="${stroke}" opacity="0.12"/>
      <polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="2.5"/>
      <circle cx="${X(n - 1).toFixed(1)}" cy="${Y(series[n - 1].cum).toFixed(1)}" r="4" fill="${stroke}"/>
      <text x="${X(n - 1).toFixed(1)}" y="${(Y(series[n - 1].cum) - 8).toFixed(1)}" text-anchor="end" font-size="11" fill="${getVarColor("--muted")}">${series[n - 1].cum} 分</text>
    </svg>`;
  }

  function heatmap() {
    const cells = [];
    const todayD = new Date();
    const byDay = {};
    state.pointsLog.forEach((l) => { byDay[l.date] = (byDay[l.date] || 0) + l.amount; });
    for (let i = 34; i >= 0; i--) {
      const d = addDays(todayD, -i);
      const key = dateKey(d);
      const pts = byDay[key] || 0;
      let lvl = 0;
      if (pts > 0) lvl = pts <= 10 ? 1 : pts <= 30 ? 2 : pts <= 60 ? 3 : 4;
      const checked = state.checkins.includes(key);
      const cls = lvl > 0 ? "on" + lvl : (checked ? "on1" : "");
      cells.push(`<div class="heat-cell ${cls}" title="${key} · ${pts} 积分">${d.getDate()}</div>`);
    }
    return `<div class="heatmap">${cells.join("")}</div>`;
  }

  /* ---------------- 奖励中心 ---------------- */
  function renderRewards() {
    const r = currentRank();
    const i = currentRankIndex();
    const next = RANKS[i + 1];
    const p = totalPoints();
    const hero = `
      <div class="rank-hero">
        <div class="rank-badge">${r.icon}</div>
        <div class="rank-info">
          <h2>${r.name}段位</h2>
          <div class="next">${next ? `距「${next.name}」还差 ${next.min - p} 积分` : "已达最高段位，了不起！"}</div>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:${rankProgress()}%"></div></div>
        </div>
        <div style="margin-left:auto;text-align:center">
          <div style="font-size:30px;font-weight:800;color:var(--gold)">${p}</div>
          <div style="color:var(--muted);font-size:12px">累计积分</div>
        </div>
      </div>`;

    const medals = MEDALS.map((m) => {
      const got = state.medals.includes(m.id);
      return `<div class="medal ${got ? "" : "locked"}">
        <div class="m-icon">${m.icon}</div>
        <div class="m-name">${m.name}</div>
        <div class="m-desc">${m.desc}</div>
        <div class="m-state">${got ? "已解锁 ✓" : "未解锁"}</div>
      </div>`;
    }).join("");

    const log = state.pointsLog.slice().reverse().slice(0, 12)
      .map((l) => `<div class="log-row"><span>${esc(l.reason)} · ${l.date}</span><span class="lr-amt ${l.amount < 0 ? "minus" : ""}">${l.amount >= 0 ? "+" : ""}${l.amount}</span></div>`).join("")
      || `<p class="hint">暂无积分记录</p>`;

    $("#rewards-content").innerHTML = `
      ${hero}
      <h3 style="margin:6px 0 12px">🏅 学习勋章（${state.medals.length}/${MEDALS.length}）</h3>
      <div class="medals-grid">${medals}</div>
      <div class="card" style="margin-top:18px"><div class="card-head"><h2>📜 最近积分记录</h2></div><div class="points-log">${log}</div></div>`;
  }

  /* ---------------- 设置 / 导入导出 / 打印 ---------------- */
  function initSettings() {
    $("#set-name").value = state.settings.name || "";
    $("#set-theme").value = state.settings.theme || "light";
    $("#set-grade").value = state.settings.grade || "";
    $("#set-share").checked = !!state.settings.sharePublic;
    $("#btn-reseed").addEventListener("click", () => {
      const g = $("#set-grade").value;
      if (!g) { toast("请先在上方选择年级"); return; }
      const n = seedGrade(g, true);
      state.settings.grade = g;
      hideGradeModal();
      save();
      renderAll();
      checkMedals(false);
      toast(`已按「${g}」重新推送 ${n} 道易错题 📚`);
    });
    $("#btn-save-settings").addEventListener("click", () => {
      state.settings.name = $("#set-name").value.trim() || "同学";
      state.settings.theme = $("#set-theme").value;
      state.settings.sharePublic = $("#set-share").checked;
      applyTheme(state.settings.theme);
      save();
      renderDashboard();
      syncProfile();
      toast("设置已保存");
    });
    const lo = $("#btn-logout");
    if (lo) lo.addEventListener("click", () => { if (confirm("确定退出登录？")) doLogout(); });
    $("#btn-export").addEventListener("click", exportData);
    $("#btn-import").addEventListener("click", () => $("#import-file").click());
    $("#import-file").addEventListener("change", importData);
    $("#btn-reset").addEventListener("click", () => {
      if (!confirm("将清空全部错题、积分、打卡等数据，且不可恢复。确定？")) return;
      localStorage.removeItem(LS_KEY);
      state = { questions: [], checkins: [], pointsLog: [], medals: [], masteryLog: [], practiceCount: 0, extendCount: 0, bestStreak: 0, settings: { name: "同学", theme: state.settings.theme } };
      applyTheme(state.settings.theme);
      save(); renderAll(); toast("已清空全部数据");
    });
    $("#btn-print").addEventListener("click", () => {
      const f = $("#print-filter").value;
      buildPrint(f === "all" ? "all" : parseInt(f, 10));
      window.print();
    });
  }
  function exportData() {
    const data = { version: 1, exportedAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "错题本备份_" + today() + ".json";
    a.click();
    toast("已导出备份文件 ⬇");
  }
  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const s = data.state || data;
        // 合并：题目按 id 去重，打卡/积分/勋章取并集
        const map = {};
        state.questions.forEach((q) => { map[q.id] = q; });
        (s.questions || []).forEach((q) => { map[q.id] = q; });
        state.questions = Object.values(map);
        state.checkins = Array.from(new Set([...state.checkins, ...(s.checkins || [])])).sort();
        state.pointsLog = [...(s.pointsLog || []), ...state.pointsLog];
        state.medals = Array.from(new Set([...state.medals, ...(s.medals || [])]));
        state.masteryLog = Array.from(new Set([...state.masteryLog, ...(s.masteryLog || [])]));
        state.practiceCount = Math.max(state.practiceCount || 0, s.practiceCount || 0);
        state.extendCount = Math.max(state.extendCount || 0, s.extendCount || 0);
        state.bestStreak = Math.max(state.bestStreak || 0, s.bestStreak || 0);
        if (s.settings) state.settings = Object.assign(state.settings, s.settings);
        save();
        applyTheme(state.settings.theme || "light");
        renderAll();
        toast("导入并合并完成 ✅");
      } catch (err) { toast("导入失败：文件格式不正确"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }
  function buildPrint(filter) {
    const list = filter === "all" ? state.questions : state.questions.filter((q) => q.mastery === filter);
    const name = state.settings.name || "同学";
    let html = `<div class="print-title">${esc(name)} 的错题复习卷（${new Date().toLocaleDateString()}）</div>`;
    if (list.length === 0) html += `<p>暂无错题</p>`;
    list.forEach((q, idx) => {
      html += `<div class="print-q">
        <div class="pq-head">${idx + 1}. 【${esc(q.subject)}】${esc(q.type)} ${MASTERY[q.mastery]}</div>
        <div class="pq-line"><b>题目：</b>${esc(q.question)}</div>
        ${q.correctAnswer ? `<div class="pq-line"><b>正确答案：</b>${esc(q.correctAnswer)}</div>` : ""}
        ${q.analysis ? `<div class="pq-line"><b>解析：</b>${esc(q.analysis)}</div>` : ""}
        <div class="pq-blank"></div>
      </div>`;
    });
    $("#print-area").innerHTML = html;
  }

  /* ---------------- 年级与易错题推送 ---------------- */
  function seedGrade(grade, replace) {
    const data = GRADE_BANK[grade];
    if (!data) return 0;
    if (replace) state.questions = state.questions.filter((q) => !q.preset);
    const diff = grade === "小学" ? 2 : grade === "初中" ? 3 : 4;
    const now = today();
    const added = [];
    data.subjects.forEach((sub) => {
      const kps = GRADE_KP[grade + "|" + sub] || [];
      (data.bank[sub] || []).forEach((item, i) => {
        const kp = kps[i] || (sub + "易错题");
        added.push({
          id: uid(), subject: sub, type: kp, kp: kp,
          question: item.q, myAnswer: item.wrong, correctAnswer: item.right,
          analysis: item.analysis, difficulty: diff, mastery: 0,
          image: "", createdAt: now, reviewCount: 0, lastReviewed: "",
          preset: true, grade: grade,
        });
      });
    });
    state.questions = added.concat(state.questions);
    save();
    return added.length;
  }

  function populateGradeGrid() {
    $("#grade-grid").innerHTML = GRADES.map((g) =>
      `<button class="btn grade-btn" data-grade="${g}">${g}</button>`).join("");
    $$("#grade-grid .grade-btn").forEach((b) => b.addEventListener("click", () => selectGrade(b.dataset.grade)));
  }
  function showGradeModal() { $("#grade-modal").classList.remove("hidden"); }
  function hideGradeModal() { $("#grade-modal").classList.add("hidden"); }

  function selectGrade(grade) {
    const n = seedGrade(grade, false);
    state.settings.grade = grade;
    save();
    hideGradeModal();
    renderAll();
    checkMedals(false);
    toast(`已为你推送 ${n} 道「${grade}」易错题，去错题本看看吧 📚`);
    showView("list");
  }

  function initGradeModal() {
    populateGradeGrid();
    if (!state.settings.grade) showGradeModal();
  }

  /* ---------------- 全局渲染 ---------------- */
  function renderAll() {
    renderHeader();
    renderDashboard();
    renderList();
    renderPracticeSetup();
    renderExtendSetup();
    renderStats();
    renderRewards();
  }

  /* ---------------- 事件绑定 ---------------- */
  function bindGlobal() {
    $$(".nav-link").forEach((n) => n.addEventListener("click", () => showView(n.dataset.view)));
    $$("[data-view]").forEach((el) => { if (el.classList.contains("link")) el.addEventListener("click", () => showView(el.dataset.view)); });
    $("#theme-toggle").addEventListener("click", toggleTheme);
    $("#btn-checkin").addEventListener("click", doCheckin);
  }

  /* ---------------- 后端 API & 登录 ---------------- */
  const api = {
    async req(method, url, body) {
      const opt = { method, credentials: "same-origin", headers: {} };
      if (body !== undefined) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
      const r = await fetch(url, opt);
      let data = null; try { data = await r.json(); } catch (e) {}
      return { ok: r.ok, status: r.status, data };
    },
    me() { return this.req("GET", "/api/auth/me").then((r) => r.data || { user: null }); },
    devLogin(name) { return this.req("POST", "/api/auth/dev", { name }); },
    logout() { return this.req("POST", "/api/auth/logout"); },
    saveProfile(p) { return this.req("POST", "/api/profile", p); },
    getProfile(id) { return this.req("GET", "/api/profile/" + id); },
    createGroup(name, desc) { return this.req("POST", "/api/groups", { name, desc }); },
    searchGroup(q) { return this.req("GET", "/api/groups/search?q=" + encodeURIComponent(q)); },
    myGroups() { return this.req("GET", "/api/groups/mine"); },
    getGroup(num) { return this.req("GET", "/api/groups/" + num); },
    joinGroup(num) { return this.req("POST", "/api/groups/" + num + "/join"); },
    approve(num, userId) { return this.req("POST", "/api/groups/" + num + "/approve", { userId }); },
    reject(num, userId) { return this.req("POST", "/api/groups/" + num + "/reject", { userId }); },
    removeMember(num, userId) { return this.req("DELETE", "/api/groups/" + num + "/member", { userId }); },
    transfer(num, userId) { return this.req("POST", "/api/groups/" + num + "/transfer", { userId }); },
    deleteGroup(num) { return this.req("DELETE", "/api/groups/" + num); },
    members(num) { return this.req("GET", "/api/groups/" + num + "/members"); },
  };

  function syncProfile() {
    if (!currentUser) return;
    const questions = state.questions.map((q) => ({ subject: q.subject, mastery: q.mastery, kp: q.kp || "", type: q.type || "" }));
    api.saveProfile({ name: state.settings.name || "同学", points: totalPoints(), public: !!state.settings.sharePublic, questions });
  }

  function showLogin() { const ov = $("#login-overlay"); if (ov) ov.classList.remove("hidden"); }
  function hideLogin() { const ov = $("#login-overlay"); if (ov) ov.classList.add("hidden"); }
  async function doDevLogin() {
    const name = ($("#login-name").value || "").trim();
    const r = await api.devLogin(name);
    if (r.ok && r.data && r.data.user) { currentUser = r.data.user; hideLogin(); startApp(); }
    else toast("登录失败，请重试");
  }
  async function doLogout() {
    await api.logout();
    currentUser = null;
    location.reload();
  }

  /* ---------------- 学习小组 ---------------- */
  function initGroups() {
    $("#btn-create-group").addEventListener("click", openCreateModal);
    $("#btn-group-create-confirm").addEventListener("click", submitCreateGroup);
    $("#btn-group-create-cancel").addEventListener("click", () => $("#group-modal").classList.add("hidden"));
    $("#btn-group-search").addEventListener("click", doSearchGroup);
    $("#group-search-input").addEventListener("keydown", (e) => { if (e.key === "Enter") doSearchGroup(); });
    $("#member-modal-close").addEventListener("click", () => $("#member-modal").classList.add("hidden"));
    loadMyGroups();
  }

  async function loadMyGroups() {
    const r = await api.myGroups();
    const box = $("#my-groups");
    if (!r.ok || !r.data) { box.innerHTML = '<p class="hint">加载小组失败</p>'; return; }
    const list = r.data.groups || [];
    if (!list.length) { box.innerHTML = '<p class="hint">你还没有加入任何小组。创建一个，或搜索 6 位编号加入同学的小组吧！</p>'; return; }
    box.innerHTML = '<h3 class="sub-title">我的小组</h3>' + list.map((g) => `
      <div class="group-card">
        <div class="gc-main">
          <div class="gc-name">${esc(g.name)}</div>
          <div class="gc-meta"><span class="role-badge role-${g.role}">${g.role === "leader" ? "组长" : g.role === "member" ? "成员" : "待审核"}</span> · ${g.memberCount} 人</div>
        </div>
        <button class="btn btn-sm" data-enter="${esc(g.number)}">进入</button>
      </div>`).join("");
    $$("#my-groups [data-enter]").forEach((b) => b.addEventListener("click", () => openGroup(b.dataset.enter)));
  }

  function openCreateModal() {
    $("#group-name").value = ""; $("#group-desc").value = "";
    $("#group-modal").classList.remove("hidden");
    setTimeout(() => $("#group-name").focus(), 50);
  }
  async function submitCreateGroup() {
    const name = ($("#group-name").value || "").trim();
    if (!name) { toast("请填写小组名称"); return; }
    const desc = ($("#group-desc").value || "").trim();
    const r = await api.createGroup(name, desc);
    if (r.ok && r.data && r.data.group) {
      $("#group-modal").classList.add("hidden");
      toast("小组创建成功！编号：" + r.data.group.number);
      loadMyGroups();
      openGroup(r.data.group.number);
    } else toast("创建失败：" + ((r.data && r.data.error) || r.status));
  }

  async function doSearchGroup() {
    const q = ($("#group-search-input").value || "").trim();
    if (!/^\d{6}$/.test(q)) { toast("请输入 6 位小组编号"); return; }
    const r = await api.searchGroup(q);
    const box = $("#group-search-result");
    if (!r.ok || !r.data || !r.data.group) { box.innerHTML = '<p class="hint">未找到编号为 ' + esc(q) + ' 的小组。</p>'; return; }
    const g = r.data.group;
    box.innerHTML = `
      <div class="group-card">
        <div class="gc-main">
          <div class="gc-name">${esc(g.name)}</div>
          <div class="gc-meta">编号 ${esc(g.number)} · ${g.memberCount} 人${g.desc ? " · " + esc(g.desc) : ""}</div>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-apply-group">申请加入</button>
      </div>`;
    $("#btn-apply-group").addEventListener("click", () => applyGroup(g.number));
  }
  async function applyGroup(num) {
    const r = await api.joinGroup(num);
    if (r.ok) { toast("已提交申请，等待组长审核 ⏳"); $("#group-search-result").innerHTML = '<p class="hint">已提交加入申请，请等待组长通过。</p>'; loadMyGroups(); }
    else toast("申请失败：" + ((r.data && r.data.error) || r.status));
  }

  async function openGroup(num) {
    const r = await api.getGroup(num);
    const box = $("#group-detail");
    if (!r.ok || !r.data || !r.data.group) { box.innerHTML = '<p class="hint">无法打开小组。</p>'; return; }
    const g = r.data.group;
    const isLeader = g.isLeader;
    let html = `
      <div class="group-detail-card">
        <div class="gd-head">
          <div>
            <div class="gd-name">${esc(g.name)}</div>
            <div class="gd-meta">编号 ${esc(g.number)} · ${g.memberCount} 人${g.desc ? " · " + esc(g.desc) : ""}</div>
          </div>
          ${isLeader ? '<span class="role-badge role-leader">我是组长</span>' : (g.isPending ? '<span class="role-badge role-pending">审核中</span>' : '<span class="role-badge role-member">我是成员</span>')}
        </div>`;
    if (g.isPending) { html += '<p class="hint">你的加入申请正在等待组长审核。</p></div>'; box.innerHTML = html; return; }
    html += '<h3 class="sub-title">积分排行榜</h3><div class="rank-list" id="rank-list"></div>';
    html += '<h3 class="sub-title">小组成员</h3><div class="member-list" id="member-list"></div>';
    if (isLeader && g.pending && g.pending.length) html += '<h3 class="sub-title">待审核申请</h3><div class="pending-list" id="pending-list"></div>';
    if (isLeader) html += '<div class="gd-actions"><button class="btn btn-danger-ghost btn-sm" id="btn-delete-group">删除小组</button></div>';
    html += '</div>';
    box.innerHTML = html;
    renderRanking(num);
    renderMembers(num, g);
    if (isLeader && g.pending && g.pending.length) renderPending(num, g);
    if (isLeader) $("#btn-delete-group").addEventListener("click", () => deleteGroup(num));
  }

  async function renderRanking(num) {
    const r = await api.members(num);
    const box = $("#rank-list");
    if (!r.ok || !r.data) { box.innerHTML = '<p class="hint">加载失败</p>'; return; }
    const arr = r.data.members || [];
    box.innerHTML = arr.map((m, i) => `
      <div class="rank-row ${m.id === currentUser.id ? "me" : ""}">
        <span class="rank-no">${i + 1}</span>
        <span class="rank-name">${esc(m.name)}${m.id === currentUser.id ? "（我）" : ""}</span>
        <span class="rank-pts">${m.points} 分</span>
      </div>`).join("");
  }

  function renderMembers(num, g) {
    const box = $("#member-list");
    const isLeader = g.isLeader;
    box.innerHTML = g.members.map((m) => {
      const mine = m.id === currentUser.id;
      let actions = `<button class="btn btn-sm" data-view-member="${esc(m.id)}">查看错题</button>`;
      if (isLeader && !mine) {
        actions += `<button class="btn btn-sm btn-ghost" data-remove="${esc(m.id)}">移除</button>`;
        actions += `<button class="btn btn-sm btn-ghost" data-transfer="${esc(m.id)}">转让组长</button>`;
      }
      return `<div class="member-row"><span class="member-name">${esc(m.name)}${mine ? "（我）" : ""}</span><span class="member-actions">${actions}</span></div>`;
    }).join("");
    $$('#member-list [data-view-member]').forEach((b) => b.addEventListener("click", () => viewMember(b.dataset.viewMember)));
    if (isLeader) {
      $$('#member-list [data-remove]').forEach((b) => b.addEventListener("click", () => removeMember(num, b.dataset.remove)));
      $$('#member-list [data-transfer]').forEach((b) => b.addEventListener("click", () => transferLeader(num, b.dataset.transfer)));
    }
  }

  async function renderPending(num, g) {
    const box = $("#pending-list");
    box.innerHTML = g.pending.map((m) => `
      <div class="pending-row">
        <span class="member-name">${esc(m.name)}</span>
        <span class="member-actions">
          <button class="btn btn-sm btn-primary" data-approve="${esc(m.id)}">通过</button>
          <button class="btn btn-sm btn-ghost" data-reject="${esc(m.id)}">拒绝</button>
        </span>
      </div>`).join("");
    $$('#pending-list [data-approve]').forEach((b) => b.addEventListener("click", () => approveMember(num, b.dataset.approve)));
    $$('#pending-list [data-reject]').forEach((b) => b.addEventListener("click", () => rejectMember(num, b.dataset.reject)));
  }

  async function approveMember(num, userId) { const r = await api.approve(num, userId); if (r.ok) { toast("已通过该成员"); openGroup(num); } else toast("操作失败"); }
  async function rejectMember(num, userId) { const r = await api.reject(num, userId); if (r.ok) { toast("已拒绝"); openGroup(num); } else toast("操作失败"); }
  async function removeMember(num, userId) { if (!confirm("确定移除该成员？")) return; const r = await api.removeMember(num, userId); if (r.ok) { toast("已移除"); openGroup(num); } else toast("操作失败"); }
  async function transferLeader(num, userId) { if (!confirm("确定将组长转让给该成员？转让后你将变为普通成员。")) return; const r = await api.transfer(num, userId); if (r.ok) { toast("已转让组长"); openGroup(num); } else toast("操作失败"); }
  async function deleteGroup(num) { if (!confirm("确定删除该小组？此操作不可恢复，所有成员将被移出。")) return; const r = await api.deleteGroup(num); if (r.ok) { toast("小组已删除"); $("#group-detail").innerHTML = ""; loadMyGroups(); } else toast("操作失败"); }

  async function viewMember(userId) {
    const r = await api.getProfile(userId);
    const modal = $("#member-modal");
    const body = $("#member-modal-body");
    if (!r.ok || !r.data) { body.innerHTML = '<p class="hint">加载失败</p>'; modal.classList.remove("hidden"); return; }
    const p = r.data;
    const s = p.stats || { byMastery: { red: 0, yellow: 0, green: 0 }, total: 0, bySubject: {} };
    let qhtml;
    if (p.public && p.questions && p.questions.length) {
      qhtml = '<div class="mm-questions">' + p.questions.map((q) => `
        <div class="mm-q">
          <div class="mm-q-top"><span class="mm-sub">${esc(q.subject || "")}</span><span class="mm-mastery m${q.mastery || 0}">${(["🔴", "🟡", "🟢"])[q.mastery || 0]}</span></div>
          <div class="mm-q-kp">📌 ${esc(q.kp || q.type || "")}</div>
        </div>`).join("") + '</div>';
    } else qhtml = '<p class="hint">该成员未公开错题集（仅显示统计概览）。</p>';
    const subj = Object.entries(s.bySubject || {}).map(([k, v]) => `<span class="tag">${esc(k)} ${v}</span>`).join("");
    body.innerHTML = `
      <h3>${esc(p.name)} 的错题集</h3>
      <div class="mm-stats">
        <div class="mm-stat"><b>${p.points}</b><span>积分</span></div>
        <div class="mm-stat"><b>${s.total}</b><span>错题</span></div>
        <div class="mm-stat red"><b>${s.byMastery.red}</b><span>未掌握</span></div>
        <div class="mm-stat yellow"><b>${s.byMastery.yellow}</b><span>复习中</span></div>
        <div class="mm-stat green"><b>${s.byMastery.green}</b><span>已掌握</span></div>
      </div>
      <div class="mm-subjects">${subj || '<span class="hint">暂无科目分布</span>'}</div>
      ${qhtml}`;
    modal.classList.remove("hidden");
  }

  /* ---------------- 初始化 ---------------- */
  async function init() {
    bindGlobal();
    const wl = $("#btn-wechat-login");
    if (wl) wl.addEventListener("click", () => { window.location.href = "/api/auth/wechat/start"; });
    $("#btn-dev-login").addEventListener("click", doDevLogin);
    $("#login-name").addEventListener("keydown", (e) => { if (e.key === "Enter") doDevLogin(); });
    try {
      const me = await api.me();
      if (me && me.user) { currentUser = me.user; startApp(); return; }
    } catch (e) { console.warn("auth check failed", e); }
    showLogin();
  }

  function startApp() {
    load();
    applyTheme(state.settings.theme || "light");
    if (currentUser && currentUser.name) state.settings.name = currentUser.name;
    initAddForm();
    initSettings();
    initGradeModal(); // 首次进入弹年级选择并推送易错题
    initGroups();
    checkMedals(true); // 静默补发历史应得勋章
    showView("dashboard");
    renderAll();
    syncProfile();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
