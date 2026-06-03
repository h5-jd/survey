/**
 * SOP拍照引导逻辑
 * 标准化勘察拍照流程
 */
const SOP = {
  // 拍照阶段定义
  STAGES: {
    PANORAMA: {
      id: 'panorama',
      name: '全景图',
      description: '拍摄整体环境，定位渗漏位置',
      icon: '📐',
      guide: '拍摄包含渗漏区域的整体照片，能看到渗漏位置在空间中的相对位置',
      examples: ['墙面全景', '天花板全景', '整体环境']
    },
    CLOSEUP: {
      id: 'closeup',
      name: '近景图',
      description: '观察渗漏特征和范围',
      icon: '🔍',
      guide: '拍摄渗漏区域的中近距离照片，能清晰看到水渍、霉斑、裂缝等特征',
      examples: ['水渍近景', '发霉区域', '裂缝走向']
    },
    DETAIL: {
      id: 'detail',
      name: '特写图',
      description: '记录关键节点和细节',
      icon: '📷',
      guide: '拍摄渗漏点的特写照片，包括节点细节、裂缝宽度、材料状态等',
      examples: ['裂缝宽度特写', '节点渗水点', '材料老化细节']
    }
  },

  // 渗漏位置列表
  LEAK_LOCATIONS: [
    { id: 'wall', name: '外墙', icon: '🏠', keywords: ['外墙', '墙面', '外墙面'] },
    { id: 'roof', name: '屋面', icon: '🏗️', keywords: ['屋面', '屋顶', '天台', '楼顶'] },
    { id: 'window', name: '窗框', icon: '🪟', keywords: ['窗框', '窗户', '窗台', '窗沿'] },
    { id: 'pipe', name: '管道', icon: '🔧', keywords: ['管道', '水管', '下水管', '排污管'] },
    { id: 'toilet', name: '卫生间', icon: '🚽', keywords: ['卫生间', '厕所', '浴室', '洗手间'] },
    { id: 'basement', name: '地下室', icon: '📦', keywords: ['地下室', '地下', '车库'] },
    { id: 'balcony', name: '阳台', icon: '🌿', keywords: ['阳台', '露台'] },
    { id: 'other', name: '其他', icon: '❓', keywords: ['其他', '其他位置'] }
  ],

  // 拍摄位置类型
  POSITION_TYPES: [
    { id: 'indoor', name: '室内', icon: '🏠' },
    { id: 'outdoor', name: '室外', icon: '🌳' }
  ],

  /**
   * 获取位置对应的标签
   */
  getLocationName(locationId) {
    const location = this.LEAK_LOCATIONS.find(l => l.id === locationId);
    return location ? location.name : locationId;
  },

  /**
   * 获取SOP拍照指导
   */
  getSOPGuide() {
    return [
      {
        stage: this.STAGES.PANORAMA,
        order: 1,
        tips: [
          '确保照片包含足够的参照物，能定位渗漏位置',
          '光线充足时拍摄效果更佳',
          '全景图能帮助判断渗漏来源方向'
        ]
      },
      {
        stage: this.STAGES.CLOSEUP,
        order: 2,
        tips: [
          '尽量接近渗漏区域拍摄',
          '拍摄多个角度，包括横向和纵向',
          '注意记录水渍边界和蔓延范围'
        ]
      },
      {
        stage: this.STAGES.DETAIL,
        order: 3,
        tips: [
          '特写照片需要能看清细节纹理',
          '裂缝要能看清宽度和走向',
          '霉斑要能看清颜色和分布'
        ]
      }
    ];
  },

  /**
   * 创建拍照任务
   */
  createPhotoTask(locationId, locationName) {
    const tasks = [];
    
    // 为每个渗漏位置创建三个阶段的任务
    Object.values(this.STAGES).forEach(stage => {
      tasks.push({
        id: Store.generateId(),
        locationId,
        locationName,
        stage: stage.id,
        stageName: stage.name,
        stageDescription: stage.description,
        photos: [],
        notes: '',
        completed: false
      });
    });

    return tasks;
  },

  /**
   * 验证照片质量（基础检查）
   */
  validatePhoto(photoData) {
    const errors = [];
    
    // 检查是否有图片数据
    if (!photoData || !photoData.url) {
      errors.push('未提供照片');
      return { valid: false, errors };
    }

    // 检查文件大小（最大10MB）
    if (photoData.size && photoData.size > 10 * 1024 * 1024) {
      errors.push('照片大小超过10MB，建议压缩后重试');
    }

    // 检查是否有标注（建议有）
    if (!photoData.markers || photoData.markers.length === 0) {
      errors.push('建议在照片上标记渗漏位置');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: errors
    };
  },

  /**
   * 生成勘察报告数据结构
   */
  generateReportStructure(inspectionData) {
    return {
      // 基本信息
      basicInfo: {
        projectName: inspectionData.projectName || '',
        customerName: inspectionData.customerName || '',
        customerPhone: inspectionData.customerPhone || '',
        customerAddress: inspectionData.customerAddress || '',
        buildingType: inspectionData.buildingType || '',
        buildYear: inspectionData.buildYear || '',
        inspectionTime: inspectionData.inspectionTime || new Date().toISOString(),
        inspector: inspectionData.inspector || ''
      },

      // 渗漏信息
      leakInfo: {
        locations: inspectionData.leakLocations || [],
        totalLocations: (inspectionData.leakLocations || []).length,
        photos: this.compilePhotos(inspectionData.photos || [])
      },

      // AI诊断结果
      diagnosis: inspectionData.diagnosis || null,

      // 紧急程度
      urgency: this.calculateUrgency(inspectionData),

      // 费用信息
      fee: {
        inspectionFee: inspectionData.inspectionFee || 'pending',
        inspectionFeeDisplay: this.getInspectionFeeDisplay(inspectionData.inspectionFee)
      },

      // 结论与建议
      conclusion: this.generateConclusion(inspectionData),

      // 生成时间
      generatedAt: new Date().toISOString(),
      reportId: Store.generateId()
    };
  },

  /**
   * 编译所有照片
   */
  compilePhotos(photos) {
    const compiled = {
      panorama: [],
      closeup: [],
      detail: [],
      total: photos.length
    };

    photos.forEach(photo => {
      if (compiled[photo.stage]) {
        compiled[photo.stage].push(photo);
      }
    });

    return compiled;
  },

  /**
   * 计算紧急程度
   */
  calculateUrgency(inspectionData) {
    if (!inspectionData.diagnosis || !inspectionData.diagnosis.level) {
      return { level: 'C', text: '待评估' };
    }

    const config = Store.getLevelConfig(inspectionData.diagnosis.level);
    return {
      level: inspectionData.diagnosis.level,
      ...config
    };
  },

  /**
   * 获取勘察费显示文本
   */
  getInspectionFeeDisplay(status) {
    const displays = {
      paid: '已预约上门勘察（已付费¥100）',
      pending: '待确认勘察预约',
      waived: '已减免勘察费'
    };
    return displays[status] || '待确认勘察预约';
  },

  /**
   * 生成结论
   */
  generateConclusion(inspectionData) {
    const locations = (inspectionData.leakLocations || []).map(l => l.name).join('、');
    const urgency = this.calculateUrgency(inspectionData);

    return {
      summary: `本次勘察发现${locations}存在渗漏问题，综合评估为【${urgency.text}】级别。`,
      diagnosis: inspectionData.diagnosis ? inspectionData.diagnosis.conclusion || '' : '',
      suggestion: inspectionData.diagnosis ? inspectionData.diagnosis.suggestion || '' : ''
    };
  },

  /**
   * 导出报告为文本格式
   */
  exportAsText(report) {
    let text = '';
    
    text += '='.repeat(50) + '\n';
    text += '     珠海聚达建筑工程有限公司\n';
    text += '     渗漏勘察报告\n';
    text += '='.repeat(50) + '\n\n';

    // 基本信息
    text += '【一、基本信息】\n';
    text += `客户姓名：${report.basicInfo.customerName}\n`;
    text += `联系电话：${report.basicInfo.customerPhone}\n`;
    text += `勘察地址：${report.basicInfo.customerAddress}\n`;
    text += `建筑类型：${report.basicInfo.buildingType}\n`;
    text += `建造年代：${report.basicInfo.buildYear}\n`;
    text += `勘察时间：${Store.formatDate(report.basicInfo.inspectionTime)}\n`;
    text += `勘察人员：${report.basicInfo.inspector}\n\n`;

    // 渗漏信息
    text += '【二、渗漏情况】\n';
    text += `渗漏位置：${report.leakInfo.locations.map(l => l.name).join('、')}\n`;
    text += `拍摄照片：${report.leakInfo.total}张\n\n`;

    // AI诊断
    if (report.diagnosis) {
      text += '【三、AI深度诊断】\n';
      text += `紧急程度：【${report.diagnosis.level}级】\n`;
      text += `诊断类型：${report.diagnosis.type}\n`;
      if (report.diagnosis.observation) {
        text += `\n🔍 观察：${report.diagnosis.observation}\n`;
      }
      if (report.diagnosis.reasoning) {
        text += `\n🧠 推理：${report.diagnosis.reasoning}\n`;
      }
      if (report.diagnosis.conclusion) {
        text += `\n📋 结论：${report.diagnosis.conclusion}\n`;
      }
      if (report.diagnosis.suggestion) {
        text += `\n🔧 修复建议：${report.diagnosis.suggestion}\n`;
      }
      text += '\n';
    }

    // 费用信息
    text += '【四、费用信息】\n';
    text += `勘察费：${report.fee.inspectionFeeDisplay}\n\n`;

    // 结论
    text += '【五、总结】\n';
    text += report.conclusion.summary + '\n';

    text += '\n' + '='.repeat(50) + '\n';
    text += `报告编号：${report.reportId}\n`;
    text += `生成时间：${Store.formatDate(report.generatedAt)}\n`;
    text += '\n珠海聚达建筑工程有限公司\n';
    text += '电话：0756-8866780 / 13411435326\n';
    text += '='.repeat(50) + '\n';

    return text;
  }
};

// 导出
window.SOP = SOP;
