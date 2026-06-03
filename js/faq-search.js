/**
 * 常见问题速查模块 - v4.0
 * 现场遇到意外3秒搜到解决方案
 */
const FAQSearch = {
  // 问题数据库
  FAQs: [
    // ========== 渗漏类 ==========
    {
      id: 'leak_001',
      category: '渗漏',
      title: '注浆时浆液从其他部位跑出怎么办？',
      answer: '这是典型的窜浆现象。处理方法：1）立即停止注浆；2）用堵漏王封堵跑浆点；3）待封堵处固化后再继续注浆；4）如果窜浆严重，考虑改变注浆位置或采用化学注浆替代。',
      tags: ['注浆', '跑浆', '窜浆'],
      relatedCrafts: ['微创注浆', '裂缝修补']
    },
    {
      id: 'leak_002',
      category: '渗漏',
      title: '地漏断层怎么处理？',
      answer: '地漏断层是常见渗漏原因。处理方案：1）清理地漏周边杂物；2）使用堵漏王或聚合物砂浆填充断层；3）做加强防水层；4）安装地漏密封圈；5）闭水试验验证。',
      tags: ['地漏', '断层', '卫生间'],
      relatedCrafts: ['卫生间免砸砖']
    },
    {
      id: 'leak_003',
      category: '渗漏',
      title: '窗框渗水怎么排查？',
      answer: '窗框渗水排查步骤：1）观察雨天渗水情况；2）检查窗框与墙体密封胶是否老化开裂；3）检查窗框本身是否有裂纹；4）检查窗台坡度是否朝外；5）检查窗户是否变形导致密封不严。',
      tags: ['窗框', '渗水', '排查'],
      relatedCrafts: ['窗框密封']
    },
    {
      id: 'leak_004',
      category: '渗漏',
      title: '外墙渗水找不到进水点怎么办？',
      answer: '外墙渗漏定位方法：1）雨天观察，记录渗水时间与雨量关系；2）从室内渗水点向上追溯；3）使用红外热像仪检测；4）浇水试验法（从可疑部位浇水观察）；5）检查女儿墙、檐沟等节点部位。',
      tags: ['外墙', '渗水', '定位'],
      relatedCrafts: ['外墙防水']
    },
    {
      id: 'leak_005',
      category: '渗漏',
      title: '卫生间门槛石渗水到客厅怎么处理？',
      answer: '门槛石渗水处理：1）拆除门槛石周边瓷砖；2）清理基层，凿至结构层；3）用堵漏王做R角防水；4）门槛石下设置止水带；5）恢复瓷砖，确保门槛石两侧都做防水；6）门槛石外侧打耐候密封胶。',
      tags: ['门槛石', '卫生间', '渗水'],
      relatedCrafts: ['卫生间免砸砖']
    },
    {
      id: 'leak_006',
      category: '渗漏',
      title: '屋面防水层老化如何处理？',
      answer: '屋面防水层老化处理方案：1）小面积老化：清理后重新做防水；2）大面积老化：整体翻新；3）先做局部点补，观察效果；4）老化严重需全部铲除重做；5）注意保护层的处理。',
      tags: ['屋面', '老化', '防水层'],
      relatedCrafts: ['屋面防水']
    },
    {
      id: 'leak_007',
      category: '渗漏',
      title: '管道根部渗水怎么处理？',
      answer: '管道根部渗水处理：1）清理管道周边基层；2）凿出V型槽；3）用堵漏王封堵；4）做加强防水层，粘贴聚酯布；5）恢复保护层；6）管道周边打密封胶。',
      tags: ['管道', '根部', '渗水'],
      relatedCrafts: ['节点加强']
    },
    {
      id: 'leak_008',
      category: '渗漏',
      title: '地下室后浇带渗水怎么处理？',
      answer: '地下室后浇带渗水属于结构问题，处理方法：1）先注浆封堵；2）后浇带两侧做加强防水；3）如果渗水严重，需要结构加固处理；4）建议使用遇水膨胀止水条或聚氨酯注浆液。',
      tags: ['地下室', '后浇带', '结构'],
      relatedCrafts: ['微创注浆']
    },
    
    // ========== 工艺类 ==========
    {
      id: 'craft_001',
      category: '工艺',
      title: '防水涂层起泡是什么原因？',
      answer: '涂层起泡原因：1）基层潮湿未干透；2）涂料施工太厚；3）高温天气施工溶剂挥发；4）基层有油污或松动。处理：等气泡破裂后，清理干净重新补涂。预防：确保基层干燥、薄涂多遍、高温避开施工。',
      tags: ['起泡', '涂层', '原因'],
      relatedCrafts: ['大面涂刷']
    },
    {
      id: 'craft_002',
      category: '工艺',
      title: '防水层开裂怎么办？',
      answer: '防水层开裂处理：1）细小裂纹：清理后补涂涂料；2）结构性裂纹：需先处理基层裂缝；3）大面积开裂：铲除重做。预防措施：注意基层处理、施工温度适宜、涂料调配正确、避免一次涂刷过厚。',
      tags: ['开裂', '防水层', '处理'],
      relatedCrafts: ['大面涂刷']
    },
    {
      id: 'craft_003',
      category: '工艺',
      title: '闭水试验水位下降多少算正常？',
      answer: '闭水试验水位变化判断：1）水位下降＜5mm：正常蒸发，可忽略；2）水位下降5-10mm：需观察楼下是否有渗漏；3）水位下降＞10mm：很可能存在渗漏点，需排查。测量时注意记录初始水位和测量时间。',
      tags: ['闭水试验', '水位', '判断'],
      relatedCrafts: ['闭水验收']
    },
    {
      id: 'craft_004',
      category: '工艺',
      title: '阴角为什么要做圆弧处理？',
      answer: '阴角圆弧处理的原因：1）阴角是应力集中点，易开裂；2）直角处涂料难以均匀覆盖；3）圆弧处理使涂料自然过渡。做法：用聚合物砂浆或堵漏王抹成R角（半径10-20mm），干后再做防水。',
      tags: ['阴角', '圆弧', '加强'],
      relatedCrafts: ['节点加强']
    },
    {
      id: 'craft_005',
      category: '工艺',
      title: '聚酯布搭接宽度不够怎么办？',
      answer: '聚酯布搭接要求：宽度≥50mm。先检查：1）已施工部分是否合格；2）计算需要补搭接的面积。处理：1）合格部位保持；2）不合格部位铲除重做；3）重新施工时确保搭接宽度。',
      tags: ['聚酯布', '搭接', '规范'],
      relatedCrafts: ['节点加强', '大面涂刷']
    },
    {
      id: 'craft_006',
      category: '工艺',
      title: '涂料涂刷后多久可以闭水？',
      answer: '不同涂料闭水时间：1）JS涂料：一般48小时以上；2）聚氨酯涂料：48-72小时；3）丙烯酸涂料：24-48小时；4）水泥基涂料：24小时。具体时间请参考材料说明书，关键是等涂料完全固化。',
      tags: ['闭水', '时间', '养护'],
      relatedCrafts: ['大面涂刷', '闭水验收']
    },
    {
      id: 'craft_007',
      category: '工艺',
      title: '注浆压力多少合适？',
      answer: '注浆压力参考值：1）聚氨酯注浆：0.2-0.4MPa；2）丙烯酸盐注浆：0.3-0.5MPa；3）环氧树脂注浆：0.5-1.0MPa。压力过大可能导致结构损伤，压力过小则注浆不饱满。开始时用低压，观察进浆情况调整。',
      tags: ['注浆', '压力', '参数'],
      relatedCrafts: ['微创注浆']
    },
    {
      id: 'craft_008',
      category: '工艺',
      title: '旧防水层要不要全部铲除？',
      answer: '旧防水层处理原则：1）如果旧防水层与基层粘结牢固、不空鼓，可以保留；2）如果空鼓、脱落、严重老化，必须铲除；3）沥青油膏类防水建议铲除；4）保留旧防水时需做界面处理增强粘结。',
      tags: ['旧防水', '铲除', '处理'],
      relatedCrafts: ['基层清理']
    },
    
    // ========== 材料类 ==========
    {
      id: 'mat_001',
      category: '材料',
      title: 'JS涂料配比不对会怎样？',
      answer: 'JS涂料（聚合物水泥防水涂料）配比错误影响：1）粉料太多：涂层硬脆，易开裂；2）液料太多：涂层软粘，强度低，耐水性差。正确配比：按厂家说明，一般液料:粉料=1:1至1:1.5。调配时先加液料后加粉料，搅拌均匀。',
      tags: ['JS涂料', '配比', '调配'],
      relatedCrafts: ['大面涂刷']
    },
    {
      id: 'mat_002',
      category: '材料',
      title: '聚氨酯注浆液和丙烯酸盐注浆液有什么区别？',
      answer: '两者区别：1）聚氨酯：遇水膨胀发泡，弹性好，适合带水施工，止水快；2）丙烯酸盐：流动性好，渗透性强，适合细微裂缝，凝固后成凝胶状。选择依据：渗漏水量大用聚氨酯，细微裂缝用丙烯酸盐。',
      tags: ['注浆液', '聚氨酯', '丙烯酸盐'],
      relatedCrafts: ['微创注浆']
    },
    {
      id: 'mat_003',
      category: '材料',
      title: '耐候密封胶和普通玻璃胶有什么区别？',
      answer: '耐候密封胶 vs 普通玻璃胶：1）耐候性：耐候胶抗紫外线、耐高低温，普通胶易老化；2）粘结性：耐候胶对多种基材粘结更好；3）弹性：耐候胶弹性保持时间长；4）价格：耐候胶更贵。窗框密封必须用耐候硅酮胶。',
      tags: ['密封胶', '耐候', '窗框'],
      relatedCrafts: ['窗框密封']
    },
    {
      id: 'mat_004',
      category: '材料',
      title: '堵漏王和防水涂料先用哪个？',
      answer: '使用顺序：1）先堵漏王：用于快速封堵裂缝、孔洞；2）后防水涂料：形成整体防水层。堵漏王是快凝水泥，固化快、强度高，用于止水；防水涂料是柔性防水层，用于长期防水。两者配合使用效果最佳。',
      tags: ['堵漏王', '顺序', '配合'],
      relatedCrafts: ['裂缝修补', '节点加强']
    },
    {
      id: 'mat_005',
      category: '材料',
      title: '聚合物砂浆和普通砂浆有什么区别？',
      answer: '聚合物砂浆特点：1）加入了聚合物乳液，粘结力强；2）柔韧性比普通砂浆好；3）抗渗性能更好；4）与基面粘结牢固，不易空鼓。适用于防水加强层、裂缝修补、节点处理。普通砂浆主要用于结构找平。',
      tags: ['聚合物砂浆', '材料', '用途'],
      relatedCrafts: ['基层清理', '裂缝修补']
    },
    {
      id: 'mat_006',
      category: '材料',
      title: '防水卷材和防水涂料哪个好？',
      answer: '两者各有优劣：防水卷材：1）厚度均匀；2）抗穿刺性好；3）施工需热熔，对工人技能要求高；4）适用于大面积平面。防水涂料：1）无缝整体；2）适合复杂节点；3）施工方便；4）需多遍涂刷。实际常配合使用，节点用涂料、大面用卷材。',
      tags: ['卷材', '涂料', '对比'],
      relatedCrafts: ['大面涂刷']
    },
    
    // ========== 判断类 ==========
    {
      id: 'judge_001',
      category: '判断',
      title: '如何判断渗漏是从哪里来的？',
      answer: '渗漏来源判断方法：1）观察法：渗水痕迹向上追溯，找最高水渍；2）时间法：雨后多久渗水-直接关系，滞后渗漏可能非外墙；3）排除法：关闭水源测试是否为管道漏水；4）仪器法：红外热像仪、湿度检测仪；5）经验法：常见渗漏点优先排查。',
      tags: ['判断', '来源', '排查'],
      relatedCrafts: ['渗漏排查']
    },
    {
      id: 'judge_002',
      category: '判断',
      title: '空鼓和渗漏有什么关系？',
      answer: '空鼓与渗漏关系：1）空鼓处防水层与基层分离，受力易开裂；2）水渗入空鼓层会窝水，加速渗漏；3）空鼓本身不一定渗漏，但会增加渗漏风险。处理：有渗漏风险的空鼓必须铲除重做；无渗漏风险的空鼓可注浆填充处理。',
      tags: ['空鼓', '判断', '关系'],
      relatedCrafts: ['基层清理']
    },
    {
      id: 'judge_003',
      category: '判断',
      title: '潮湿天气能做防水吗？',
      answer: '潮湿天气施工判断：1）基层含水率应＜10%方可施工防水涂料；2）可用塑料薄膜法测试：铺薄膜4小时，基层无水珠即可；3）潮湿天气可先做堵漏、裂缝处理；4）晴天后立即做防水层；5）禁止在雨天做防水。',
      tags: ['潮湿', '天气', '判断'],
      relatedCrafts: ['基层清理']
    },
    {
      id: 'judge_004',
      category: '判断',
      title: '怎么判断注浆是否饱和？',
      answer: '注浆饱和判断标准：1）压力法：压力持续上升不再下降；2）观察法：相邻注浆孔出浆；3）记录法：记录每孔注浆量，与估算量对比；4）敲击法：注浆饱满处敲击声沉闷；5）经验法：一般每个孔注浆量达到预估量即可。',
      tags: ['注浆', '饱和', '判断'],
      relatedCrafts: ['微创注浆']
    },
    {
      id: 'judge_005',
      category: '判断',
      title: '闭水试验楼下没渗漏，是不是就没问题了？',
      answer: '闭水试验局限性：1）闭水时间短（24-48小时）可能发现不了慢渗；2）水压与实际雨水压力不同；3）温差、振动等动态因素无法模拟。建议：1）延长闭水时间；2）多次闭水试验；3）结合雨后观察；4）重点节点部位重点检查。',
      tags: ['闭水', '局限', '判断'],
      relatedCrafts: ['闭水验收']
    },
    
    // ========== 更多常见问题 ==========
    {
      id: 'more_001',
      category: '渗漏',
      title: '电梯井渗水怎么处理？',
      answer: '电梯井渗水处理：1）排查渗漏点，是否从底板、侧墙或集水井渗入；2）底板渗漏：注浆封堵+背水面防水；3）侧墙渗漏：注浆+迎水面防水；4）集水井渗漏：重点处理井壁与底板接缝；5）注意电梯设备保护，切断电源后施工。',
      tags: ['电梯井', '渗水', '处理'],
      relatedCrafts: ['微创注浆']
    },
    {
      id: 'more_002',
      category: '渗漏',
      title: '女儿墙根部渗水怎么处理？',
      answer: '女儿墙根部渗水：1）检查防水层是否收口到女儿墙上；2）清理根部旧防水层和杂物；3）用堵漏王抹R角；4）做防水加强层，上翻女儿墙≥250mm；5）安装压顶或金属盖板；6）做好密封。',
      tags: ['女儿墙', '根部', '渗水'],
      relatedCrafts: ['节点加强', '屋面防水']
    },
    {
      id: 'more_003',
      category: '工艺',
      title: '裂缝很细，注浆注不进去怎么办？',
      answer: '细裂缝注浆方案：1）改用渗透性更好的注浆液（如丙烯酸盐）；2）先用清水冲洗裂缝；3）采用真空注浆工艺；4）裂缝太细可考虑开槽处理；5）表面开V型槽后用堵漏王封堵。',
      tags: ['细裂缝', '注浆', '处理'],
      relatedCrafts: ['裂缝修补', '微创注浆']
    },
    {
      id: 'more_004',
      category: '工艺',
      title: '施工时发现实际渗漏点与勘察报告不符怎么办？',
      answer: '处理流程：1）拍照记录实际渗漏情况；2）上报异常：使用异常上报功能；3）评估影响：判断是否需要变更方案；4）与客户沟通：说明实际情况和解决方案；5）做好记录：施工日志、照片、变更单。',
      tags: ['不符', '变更', '处理'],
      relatedCrafts: ['渗漏排查']
    },
    {
      id: 'more_005',
      category: '材料',
      title: '不同品牌的防水涂料能混用吗？',
      answer: '不建议混用原因：1）不同品牌配方不同，可能发生化学反应；2）固化时间、强度等性能不一致；3）颜色、质感差异影响外观。正确做法：1）同一工程使用同一品牌同一批次产品；2）如需更换品牌，清洗干净后再施工；3）特殊情况下可混用需做兼容性测试。',
      tags: ['混用', '品牌', '注意'],
      relatedCrafts: ['大面涂刷']
    },
    {
      id: 'more_006',
      category: '判断',
      title: '做完防水后还需要做保护层吗？',
      answer: '保护层作用：1）保护防水层不被破坏；2）防止紫外线加速老化；3）便于后续施工（贴砖等）。是否需要：1）室内潮湿区域（卫生间）：建议做水泥砂浆保护层后再贴砖；2）外露防水：必须做保护层或面层；3）地下室：视情况决定。保护层不宜过厚，影响后续粘结。',
      tags: ['保护层', '是否', '判断'],
      relatedCrafts: ['表层保护']
    }
  ],
  
  // 分类定义
  categories: [
    { id: '渗漏', name: '渗漏类', icon: '💧', color: '#1890ff', count: 0 },
    { id: '工艺', name: '工艺类', icon: '🔧', color: '#722ed1', count: 0 },
    { id: '材料', name: '材料类', icon: '🧪', color: '#fa8c16', count: 0 },
    { id: '判断', name: '判断类', icon: '🔍', color: '#eb2f96', count: 0 }
  ],
  
  // 初始化
  init() {
    // 计算各分类数量
    this.categories.forEach(cat => {
      cat.count = this.FAQs.filter(f => f.category === cat.id).length;
    });
    
    console.log('FAQSearch: 常见问题速查模块初始化完成');
    return this;
  },
  
  // 获取所有FAQ
  getAllFAQs() {
    return this.FAQs;
  },
  
  // 获取分类
  getCategories() {
    return this.categories;
  },
  
  // 按分类获取FAQ
  getFAQsByCategory(category) {
    return this.FAQs.filter(f => f.category === category);
  },
  
  // 搜索FAQ
  search(keyword) {
    if (!keyword || keyword.trim() === '') {
      return this.FAQs;
    }
    
    const kw = keyword.toLowerCase().trim();
    
    return this.FAQs.filter(faq => {
      return (
        faq.title.toLowerCase().includes(kw) ||
        faq.answer.toLowerCase().includes(kw) ||
        faq.tags.some(tag => tag.toLowerCase().includes(kw)) ||
        faq.relatedCrafts.some(craft => craft.toLowerCase().includes(kw))
      );
    });
  },
  
  // 获取热门问题
  getHotFAQs() {
    // 返回前10个最基础的问题
    return [
      '注浆时浆液从其他部位跑出怎么办？',
      'JS涂料配比不对会怎样？',
      '如何判断渗漏是从哪里来的？',
      '闭水试验水位下降多少算正常？',
      '地漏断层怎么处理？',
      '防水涂层起泡是什么原因？',
      '阴角为什么要做圆弧处理？',
      '空鼓和渗漏有什么关系？',
      '注浆压力多少合适？',
      '窗框渗水怎么排查？'
    ].map(title => this.FAQs.find(f => f.title === title)).filter(Boolean);
  },
  
  // 打开FAQ搜索UI
  openSearchUI(options = {}) {
    const {
      onSelect,
      onClose
    } = options;
    
    // 创建UI
    const container = document.createElement('div');
    container.className = 'faq-search-overlay';
    container.innerHTML = `
      <div class="faq-search-modal">
        <div class="faq-search-header">
          <span class="faq-close">×</span>
          <div class="faq-search-box">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" placeholder="搜索问题关键词...">
          </div>
        </div>
        
        <div class="faq-search-body">
          <!-- 热门问题 -->
          <div class="faq-section hot-section">
            <div class="section-title">🔥 热门问题</div>
            <div class="hot-list"></div>
          </div>
          
          <!-- 分类浏览 -->
          <div class="faq-section category-section" style="display: none;">
            <div class="section-title">📂 分类浏览</div>
            <div class="category-list"></div>
          </div>
          
          <!-- 搜索结果 -->
          <div class="faq-section result-section" style="display: none;">
            <div class="section-title search-result-title">搜索结果</div>
            <div class="result-list"></div>
          </div>
          
          <!-- FAQ详情 -->
          <div class="faq-detail" style="display: none;">
            <div class="detail-header">
              <span class="back-btn">←</span>
              <span class="detail-category"></span>
            </div>
            <div class="detail-content">
              <div class="detail-title"></div>
              <div class="detail-answer"></div>
              <div class="detail-tags"></div>
              <div class="detail-related"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // 元素引用
    const elements = {
      container,
      closeBtn: container.querySelector('.faq-close'),
      searchInput: container.querySelector('.search-input'),
      hotSection: container.querySelector('.hot-section'),
      hotList: container.querySelector('.hot-list'),
      categorySection: container.querySelector('.category-section'),
      categoryList: container.querySelector('.category-list'),
      resultSection: container.querySelector('.result-section'),
      resultTitle: container.querySelector('.search-result-title'),
      resultList: container.querySelector('.result-list'),
      detail: container.querySelector('.faq-detail'),
      detailHeader: container.querySelector('.detail-header'),
      detailCategory: container.querySelector('.detail-category'),
      detailTitle: container.querySelector('.detail-title'),
      detailAnswer: container.querySelector('.detail-answer'),
      detailTags: container.querySelector('.detail-tags'),
      detailRelated: container.querySelector('.detail-related')
    };
    
    // 当前状态
    let currentView = 'hot'; // hot | category | search | detail
    let currentFAQ = null;
    
    // 关闭弹窗
    const closeUI = () => {
      document.body.removeChild(container);
      if (onClose) onClose();
    };
    
    // 显示热门问题
    const showHotQuestions = () => {
      const hotFAQs = this.getHotFAQs();
      elements.hotList.innerHTML = hotFAQs.map(faq => `
        <div class="faq-item" data-id="${faq.id}">
          <div class="faq-item-q">${faq.title}</div>
          <div class="faq-item-a">${faq.answer.slice(0, 60)}...</div>
        </div>
      `).join('');
      
      elements.hotSection.style.display = 'block';
      elements.categorySection.style.display = 'none';
      elements.resultSection.style.display = 'none';
      elements.detail.style.display = 'none';
      currentView = 'hot';
    };
    
    // 显示分类
    const showCategories = () => {
      elements.categoryList.innerHTML = this.categories.map(cat => `
        <div class="category-item" data-category="${cat.id}">
          <span class="cat-icon" style="background: ${cat.color}20; color: ${cat.color};">${cat.icon}</span>
          <span class="cat-name">${cat.name}</span>
          <span class="cat-count">${cat.count}个</span>
          <span class="cat-arrow">›</span>
        </div>
      `).join('');
      
      elements.hotSection.style.display = 'none';
      elements.categorySection.style.display = 'block';
      elements.resultSection.style.display = 'none';
      elements.detail.style.display = 'none';
      currentView = 'category';
    };
    
    // 显示搜索结果
    const showSearchResults = (keyword) => {
      const results = this.search(keyword);
      elements.resultTitle.textContent = `搜索"${keyword}"，找到${results.length}条`;
      elements.resultList.innerHTML = results.length > 0 
        ? results.map(faq => `
            <div class="faq-item" data-id="${faq.id}">
              <div class="faq-item-header">
                <span class="faq-category-tag" style="background: ${this.categories.find(c => c.id === faq.category)?.color}20; color: ${this.categories.find(c => c.id === faq.category)?.color};">${faq.category}</span>
              </div>
              <div class="faq-item-q">${faq.title}</div>
              <div class="faq-item-a">${faq.answer.slice(0, 80)}...</div>
            </div>
          `).join('')
        : '<div class="no-result">未找到相关问题</div>';
      
      elements.hotSection.style.display = 'none';
      elements.categorySection.style.display = 'none';
      elements.resultSection.style.display = 'block';
      elements.detail.style.display = 'none';
      currentView = 'search';
    };
    
    // 显示FAQ详情
    const showFAQDetail = (faq) => {
      currentFAQ = faq;
      elements.detailCategory.textContent = faq.category;
      elements.detailTitle.textContent = faq.title;
      elements.detailAnswer.textContent = faq.answer;
      elements.detailTags.innerHTML = faq.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
      elements.detailRelated.innerHTML = faq.relatedCrafts.length > 0 
        ? `<div class="related-title">相关工艺：${faq.relatedCrafts.join('、')}</div>` 
        : '';
      
      elements.hotSection.style.display = 'none';
      elements.categorySection.style.display = 'none';
      elements.resultSection.style.display = 'none';
      elements.detail.style.display = 'block';
      currentView = 'detail';
    };
    
    // 显示分类下的FAQ列表
    const showCategoryFAQs = (categoryId) => {
      const faqs = this.getFAQsByCategory(categoryId);
      const category = this.categories.find(c => c.id === categoryId);
      elements.resultTitle.textContent = category.name;
      elements.resultList.innerHTML = faqs.map(faq => `
        <div class="faq-item" data-id="${faq.id}">
          <div class="faq-item-q">${faq.title}</div>
          <div class="faq-item-a">${faq.answer.slice(0, 80)}...</div>
        </div>
      `).join('');
      
      elements.hotSection.style.display = 'none';
      elements.categorySection.style.display = 'none';
      elements.resultSection.style.display = 'block';
      elements.detail.style.display = 'none';
      currentView = 'search';
    };
    
    // 事件绑定
    elements.closeBtn.onclick = closeUI;
    
    // 搜索输入
    let searchTimeout = null;
    elements.searchInput.oninput = (e) => {
      const keyword = e.target.value.trim();
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (keyword.length > 0) {
          showSearchResults(keyword);
        } else {
          showHotQuestions();
        }
      }, 300);
    };
    
    // 点击热门问题项
    elements.hotList.onclick = (e) => {
      const item = e.target.closest('.faq-item');
      if (item) {
        const faq = this.FAQs.find(f => f.id === item.dataset.id);
        if (faq) showFAQDetail(faq);
      }
    };
    
    // 点击分类项
    elements.categoryList.onclick = (e) => {
      const item = e.target.closest('.category-item');
      if (item) {
        showCategoryFAQs(item.dataset.category);
      }
    };
    
    // 点击搜索结果项
    elements.resultList.onclick = (e) => {
      const item = e.target.closest('.faq-item');
      if (item) {
        const faq = this.FAQs.find(f => f.id === item.dataset.id);
        if (faq) showFAQDetail(faq);
      }
    };
    
    // 返回按钮
    elements.detailHeader.querySelector('.back-btn').onclick = () => {
      if (currentView === 'detail') {
        if (elements.searchInput.value.trim()) {
          showSearchResults(elements.searchInput.value.trim());
        } else {
          showHotQuestions();
        }
      }
    };
    
    // 初始化显示
    showHotQuestions();
    
    return container;
  }
};

// 导出
window.FAQSearch = FAQSearch;
