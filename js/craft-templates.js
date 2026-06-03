/**
 * 施工工艺模板数据 - 升级版
 * 包含质量标准、验收要求、必拍照片等标准化质检节点
 * 每一张照片就是一道质检关卡
 */
const CraftTemplates = {
  // 渗漏类型配置
  LEAK_TYPES: [
    { id: 'wall', name: '外墙', icon: '🏠', color: '#4A90D9' },
    { id: 'toilet', name: '卫生间', icon: '🚽', color: '#67C23A' },
    { id: 'window', name: '窗框', icon: '🪟', color: '#E6A23C' },
    { id: 'roof', name: '屋面', icon: '🏗️', color: '#909399' },
    { id: 'basement', name: '地下室', icon: '📦', color: '#F56C6C' },
    { id: 'pipe', name: '管道', icon: '🔧', color: '#9B59B6' }
  ],

  // 工艺模板 - 升级版数据结构
  templates: [
    {
      id: 'tpl_wall',
      type: 'wall',
      name: '外墙防水施工工艺',
      description: '适用于住宅、商业建筑外墙渗漏维修',
      estimatedTime: '3-5天',
      difficulty: '中等',
      materials: ['外墙防水涂料', '聚合物砂浆', '聚酯布', '密封胶'],
      tools: ['高压水枪', '电动搅拌器', '滚筒', '刷子', '美工刀'],
      steps: [
        {
          step: 1,
          stepName: '基层清理',
          qualityStandard: '基层无灰尘、无油污、无松动、无空鼓、旧涂层清除干净',
          acceptanceCriteria: '手摸无灰、敲击无空鼓声、目测无残留旧涂层',
          duration: '2-4小时',
          keyPoints: ['无明显污垢', '基面干燥', '无空鼓松动'],
          materials: ['高压水枪', '清洁剂', '刷子'],
          requiredPhotos: [
            { name: '基层全景', desc: '拍摄整个施工面，展示清理后的整体状况', angle: '全景' },
            { name: '墙面特写', desc: '手摸墙面拍特写，展示无灰尘无油污', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 2,
          stepName: '裂缝修补',
          qualityStandard: '宽缝填实、窄缝封严、与基层平齐，无收缩裂缝',
          acceptanceCriteria: '目视平整、触摸无凹陷、划针划过顺滑',
          duration: '3-5小时',
          keyPoints: ['V槽规整（宽15-25mm，深10-15mm）', '填充密实无气泡', '表面平整'],
          materials: ['聚合物砂浆', '堵漏王', '切割工具'],
          requiredPhotos: [
            { name: '裂缝标识', desc: '标注裂缝位置和走向', angle: '标识' },
            { name: '修补后特写', desc: '每条修补裂缝的特写', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 3,
          stepName: '节点加强',
          qualityStandard: '阴角贴聚酯布、管根附加层、窗框包边，无气泡无褶皱',
          acceptanceCriteria: '布宽≥150mm、搭接≥50mm、无翘边、无气泡',
          duration: '2-3小时',
          keyPoints: ['布平整无褶皱', '搭接宽度≥50mm', '无翘边'],
          materials: ['聚酯布', '玻纤网格布', '外墙防水涂料'],
          requiredPhotos: [
            { name: '阴角节点', desc: '阴角处聚酯布加强层特写', angle: '特写' },
            { name: '管根节点', desc: '管根部位附加层特写', angle: '特写' },
            { name: '窗框节点', desc: '窗框周边包边特写', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 4,
          stepName: '大面涂刷',
          qualityStandard: '一布三涂、总厚≥1.5mm、无漏刷、无气泡、无流挂',
          acceptanceCriteria: '厚度仪检测≥1.5mm、覆盖率100%、无流挂',
          duration: '4-6小时',
          keyPoints: ['厚度均匀（0.5-0.8mm/遍）', '无漏涂', '无流挂'],
          materials: ['外墙专用防水涂料'],
          requiredPhotos: [
            { name: '大面全景', desc: '整体涂刷效果全景', angle: '全景' },
            { name: '厚度特写', desc: '用卡尺展示涂层厚度', angle: '特写' },
            { name: '搭接处', desc: '聚酯布搭接部位特写', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 5,
          stepName: '表层保护',
          qualityStandard: '透明胶均匀覆盖、无流挂、无漏涂、表面平整',
          acceptanceCriteria: '目视无缺陷、厚度≥0.5mm、与基面粘结牢固',
          duration: '2-3小时',
          keyPoints: ['颜色一致', '无色差', '无漏涂'],
          materials: ['外墙防水面漆', '色浆'],
          requiredPhotos: [
            { name: '保护层全景', desc: '表层保护完成后的整体效果', angle: '全景' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 6,
          stepName: '闭水验收',
          qualityStandard: '蓄水24h、水位无明显下降、楼下无渗漏',
          acceptanceCriteria: '楼下检查无湿渍无水痕、节点密封完好',
          duration: '24-48小时',
          keyPoints: ['室内无渗漏', '涂层无脱落', '节点密封完好'],
          materials: ['水管', '梯子', '水位标尺'],
          requiredPhotos: [
            { name: '蓄水全景', desc: '蓄水状态全景，水位线清晰可见', angle: '全景' },
            { name: '楼下观察', desc: '楼下对应位置检查，无渗漏痕迹', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        }
      ]
    },
    {
      id: 'tpl_toilet',
      type: 'toilet',
      name: '卫生间免砸砖施工工艺',
      description: '适用于卫生间地砖渗漏，无需破坏原有瓷砖',
      estimatedTime: '2-3天',
      difficulty: '较高',
      materials: ['免砸砖防水涂料', '注浆液', '美缝剂', '堵漏王'],
      tools: ['注浆机', '电钻', '美缝工具', '清洁工具'],
      steps: [
        {
          step: 1,
          stepName: '渗漏排查',
          qualityStandard: '确认渗漏点位置和水源，渗漏形态记录完整',
          acceptanceCriteria: '能准确指出渗漏点，有照片或视频记录',
          duration: '4-8小时',
          keyPoints: ['渗漏点定位准确', '记录渗漏形态'],
          materials: ['水不漏', '堵漏王', '色剂'],
          requiredPhotos: [
            { name: '漏点特写', desc: '渗漏点特写，水迹清晰可见', angle: '特写' },
            { name: '水源标识', desc: '标识可能的进水点', angle: '标识' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 2,
          stepName: '微创注浆',
          qualityStandard: '钻孔位准确、注浆饱满、无渗出、固化后无异常',
          acceptanceCriteria: '注浆压力0.2-0.4MPa、饱和注浆、表面无鼓包',
          duration: '2-4小时',
          keyPoints: ['注浆饱和', '无跑浆漏浆', '表面无明显鼓包'],
          materials: ['聚氨酯注浆液', '丙烯酸盐注浆液', '注浆机'],
          requiredPhotos: [
            { name: '注浆孔位', desc: '标注钻孔位置和间距', angle: '标识' },
            { name: '注浆过程', desc: '注浆过程中照片，展示饱满度', angle: '特写' },
            { name: '注浆后特写', desc: '注浆完成固化后状态', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 3,
          stepName: '基面处理',
          qualityStandard: '瓷砖缝清理干净、无杂物、无霉斑、干燥',
          acceptanceCriteria: '缝隙内无残留、瓷砖表面干净、手摸无灰',
          duration: '1-2小时',
          keyPoints: ['瓷砖表面干净', '无霉斑', '干燥'],
          materials: ['清洁剂', '草酸', '除霉剂', '百洁布'],
          requiredPhotos: [
            { name: '缝隙特写', desc: '清理后的瓷砖缝隙特写', angle: '特写' },
            { name: '整体效果', desc: '基面处理后的整体效果', angle: '全景' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 4,
          stepName: '节点加强',
          qualityStandard: '地漏管根墙角贴聚酯布加强，覆盖完整无遗漏',
          acceptanceCriteria: '所有节点全部覆盖、加强层完整无遗漏',
          duration: '1-2小时',
          keyPoints: ['节点全部覆盖', '无遗漏'],
          materials: ['加强型防水涂料', '窄幅防水布'],
          requiredPhotos: [
            { name: '地漏节点', desc: '地漏周边加强层特写', angle: '特写' },
            { name: '管根节点', desc: '管道根部加强层特写', angle: '特写' },
            { name: '墙角节点', desc: '墙角阴阳角加强层特写', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 5,
          stepName: '大面涂刷',
          qualityStandard: '2-3遍JS涂料、厚度≥1.5mm、渗透瓷砖缝隙',
          acceptanceCriteria: '涂层均匀无流挂、覆盖率100%、渗透充分',
          duration: '3-4小时',
          keyPoints: ['涂层均匀', '无流挂', '渗透瓷砖缝隙'],
          materials: ['免砸砖透明防水涂料'],
          requiredPhotos: [
            { name: '涂刷全景', desc: '整体涂刷效果全景', angle: '全景' },
            { name: '厚度特写', desc: '用卡尺或硬币展示涂层厚度', angle: '特写' },
            { name: '缝隙渗透', desc: '涂料渗透瓷砖缝隙的特写', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 6,
          stepName: '闭水试验',
          qualityStandard: '蓄水24-48h、水位无明显下降、楼下无渗漏',
          acceptanceCriteria: '楼下检查无湿渍无水痕、水位下降＜5mm',
          duration: '24-48小时',
          keyPoints: ['楼下无渗漏', '水位无明显下降'],
          materials: ['挡水条', '标尺'],
          requiredPhotos: [
            { name: '蓄水全景', desc: '蓄水状态全景，水位线清晰', angle: '全景' },
            { name: '楼下观察', desc: '楼下对应位置检查，无渗漏', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 7,
          stepName: '勾缝处理',
          qualityStandard: '防水勾缝剂填满、表面平整光滑、无脱落无凹陷',
          acceptanceCriteria: '缝隙填充饱满、表面平整光滑、与瓷砖粘结牢固',
          duration: '2-3小时',
          keyPoints: ['缝隙填充饱满', '表面平整', '无脱落'],
          materials: ['美缝剂', '勾缝剂', '刮板'],
          requiredPhotos: [
            { name: '勾缝特写', desc: '勾缝完成后的特写，展示平整度', angle: '特写' },
            { name: '整体效果', desc: '全部勾缝完成后的整体效果', angle: '全景' }
          ],
          passCondition: 'all_photos_uploaded'
        }
      ]
    },
    {
      id: 'tpl_window',
      type: 'window',
      name: '窗框密封施工工艺',
      description: '适用于窗框与墙体交接处渗漏维修',
      estimatedTime: '1-2天',
      difficulty: '中等',
      materials: ['耐候硅酮密封胶', '聚氨酯发泡剂', '聚合物防水涂料', '聚酯布'],
      tools: ['美工刀', '发泡枪', '胶枪', '钢丝刷', '吸尘器'],
      steps: [
        {
          step: 1,
          stepName: '旧胶清除',
          qualityStandard: '老化密封胶全部清除、无残留、窗框和墙体无损伤',
          acceptanceCriteria: '缝隙内无旧胶残留、表面无划伤无破损',
          duration: '1-2小时',
          keyPoints: ['旧胶清除干净', '窗框无损伤', '墙体无破损'],
          materials: ['美工刀', '专用清除工具', '刮刀'],
          requiredPhotos: [
            { name: '清除前', desc: '旧胶未清除前的状态', angle: '特写' },
            { name: '清除后', desc: '旧胶清除后的缝隙状态', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 2,
          stepName: '缝隙清理',
          qualityStandard: '缝内无杂物灰尘、干燥、无潮湿',
          acceptanceCriteria: '用刷子清理后目视干净、手摸无灰、完全干燥',
          duration: '1-2小时',
          keyPoints: ['缝隙内无杂物', '干燥'],
          materials: ['细钢丝刷', '吸尘器', '吹风机'],
          requiredPhotos: [
            { name: '缝隙特写', desc: '清理后的缝隙特写，无杂物', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 3,
          stepName: '发泡填充',
          qualityStandard: '泡沫饱满充实、无空鼓、固化后切平',
          acceptanceCriteria: '填充密实无空洞、表面切割平整、无多余溢出',
          duration: '1-2小时',
          keyPoints: ['填充质量', '密实无空鼓', '表面平整'],
          materials: ['聚氨酯发泡剂', '发泡枪'],
          requiredPhotos: [
            { name: '填充过程', desc: '发泡填充过程中的照片', angle: '特写' },
            { name: '填充特写', desc: '固化后切割前的状态特写', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 4,
          stepName: '堵漏加强',
          qualityStandard: '渗透结晶涂刷均匀、无遗漏、与基层粘结牢固',
          acceptanceCriteria: '涂料完全覆盖、无漏涂、渗透充分',
          duration: '1-2小时',
          keyPoints: ['加强层完整', '无褶皱', '粘结牢固'],
          materials: ['聚合物防水涂料', '聚酯布'],
          requiredPhotos: [
            { name: '涂刷特写', desc: '防水涂料涂刷的特写', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 5,
          stepName: '重新密封',
          qualityStandard: '硅酮胶连续饱满、宽≥15mm、无气泡无断点、表面光滑',
          acceptanceCriteria: '胶缝连续无断点、宽度均匀、无气泡、表面光滑',
          duration: '1-2小时',
          keyPoints: ['密封连续', '无气泡', '表面光滑'],
          materials: ['耐候硅酮密封胶', '胶枪', '美纹纸'],
          requiredPhotos: [
            { name: '打胶特写', desc: '密封胶施打的特写，展示饱满度', angle: '特写' },
            { name: '整体效果', desc: '整条密封胶的效果全景', angle: '全景' }
          ],
          passCondition: 'all_photos_uploaded'
        },
        {
          step: 6,
          stepName: '窗台找坡',
          qualityStandard: '坡度≥5%、排水顺畅、无积水区域',
          acceptanceCriteria: '坡度仪检测≥5%、倒水测试排水顺畅',
          duration: '1-2小时',
          keyPoints: ['坡度≥3%', '排水顺畅', '无积水'],
          materials: ['聚合物砂浆', '找平工具'],
          requiredPhotos: [
            { name: '窗台全景', desc: '找坡后的窗台整体效果', angle: '全景' },
            { name: '坡度特写', desc: '展示坡度的特写，可用水平尺', angle: '特写' }
          ],
          passCondition: 'all_photos_uploaded'
        }
      ]
    }
  ],

  // 获取所有渗漏类型
  getAllTypes() {
    return this.LEAK_TYPES;
  },

  // 根据类型获取工艺模板
  getTemplateByType(type) {
    return this.templates.find(t => t.type === type);
  },

  // 获取所有模板
  getAllTemplates() {
    return this.templates;
  },

  // 获取工艺步骤
  getStepsByType(type) {
    const template = this.getTemplateByType(type);
    return template ? template.steps : [];
  },

  // 获取标准工艺名称
  getCraftName(type) {
    const template = this.getTemplateByType(type);
    return template ? template.name : '';
  },

  // 验证步骤完成状态
  validateStepCompletion(step) {
    const uploadedPhotos = step.photos || [];
    const requiredCount = (step.requiredPhotos || []).length;
    const uploadedCount = uploadedPhotos.length;
    const hasAllPhotos = uploadedCount >= requiredCount;
    
    return {
      canComplete: hasAllPhotos,
      uploadedCount,
      requiredCount,
      reasons: {
        hasAllPhotos
      }
    };
  },

  // 计算项目进度
  calculateProgress(projectSteps) {
    if (!projectSteps || projectSteps.length === 0) return 0;
    const completed = projectSteps.filter(s => s.completed).length;
    return Math.round((completed / projectSteps.length) * 100);
  },

  // 获取下一步
  getNextStep(projectSteps) {
    return projectSteps.find(s => !s.completed);
  },

  // 获取步骤的必拍照片状态
  getStepPhotoStatus(step) {
    const uploadedPhotos = step.photos || [];
    const requiredPhotos = step.requiredPhotos || [];
    
    return requiredPhotos.map((req, index) => ({
      ...req,
      uploaded: uploadedPhotos[index] ? true : false,
      photo: uploadedPhotos[index] || null
    }));
  },

  // 初始化项目工艺步骤 - 升级版
  initializeProjectSteps(type) {
    const template = this.getTemplateByType(type);
    if (!template) return [];

    return template.steps.map(s => ({
      step: s.step,
      stepName: s.stepName,
      qualityStandard: s.qualityStandard,
      acceptanceCriteria: s.acceptanceCriteria,
      duration: s.duration,
      keyPoints: s.keyPoints || [],
      materials: s.materials || [],
      requiredPhotos: s.requiredPhotos || [],
      passCondition: s.passCondition || 'all_photos_uploaded',
      // 施工记录
      completed: false,
      completedTime: null,
      photos: [], // 上传的照片列表
      notes: '',
      // 审核状态
      reviewStatus: 'pending', // pending | approved | rejected
      reviewTime: null,
      reviewNote: ''
    }));
  }
};

// 导出
window.CraftTemplates = CraftTemplates;
