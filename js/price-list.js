/**
 * 防水工程价格表（含阶梯系数）
 * 聚达勘察助手 - 报价计算器数据
 */
const PriceList = {
  // ==================== 价格定义 ====================
  
  // 按面积计价（元/㎡）
  BY_AREA: {
    roof_surface: { 
      id: 'roof_surface', 
      name: '屋面大面防水', 
      unit: '㎡', 
      unitName: '平方米',
      prices: { basic: 120, standard: 180, premium: 260 },
      supportThickness: true,  // 支持清理厚度系数
      supportHeight: false
    },
    bathroom_surface: { 
      id: 'bathroom_surface', 
      name: '卫生间地面防水', 
      unit: '㎡', 
      unitName: '平方米',
      prices: { basic: 150, standard: 220, premium: 300 },
      supportThickness: false,
      supportHeight: false
    },
    wall_surface: { 
      id: 'wall_surface', 
      name: '外墙大面防水', 
      unit: '㎡', 
      unitName: '平方米',
      prices: { basic: 280, standard: 380, premium: 480 },
      supportThickness: false,
      supportHeight: true  // 支持高空作业系数
    },
    balcony_surface: { 
      id: 'balcony_surface', 
      name: '阳台防水', 
      unit: '㎡', 
      unitName: '平方米',
      prices: { basic: 150, standard: 220, premium: 300 },
      supportThickness: false,
      supportHeight: false
    },
    basement_surface: { 
      id: 'basement_surface', 
      name: '地下室防水', 
      unit: '㎡', 
      unitName: '平方米',
      prices: { basic: 180, standard: 260, premium: 380 },
      supportThickness: false,
      supportHeight: false
    }
  },
  
  // 按延长米计价（元/m）
  BY_METER: {
    parapet_corner: { 
      id: 'parapet_corner', 
      name: '女儿墙阴角防水', 
      unit: 'm', 
      unitName: '延长米',
      prices: { basic: 80, standard: 120, premium: 180 },
      supportThickness: false,
      supportHeight: true
    },
    wall_corner: { 
      id: 'wall_corner', 
      name: '外墙阴角防水', 
      unit: 'm', 
      unitName: '延长米',
      prices: { basic: 80, standard: 120, premium: 180 },
      supportThickness: false,
      supportHeight: true
    },
    window_seal: { 
      id: 'window_seal', 
      name: '窗框密封处理', 
      unit: 'm', 
      unitName: '延长米',
      prices: { basic: 60, standard: 100, premium: 150 },
      supportThickness: false,
      supportHeight: true,
      note: '按窗周长计算'
    },
    crack_injection: { 
      id: 'crack_injection', 
      name: '裂缝注浆堵漏', 
      unit: 'm', 
      unitName: '延长米',
      prices: { basic: 100, standard: 180, premium: 280 },
      supportThickness: false,
      supportHeight: false
    },
    expansion_joint: { 
      id: 'expansion_joint', 
      name: '伸缩缝处理', 
      unit: 'm', 
      unitName: '延长米',
      prices: { basic: 150, standard: 250, premium: 380 },
      supportThickness: false,
      supportHeight: true
    },
    ground_floor_joint: { 
      id: 'ground_floor_joint', 
      name: '地角缝处理', 
      unit: 'm', 
      unitName: '延长米',
      prices: { basic: 90, standard: 140, premium: 200 },
      supportThickness: false,
      supportHeight: false
    }
  },
  
  // 按处计价（元/处）
  BY_PIECE: {
    drain_outlet: { 
      id: 'drain_outlet', 
      name: '落水口处理', 
      unit: '处', 
      unitName: '处',
      prices: { basic: 150, standard: 250, premium: 380 },
      supportThickness: false,
      supportHeight: false
    },
    pipe_penetration: { 
      id: 'pipe_penetration', 
      name: '管道穿墙处理', 
      unit: '处', 
      unitName: '处',
      prices: { basic: 120, standard: 200, premium: 300 },
      supportThickness: false,
      supportHeight: true
    },
    pipe_joint: { 
      id: 'pipe_joint', 
      name: '管道接口堵漏', 
      unit: '处', 
      unitName: '处',
      prices: { basic: 100, standard: 180, premium: 280 },
      supportThickness: false,
      supportHeight: true
    },
    vent_pipe: { 
      id: 'vent_pipe', 
      name: '排气管处理', 
      unit: '处', 
      unitName: '处',
      prices: { basic: 80, standard: 150, premium: 220 },
      supportThickness: false,
      supportHeight: true
    },
    window_leak: { 
      id: 'window_leak', 
      name: '窗框渗漏处理', 
      unit: '处', 
      unitName: '处',
      prices: { basic: 200, standard: 350, premium: 500 },
      supportThickness: false,
      supportHeight: true
    }
  },
  
  // ==================== 阶梯系数定义 ====================
  
  // 清理厚度系数（仅屋面类）
  THICKNESS_COEFFICIENTS: [
    { id: 'thickness_0_5', label: '0-5cm', desc: '清理至原结构层', coefficient: 1.0, floors: '0', recommended: true },
    { id: 'thickness_5_10', label: '5-10cm', desc: '含隔热砖层', coefficient: 1.3, floors: '0' },
    { id: 'thickness_10_15', label: '10-15cm', desc: '含隔热砖+保护层', coefficient: 1.6, floors: '0' },
    { id: 'thickness_15_plus', label: '15cm以上', desc: '含保温层，需现场评估', coefficient: 2.0, floors: '0', evaluation: true }
  ],
  
  // 高空作业系数（外墙/窗框类）
  HEIGHT_COEFFICIENTS: [
    { id: 'height_0_10', label: '≤10米', desc: '3层以下', coefficient: 1.0, floors: '1-3', recommended: true },
    { id: 'height_10_20', label: '10-20米', desc: '4-6层', coefficient: 1.5, floors: '4-6' },
    { id: 'height_20_50', label: '20-50米', desc: '7-15层', coefficient: 2.0, floors: '7-15' },
    { id: 'height_50_100', label: '50-100米', desc: '16-30层', coefficient: 3.0, floors: '16-30' },
    { id: 'height_100_plus', label: '100米以上', desc: '需现场评估', coefficient: 4.0, floors: '30+', evaluation: true }
  ],
  
  // ==================== 工艺等级定义 ====================
  
  GRADE_CONFIG: {
    basic: {
      id: 'basic',
      name: '基础方案',
      description: '满足基本防水要求，材料选用合格品',
      warranty: '质保1年',
      color: '#999'
    },
    standard: {
      id: 'standard',
      name: '标准方案',
      description: '推荐方案，材料选用优质品',
      warranty: '质保3年',
      color: '#1989fa',
      recommended: true
    },
    premium: {
      id: 'premium',
      name: '优质方案',
      description: '高端方案，材料选用顶级品',
      warranty: '质保5年',
      color: '#07c160'
    }
  },
  
  // ==================== 工具方法 ====================
  
  // 获取所有部位选项（按分类）
  getAllCategories() {
    return [
      { id: 'area', name: '按面积计价', icon: '📐', items: this.BY_AREA },
      { id: 'meter', name: '按延长米计价', icon: '📏', items: this.BY_METER },
      { id: 'piece', name: '按处计价', icon: '🔧', items: this.BY_PIECE }
    ];
  },
  
  // 根据ID获取部位信息
  getItemById(id) {
    const all = { ...this.BY_AREA, ...this.BY_METER, ...this.BY_PIECE };
    return all[id] || null;
  },
  
  // 获取部位列表（扁平化）
  getAllItems() {
    return [
      ...Object.values(this.BY_AREA),
      ...Object.values(this.BY_METER),
      ...Object.values(this.BY_PIECE)
    ];
  },
  
  // 获取指定部位+等级的基础单价
  getBaseUnitPrice(itemId, grade) {
    const item = this.getItemById(itemId);
    if (!item) return 0;
    return item.prices[grade] || 0;
  },
  
  // 计算分项最终单价（含系数）
  calculateFinalUnitPrice(itemId, grade, thicknessCoeff = 1.0, heightCoeff = 1.0) {
    const basePrice = this.getBaseUnitPrice(itemId, grade);
    return basePrice * thicknessCoeff * heightCoeff;
  },
  
  // 计算小计
  calculateSubtotal(itemId, grade, quantity, thicknessCoeff = 1.0, heightCoeff = 1.0) {
    const unitPrice = this.calculateFinalUnitPrice(itemId, grade, thicknessCoeff, heightCoeff);
    return unitPrice * quantity;
  },
  
  // 获取清理厚度系数
  getThicknessCoefficient(thicknessId) {
    const coeff = this.THICKNESS_COEFFICIENTS.find(t => t.id === thicknessId);
    return coeff ? coeff.coefficient : 1.0;
  },
  
  // 获取高空作业系数
  getHeightCoefficient(heightId) {
    const coeff = this.HEIGHT_COEFFICIENTS.find(h => h.id === heightId);
    return coeff ? coeff.coefficient : 1.0;
  },
  
  // 检查部位是否支持清理厚度
  supportsThickness(itemId) {
    const item = this.getItemById(itemId);
    return item ? item.supportThickness : false;
  },
  
  // 检查部位是否支持高空作业
  supportsHeight(itemId) {
    const item = this.getItemById(itemId);
    return item ? item.supportHeight : false;
  },
  
  // 获取系数说明文本
  getCoefficientDescription(type, coeffId) {
    const list = type === 'thickness' ? this.THICKNESS_COEFFICIENTS : this.HEIGHT_COEFFICIENTS;
    const coeff = list.find(c => c.id === coeffId);
    if (!coeff) return '';
    
    if (coeff.evaluation) {
      return `${coeff.label}（${coeff.desc}）- 需现场评估`;
    }
    return `${coeff.label}（${coeff.desc}）`;
  }
};

// 导出
window.PriceList = PriceList;
