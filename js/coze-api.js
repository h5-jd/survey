/**
 * Coze API 封装
 * 用于员工端AI深度诊断
 */
class CozeAPI {
  constructor() {
    this.config = {};
    this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('juda_coze_config');
      if (saved) {
        this.config = JSON.parse(saved);
      } else {
        // 尝试从config.json加载
        fetch('./config.json')
          .then(r => r.json())
          .then(data => {
            if (data.coze_api) {
              this.config = data.coze_api;
            }
          })
          .catch(() => {
            console.log('config.json not found, using default settings');
          });
      }
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  }

  get baseUrl() {
    return this.config.baseUrl || 'https://api.coze.cn';
  }

  get botId() {
    return this.config.botId || '';
  }

  get accessToken() {
    return this.config.accessToken || '';
  }

  setConfig(config) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('juda_coze_config', JSON.stringify(this.config));
  }

  isConfigured() {
    return this.botId && this.accessToken;
  }

  /**
   * 上传图片到Coze
   * @param {string} imageBase64 - Base64编码的图片
   * @returns {Promise<string>} - 返回file_token
   */
  async uploadImage(imageBase64) {
    if (!this.isConfigured()) {
      throw new Error('Coze API未配置，请在设置中配置botId和accessToken');
    }

    // 将base64转换为Blob
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.length;
    }
    const blob = new Blob([bytes], { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, 'inspection.jpg');

    const response = await fetch(`${this.baseUrl}/v1/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`上传失败: ${response.status}`);
    }

    const result = await response.json();
    return result.data.file_token;
  }

  /**
   * 创建对话
   * @param {string} fileToken - 图片文件token
   * @param {string} prompt - 分析提示词
   * @returns {Promise<object>} - 返回chat对象
   */
  async createChat(fileToken, prompt) {
    if (!this.isConfigured()) {
      throw new Error('Coze API未配置');
    }

    const professionalPrompt = prompt || this.getProfessionalPrompt();

    const response = await fetch(`${this.baseUrl}/v1/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bot_id: this.botId,
        user_id: 'juda_employee',
        stream: false,
        auto_save_history: true,
        additional_messages: [
          {
            role: 'user',
            content: professionalPrompt,
            content_type: 'text',
            attachments: [
              {
                type: 'image',
                file_token: fileToken,
                extension_params: {}
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`创建对话失败: ${error}`);
    }

    return await response.json();
  }

  /**
   * 轮询对话状态
   * @param {string} chatId - 对话ID
   * @param {number} maxAttempts - 最大轮询次数
   * @param {number} interval - 轮询间隔(ms)
   * @returns {Promise<object>} - 返回chat详情
   */
  async pollChatStatus(chatId, maxAttempts = 60, interval = 2000) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${this.baseUrl}/v1/chat/retrieve?chat_id=${chatId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`获取对话状态失败: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data.status === 'completed') {
        return result.data;
      } else if (result.data.status === 'failed') {
        throw new Error('AI分析失败');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('AI分析超时，请重试');
  }

  /**
   * 获取对话消息
   * @param {string} chatId - 对话ID
   * @returns {Promise<array>} - 返回消息列表
   */
  async getChatMessages(chatId) {
    if (!this.isConfigured()) {
      throw new Error('Coze API未配置');
    }

    const response = await fetch(`${this.baseUrl}/v1/chat/message/list?chat_id=${chatId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`获取消息失败: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * 深度诊断 - 完整流程
   * @param {string} imageBase64 - Base64编码的图片
   * @param {string} location - 渗漏位置
   * @param {string} notes - 备注信息
   * @returns {Promise<object>} - 返回诊断结果
   */
  async deepDiagnose(imageBase64, location = '', notes = '') {
    // 1. 上传图片
    const fileToken = await this.uploadImage(imageBase64);

    // 2. 创建对话
    const chat = await this.createChat(fileToken, this.getContextualPrompt(location, notes));

    // 3. 轮询状态
    await this.pollChatStatus(chat.data.id);

    // 4. 获取消息
    const messages = await this.getChatMessages(chat.data.id);

    // 5. 解析结果
    return this.parseResult(messages);
  }

  /**
   * 获取上下文相关的专业提示词
   */
  getContextualPrompt(location, notes) {
    let context = '';
    if (location) {
      context += `渗漏位置：${location}。`;
    }
    if (notes) {
      context += `现场备注：${notes}。`;
    }

    return `你是拥有16年建筑渗漏维修经验的资深专家。请对照片进行专业深度分析。

${context ? `现场信息：${context}` : ''}

## 分析要求
1. **观察**：详细描述所有可见的渗漏特征
   - 裂缝走向、宽度、深度
   - 水渍颜色范围、形态
   - 发霉、空鼓、脱落情况
   - 密封胶老化、瓷砖破损等

2. **推理**：根据特征严谨推导渗漏路径
   - 进水点≠出水点：室内渗水位置不一定是外部进水位置
   - 上不漏下漏：水可能沿结构层从上方远处破损点渗入
   - 多通道叠加：多个进水点可能同时存在
   - 给出推理依据

3. **结论**：给出诊断结论
   - 渗漏类型判断
   - 可能原因按可能性排序（附依据）
   - 修复方向建议

4. **紧急程度评估**：
   - A-紧急：需要立即处理
   - B-一般：短期内处理
   - C-轻微：可择期处理

## 输出格式（请严格按此格式输出）
【X级-XXX】
🔍 观察：（详细描述每个可见特征）
🧠 推理：（推导渗漏路径，说明判断依据）
📋 结论：
  - 渗漏类型：XXX
  - 可能原因（按可能性排序）：
    1. XXX（依据：...）
    2. XXX（依据：...）
    3. XXX（依据：...）
  - 修复方向：XXX
🔧 修复建议：（具体施工方案方向）`;
  }

  /**
   * 获取默认的专业提示词
   */
  getProfessionalPrompt() {
    return this.getContextualPrompt('', '');
  }

  /**
   * 解析AI返回的结果
   */
  parseResult(messages) {
    const assistantMessage = messages.find(m => m.role === 'assistant' && m.type === 'answer');
    
    if (!assistantMessage) {
      throw new Error('未获取到AI分析结果');
    }

    const content = assistantMessage.content;
    
    // 解析紧急程度
    const levelMatch = content.match(/【([A-C])级-([^\]]+)】/);
    const level = levelMatch ? levelMatch[1] : 'C';
    const type = levelMatch ? levelMatch[2] : '渗漏问题';

    // 解析各部分内容
    const observationMatch = content.match(/🔍\s*观察：([\s\S]*?)(?=🧠|$)/);
    const reasoningMatch = content.match(/🧠\s*推理：([\s\S]*?)(?=📋|$)/);
    const conclusionMatch = content.match(/📋\s*结论：([\s\S]*?)(?=🔧|$)/);
    const suggestionMatch = content.match(/🔧\s*修复建议：([\s\S]*?)$/);

    return {
      level,
      type,
      observation: observationMatch ? observationMatch[1].trim() : '',
      reasoning: reasoningMatch ? reasoningMatch[1].trim() : '',
      conclusion: conclusionMatch ? conclusionMatch[1].trim() : '',
      suggestion: suggestionMatch ? suggestionMatch[1].trim() : '',
      rawContent: content
    };
  }
}

// 导出单例
window.CozeAPI = new CozeAPI();
