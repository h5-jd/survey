/**
 * AI智能渗漏检测模块 v1.0
 * 交互流程：大类 → 小类 → 拍全景 → 拍近景/特写 → AI综合判断
 * 
 * 设计原则：
 * 1. 大类→小类，先定位方向再精确定位
 * 2. 先全景后近景——每一步都是先拍整体环境再拍细节
 * 3. 不限制照片数量，拍得越多AI越准
 * 4. 图片说明支持语音+文字双输入
 * 5. 不反复追问业主——一次引导到位，两步收齐所有信息
 * 6. AI判断基于完整图片集——多图交叉验证
 * 7. 按钮大而清晰，方便各年龄段客户操作
 */

// ========== 渗漏大类定义 ==========
const LEAK_CATEGORIES = [
  {
    id: 'bathroom',
    name: '卫生间',
    icon: '🚿',
    desc: '墙面渗水、门口渗漏、楼下漏水等',
    color: '#4fc3f7',
    subcategories: [
      { id: 'bathroom_door', name: '门口周边墙面渗漏' },
      { id: 'bathroom_shower_wall', name: '淋浴间隔壁墙面渗漏' },
      { id: 'bathroom_downstairs', name: '楼下漏水' },
      { id: 'bathroom_floor', name: '卫生间地面渗水' },
      { id: 'bathroom_pipe', name: '管道周边渗漏' }
    ]
  },
  {
    id: 'exterior_wall',
    name: '外墙',
    icon: '🏠',
    desc: '外墙渗水、窗台渗水、外墙开裂等',
    color: '#66bb6a',
    subcategories: [
      { id: 'wall_large_area', name: '外墙大面积渗水' },
      { id: 'wall_window_area', name: '窗台周边渗水' },
      { id: 'wall_crack', name: '外墙裂缝渗水' },
      { id: 'wall_ac_hole', name: '空调孔渗水' },
      { id: 'wall_surface_damage', name: '外墙瓷砖/涂料脱落' }
    ]
  },
  {
    id: 'roof',
    name: '屋面/顶楼',
    icon: '🔝',
    desc: '顶楼渗漏、天面漏水等',
    color: '#ff7043',
    subcategories: [
      { id: 'roof_ceiling', name: '顶楼天花板渗漏' },
      { id: 'roof_waterproof_aging', name: '屋面防水层老化' },
      { id: 'roof_pipe_penetration', name: '管道穿楼板处渗漏' },
      { id: 'roof_gutter', name: '天沟/落水管排水不畅' }
    ]
  },
  {
    id: 'window',
    name: '窗户',
    icon: '🪟',
    desc: '窗框渗水、窗台渗水等',
    color: '#ab47bc',
    subcategories: [
      { id: 'window_sealant', name: '窗框密封胶老化' },
      { id: 'window_sill', name: '窗台渗水' },
      { id: 'window_gap', name: '窗框与墙体缝隙' }
    ]
  },
  {
    id: 'kitchen_balcony',
    name: '厨房/阳台',
    icon: '🍳',
    desc: '厨房墙面渗水、阳台漏水等',
    color: '#ffa726',
    subcategories: [
      { id: 'kitchen_sink_pipe', name: '水槽下方管道渗水' },
      { id: 'kitchen_wall', name: '厨房墙面渗水' },
      { id: 'balcony_sliding_door', name: '阳台推拉门渗水' },
      { id: 'balcony_floor', name: '阳台地面渗水' }
    ]
  },
  {
    id: 'basement',
    name: '地下室',
    icon: '🏗️',
    desc: '地下室渗水、返潮等',
    color: '#78909c',
    subcategories: [
      { id: 'basement_wall', name: '地下室墙面渗水' },
      { id: 'basement_crack', name: '墙面裂缝渗水' },
      { id: 'basement_pipe', name: '管道穿墙处渗水' },
      { id: 'basement_joint', name: '施工缝/伸缩缝渗水' }
    ]
  }
];

// ========== Phase 2 拍照引导清单 ==========
const PHOTO_GUIDES = {
  bathroom: [
    { id: 'bathroom_door_panorama', name: '卫生间门口全景', icon: '🚪', required: true },
    { id: 'bathroom_shower_panorama', name: '淋浴区全景', icon: '🚿', required: false },
    { id: 'bathroom_sink_panorama', name: '洗手盆区域全景', icon: '🪣', required: false },
    { id: 'bathroom_toilet_panorama', name: '马桶区域全景', icon: '🚽', required: false },
    { id: 'bathroom_drain_closeup', name: '地漏口特写（看断层）', icon: '🕳️', required: true },
    { id: 'bathroom_tile_joint', name: '瓷砖美缝特写', icon: '🧱', required: false },
    { id: 'bathroom_pipe_valve', name: '给排水管/角阀/龙头', icon: '🔧', required: false },
    { id: 'bathroom_threshold', name: '过门石特写', icon: '📐', required: true },
    { id: 'bathroom_water_bar', name: '挡水坎特写', icon: '🚧', required: false }
  ],
  exterior_wall: [
    { id: 'exterior_leak_panorama', name: '渗漏对应的外墙全景', icon: '🏢', required: true },
    { id: 'exterior_indoor_panorama', name: '室内渗漏面全景', icon: '🏠', required: true },
    { id: 'exterior_crack_closeup', name: '外墙裂缝', icon: '📐', required: false },
    { id: 'exterior_sealant', name: '窗框密封胶', icon: '🪟', required: false },
    { id: 'exterior_ac_hole', name: '空调孔', icon: '⚪', required: false },
    { id: 'exterior_surface', name: '外墙饰面层', icon: '🧱', required: false }
  ],
  roof: [
    { id: 'roof_panorama', name: '屋面全景', icon: '🏢', required: true },
    { id: 'roof_ceiling_panorama', name: '渗漏对应天花板全景', icon: '🔝', required: true },
    { id: 'roof_waterproof', name: '防水层状况', icon: '🛡️', required: true },
    { id: 'roof_pipe_penetration', name: '管道穿楼板处', icon: '🔧', required: false },
    { id: 'roof_gutter', name: '天沟/落水管口', icon: '🌊', required: false },
    { id: 'roof_parapet', name: '女儿墙根部', icon: '🧱', required: false }
  ],
  window: [
    { id: 'window_panorama', name: '窗户整体', icon: '🪟', required: true },
    { id: 'window_sealant_closeup', name: '窗框密封胶', icon: '🔗', required: true },
    { id: 'window_drain_hole', name: '窗台排水孔', icon: '🕳️', required: false },
    { id: 'window_gap_closeup', name: '窗框与墙体缝隙', icon: '📐', required: true }
  ],
  kitchen_balcony: [
    { id: 'kb_panorama', name: '厨房/阳台全景', icon: '🍳', required: true },
    { id: 'kb_sink_pipe', name: '水槽下方管道', icon: '🔧', required: false },
    { id: 'kb_drain', name: '地漏口', icon: '🕳️', required: false },
    { id: 'kb_sliding_door', name: '阳台推拉门框', icon: '🚪', required: false },
    { id: 'kb_floor_drain', name: '阳台排水口', icon: '🌊', required: false }
  ],
  basement: [
    { id: 'basement_leak_panorama', name: '地下室渗漏面全景', icon: '🏗️', required: true },
    { id: 'basement_crack_closeup', name: '墙面裂缝', icon: '📐', required: false },
    { id: 'basement_pipe_closeup', name: '穿墙管道', icon: '🔧', required: false },
    { id: 'basement_joint_closeup', name: '施工缝/伸缩缝', icon: '➖', required: false }
  ]
};

// ========== AI综合分析提示词 ==========
const AI_ANALYSIS_PROMPT = `你是拥有16年建筑渗漏维修经验的资深专家。请根据客户提供的多张照片和现场信息，进行综合交叉验证分析。

## 现场信息
- 渗漏大类：{category}
- 渗漏小类：{subcategory}
- 照片数量：{photoCount}张

## 照片说明
{photoDescriptions}

## 分析要求（基于全部图片交叉验证，不是单张猜测）

1. **渗漏类型与等级**：
   - A级-紧急：Active漏水，需立即处理
   - B级-一般：有明显渗漏迹象，短期处理
   - C级-轻微：轻微返潮或隐患，可择期处理

2. **渗漏位置**：明确标注渗漏位置，不能留空

3. **原因判断**（多图交叉验证）：
   - 列出所有可能原因，按可能性从高到低排序
   - 每个原因需说明依据（引用具体照片特征）
   - 注意：进水点≠出水点，水可能沿结构层从远处破损点渗入

4. **修复方向建议**：具体到工法
   - 如"过门石底部注浆封堵"
   - 如"外墙裂缝V型开槽+密封胶嵌填"
   - 如"窗框周边重新打胶密封"

5. **是否需要上门检测**：
   - 如果照片信息不足以确诊，建议上门
   - 如果可以确诊，给出修复预估范围

## 输出格式（严格按此格式，不要添加其他内容）
【{level}级-{levelDesc}】

📍 渗漏位置：{具体位置}

🔍 多图观察：
{逐一描述每张照片中可见的渗漏特征}

🧠 交叉验证推理：
{基于多张照片的对比和交叉验证，推导渗漏路径和成因}

📋 诊断结论：
  渗漏类型：{类型}
  可能原因（按可能性排序）：
  1. {原因1}（依据：{具体照片特征}）
  2. {原因2}（依据：{具体照片特征}）
  3. {原因3}（依据：{具体照片特征}）

🔧 修复方向：
  - {具体工法建议1}
  - {具体工法建议2}

🏠 上门建议：{需要上门检测/可远程指导修复}
💰 修复预估：{费用范围或"需上门后报价"}`;

/**
 * AI智能渗漏检测管理器
 */
const AILeakDetect = {
  /**
   * 获取大类列表
   */
  getCategories() {
    return LEAK_CATEGORIES;
  },

  /**
   * 根据大类ID获取大类信息
   */
  getCategory(categoryId) {
    return LEAK_CATEGORIES.find(c => c.id === categoryId);
  },

  /**
   * 根据大类ID获取小类列表
   */
  getSubcategories(categoryId) {
    const cat = this.getCategory(categoryId);
    return cat ? cat.subcategories : [];
  },

  /**
   * 根据大类ID获取小类信息
   */
  getSubcategory(categoryId, subcategoryId) {
    const subs = this.getSubcategories(categoryId);
    return subs.find(s => s.id === subcategoryId);
  },

  /**
   * 根据大类ID获取拍照引导清单
   */
  getPhotoGuide(categoryId) {
    return PHOTO_GUIDES[categoryId] || [];
  },

  /**
   * 获取必拍项
   */
  getRequiredPhotoGuides(categoryId) {
    return this.getPhotoGuide(categoryId).filter(g => g.required);
  },

  /**
   * 检查必拍项是否已完成
   */
  checkRequiredPhotos(categoryId, phase2Photos) {
    const required = this.getRequiredPhotoGuides(categoryId);
    const completed = phase2Photos.filter(p => p.guideId && required.some(r => r.id === p.guideId));
    return {
      total: required.length,
      completed: completed.length,
      missing: required.filter(r => !phase2Photos.some(p => p.guideId === r.id))
    };
  },

  /**
   * 构建AI分析提示词
   */
  buildAnalysisPrompt(categoryName, subcategoryName, photos) {
    const phase1Photos = photos.filter(p => p.phase === 1);
    const phase2Photos = photos.filter(p => p.phase === 2);

    let photoDescriptions = '';
    let idx = 1;

    // Phase 1 照片
    if (phase1Photos.length > 0) {
      photoDescriptions += '【渗漏表现照片】\n';
      phase1Photos.forEach(p => {
        const type = p.photoType === 'panorama' ? '全景' : '近景/特写';
        const desc = p.description || '（无说明）';
        photoDescriptions += `  ${idx}. [${type}] ${desc}\n`;
        idx++;
      });
    }

    // Phase 2 照片
    if (phase2Photos.length > 0) {
      photoDescriptions += '【源头部位照片】\n';
      phase2Photos.forEach(p => {
        const guideName = p.guideName || '未分类';
        const desc = p.description || '（无说明）';
        photoDescriptions += `  ${idx}. [${guideName}] ${desc}\n`;
        idx++;
      });
    }

    return AI_ANALYSIS_PROMPT
      .replace('{category}', categoryName)
      .replace('{subcategory}', subcategoryName)
      .replace('{photoCount}', photos.length)
      .replace('{photoDescriptions}', photoDescriptions);
  },

  /**
   * 多图AI综合分析
   * @param {Array} photos - 所有照片（含base64和说明）
   * @param {string} categoryName - 大类名称
   * @param {string} subcategoryName - 小类名称
   * @returns {Promise<object>} - 分析结果
   */
  async comprehensiveAnalysis(photos, categoryName, subcategoryName) {
    if (!window.CozeAPI || !CozeAPI.isConfigured()) {
      throw new Error('AI未配置，请在设置中配置Bot ID和Access Token');
    }

    if (!photos || photos.length === 0) {
      throw new Error('请先拍摄照片');
    }

    // 构建提示词
    const prompt = this.buildAnalysisPrompt(categoryName, subcategoryName, photos);

    // 上传所有照片
    const fileTokens = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (photo.base64 || photo.url) {
        try {
          const imgData = photo.base64 || photo.url;
          const token = await CozeAPI.uploadImage(imgData);
          fileTokens.push({
            token,
            description: photo.description || '',
            type: photo.photoType || photo.guideName || ''
          });
        } catch (e) {
          console.error(`上传第${i + 1}张照片失败:`, e);
        }
      }
    }

    if (fileTokens.length === 0) {
      throw new Error('照片上传失败，请重试');
    }

    // 创建对话（带多张图片附件）
    const attachments = fileTokens.map(ft => ({
      type: 'image',
      file_token: ft.token,
      extension_params: {}
    }));

    const response = await fetch(`${CozeAPI.baseUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CozeAPI.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: CozeAPI.botId,
        user_id: 'juda_leak_detect',
        stream: false,
        auto_save_history: true,
        additional_messages: [
          {
            role: 'user',
            content: prompt,
            content_type: 'text',
            attachments: attachments
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI分析请求失败: ${error}`);
    }

    const chat = await response.json();

    // 轮询等待完成
    await CozeAPI.pollChatStatus(chat.data.id);

    // 获取消息
    const messages = await CozeAPI.getChatMessages(chat.data.id);

    // 解析结果
    return this.parseAnalysisResult(messages);
  },

  /**
   * 解析AI综合分析结果
   */
  parseAnalysisResult(messages) {
    const assistantMessage = messages.find(m => m.role === 'assistant' && m.type === 'answer');

    if (!assistantMessage) {
      throw new Error('未获取到AI分析结果');
    }

    const content = assistantMessage.content;

    // 解析等级
    const levelMatch = content.match(/【([A-C])级-([^\]]+)】/);
    const level = levelMatch ? levelMatch[1] : 'B';
    const levelDesc = levelMatch ? levelMatch[2] : '一般';

    // 解析渗漏位置
    const locationMatch = content.match(/📍\s*渗漏位置[：:]\s*(.+)/);
    const location = locationMatch ? locationMatch[1].trim() : '';

    // 解析观察
    const observationMatch = content.match(/🔍\s*多图观察[：:]([\s\S]*?)(?=🧠|$)/);
    const observation = observationMatch ? observationMatch[1].trim() : '';

    // 解析推理
    const reasoningMatch = content.match(/🧠\s*交叉验证推理[：:]([\s\S]*?)(?=📋|$)/);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() : '';

    // 解析结论
    const conclusionMatch = content.match(/📋\s*诊断结论[：:]([\s\S]*?)(?=🔧|$)/);
    const conclusion = conclusionMatch ? conclusionMatch[1].trim() : '';

    // 解析修复方向
    const suggestionMatch = content.match(/🔧\s*修复方向[：:]([\s\S]*?)(?=🏠|$)/);
    const suggestion = suggestionMatch ? suggestionMatch[1].trim() : '';

    // 解析上门建议
    const homeVisitMatch = content.match(/🏠\s*上门建议[：:]\s*(.+)/);
    const homeVisit = homeVisitMatch ? homeVisitMatch[1].trim() : '';

    // 解析费用预估
    const costMatch = content.match(/💰\s*修复预估[：:]\s*(.+)/);
    const costEstimate = costMatch ? costMatch[1].trim() : '';

    return {
      level,
      levelDesc,
      location,
      observation,
      reasoning,
      conclusion,
      suggestion,
      homeVisit,
      costEstimate,
      rawContent: content,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 生成报告数据结构
   */
  generateReport(categoryName, subcategoryName, photos, analysisResult) {
    return {
      reportId: 'RPT_' + Date.now(),
      generatedAt: new Date().toISOString(),
      category: categoryName,
      subcategory: subcategoryName,
      photoCount: photos.length,
      photos: photos.map(p => ({
        phase: p.phase,
        photoType: p.photoType,
        guideName: p.guideName,
        description: p.description,
        thumbnail: p.thumbnail || p.url
      })),
      analysis: analysisResult,
      summary: `经AI综合分析${photos.length}张照片，渗漏类型为${analysisResult.level}级-${analysisResult.levelDesc}，位置：${analysisResult.location || subcategoryName}。`
    };
  }
};

// 导出
window.AILeakDetect = AILeakDetect;
