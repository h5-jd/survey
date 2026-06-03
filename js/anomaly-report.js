/**
 * 异常上报模块 - v4.0
 * 施工中快速上报新问题，经验积累
 */
const AnomalyReport = {
  // 异常类型定义
  TYPES: [
    { id: 'new_leak', icon: '🔴', name: '新发现渗漏点', desc: '勘察没发现的新渗漏问题', color: '#ee0a24' },
    { id: 'hidden_issue', icon: '🟡', name: '隐蔽工程问题', desc: '砸开后发现的结构/管道问题', color: '#ff976a' },
    { id: 'material_issue', icon: '🟠', name: '材料异常', desc: '材料不达标或缺货需替换', color: '#fa8c16' },
    { id: 'craft_change', icon: '🔵', name: '工艺变更', desc: '原方案行不通需更换工艺', color: '#1890ff' },
    { id: 'customer_change', icon: '⚪', name: '客户变更', desc: '客户临时加活或改要求', color: '#666666' }
  ],
  
  // 状态
  currentReport: null,
  
  // 初始化
  init() {
    console.log('AnomalyReport: 异常上报模块初始化完成');
    return this;
  },
  
  // 获取异常类型
  getTypes() {
    return this.TYPES;
  },
  
  // 获取类型名称
  getTypeName(typeId) {
    const type = this.TYPES.find(t => t.id === typeId);
    return type ? type.name : typeId;
  },
  
  // 获取类型信息
  getTypeInfo(typeId) {
    return this.TYPES.find(t => t.id === typeId) || this.TYPES[0];
  },
  
  // 打开异常上报UI
  openReportUI(options = {}) {
    const {
      projectId,
      projectName,
      stepIndex,
      stepName,
      onConfirm,
      onCancel
    } = options;
    
    // 创建UI
    const container = document.createElement('div');
    container.className = 'anomaly-report-overlay';
    
    // 步骤信息
    const stepInfo = stepIndex !== undefined && stepName 
      ? `步骤${stepIndex + 1}：${stepName}` 
      : '未指定步骤';
    
    container.innerHTML = `
      <div class="anomaly-report-modal">
        <div class="anomaly-report-header">
          <span class="anomaly-close">×</span>
          <span class="anomaly-title">⚠️ 异常上报</span>
          <span class="anomaly-step">${stepInfo}</span>
        </div>
        
        <div class="anomaly-report-body">
          <!-- 异常类型选择 -->
          <div class="anomaly-type-section">
            <div class="section-label">选择异常类型</div>
            <div class="anomaly-type-grid">
              ${this.TYPES.map(type => `
                <div class="anomaly-type-item" data-type="${type.id}" style="border-color: ${type.color}20;">
                  <span class="type-icon" style="background: ${type.color}20;">${type.icon}</span>
                  <span class="type-name">${type.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 问题描述 -->
          <div class="anomaly-desc-section">
            <div class="section-label">问题描述</div>
            <textarea class="anomaly-desc-input" placeholder="详细描述发现的问题..."></textarea>
          </div>
          
          <!-- 照片/录像 -->
          <div class="anomaly-media-section">
            <div class="section-label">现场照片/录像</div>
            <div class="anomaly-media-grid">
              <div class="add-photo-btn" data-action="photo">
                <span class="icon">📷</span>
                <span class="text">拍照</span>
              </div>
              <div class="add-photo-btn" data-action="video">
                <span class="icon">🎬</span>
                <span class="text">录像</span>
              </div>
            </div>
            <div class="anomaly-media-list"></div>
          </div>
          
          <!-- 语音备注 -->
          <div class="anomaly-voice-section">
            <div class="section-label">语音说明（可选）</div>
            <button class="voice-record-btn">
              <span>🎤</span>
              <span>添加语音备注</span>
            </button>
          </div>
        </div>
        
        <div class="anomaly-report-footer">
          <button class="anomaly-btn-cancel">取消</button>
          <button class="anomaly-btn-submit">提交上报</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // 状态
    const state = {
      selectedType: null,
      photos: [],
      videos: [],
      voiceNote: null,
      description: ''
    };
    
    // 元素引用
    const elements = {
      container,
      closeBtn: container.querySelector('.anomaly-close'),
      cancelBtn: container.querySelector('.anomaly-btn-cancel'),
      submitBtn: container.querySelector('.anomaly-btn-submit'),
      typeItems: container.querySelectorAll('.anomaly-type-item'),
      descInput: container.querySelector('.anomaly-desc-input'),
      mediaList: container.querySelector('.anomaly-media-list'),
      voiceBtn: container.querySelector('.voice-record-btn'),
      addPhotoBtn: container.querySelector('[data-action="photo"]'),
      addVideoBtn: container.querySelector('[data-action="video"]')
    };
    
    // 关闭弹窗
    const closeUI = () => {
      document.body.removeChild(container);
      if (onCancel) onCancel();
    };
    
    // 事件绑定
    elements.closeBtn.onclick = closeUI;
    elements.cancelBtn.onclick = closeUI;
    
    // 类型选择
    elements.typeItems.forEach(item => {
      item.onclick = () => {
        elements.typeItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        state.selectedType = item.dataset.type;
      };
    });
    
    // 描述输入
    elements.descInput.oninput = (e) => {
      state.description = e.target.value;
    };
    
    // 拍照
    elements.addPhotoBtn.onclick = async () => {
      const result = await WatermarkCamera.openCameraWithUI({
        projectId,
        stage: 'anomaly'
      });
      
      if (result) {
        state.photos.push({
          url: result.watermarked,
          thumbnail: result.thumbnail || result.watermarked,
          timestamp: result.timestamp,
          gps: result.gps
        });
        updateMediaList();
      }
    };
    
    // 录像
    elements.addVideoBtn.onclick = () => {
      VideoCamera.openVideoRecorder({
        projectId,
        stepIndex,
        projectName,
        employeeName: Store?.getCurrentUser?.()?.name,
        onConfirm: (video) => {
          state.videos.push({
            url: video.videoUrl,
            thumbnail: video.thumbnail,
            duration: video.duration
          });
          updateMediaList();
        }
      });
    };
    
    // 语音备注
    elements.voiceBtn.onclick = () => {
      VoiceNote.showRecorderUI({
        projectId,
        stepIndex,
        employeeId: Store?.getCurrentUser?.()?.id,
        employeeName: Store?.getCurrentUser?.()?.name,
        onConfirm: (voice) => {
          state.voiceNote = voice;
          elements.voiceBtn.innerHTML = '<span>✅</span><span>语音已添加</span>';
          elements.voiceBtn.style.background = '#07c160';
          elements.voiceBtn.style.color = '#fff';
        }
      });
    };
    
    // 更新媒体列表
    const updateMediaList = () => {
      let html = '';
      
      state.photos.forEach((photo, index) => {
        html += `
          <div class="media-item" data-type="photo" data-index="${index}">
            <img src="${photo.thumbnail}" alt="照片">
            <span class="media-delete" data-index="${index}">×</span>
          </div>
        `;
      });
      
      state.videos.forEach((video, index) => {
        html += `
          <div class="media-item video" data-type="video" data-index="${index}">
            <img src="${video.thumbnail}" alt="视频">
            <span class="media-play">▶</span>
            <span class="media-delete" data-index="${index}">×</span>
          </div>
        `;
      });
      
      elements.mediaList.innerHTML = html;
      
      // 删除事件
      elements.mediaList.querySelectorAll('.media-delete').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const index = parseInt(btn.dataset.index);
          const type = btn.closest('.media-item').dataset.type;
          if (type === 'photo') {
            state.photos.splice(index, 1);
          } else {
            state.videos.splice(index, 1);
          }
          updateMediaList();
        };
      });
    };
    
    // 提交
    elements.submitBtn.onclick = async () => {
      // 验证
      if (!state.selectedType) {
        vant?.Toast?.fail('请选择异常类型');
        return;
      }
      
      elements.submitBtn.textContent = '提交中...';
      elements.submitBtn.disabled = true;
      
      try {
        const report = await this.submitReport({
          projectId,
          projectName,
          stepIndex,
          stepName,
          type: state.selectedType,
          description: state.description,
          photos: state.photos,
          videos: state.videos,
          voiceNote: state.voiceNote
        });
        
        document.body.removeChild(container);
        
        if (onConfirm) {
          onConfirm(report);
        }
        
        vant?.Toast?.success('异常已上报');
        
        // 发送通知给管理员
        AppNotification?.send?.({
          type: 'anomaly',
          title: '新异常上报',
          message: `${Store?.getCurrentUser?.()?.name}上报了${this.getTypeName(state.selectedType)}`,
          projectId,
          fromUser: Store?.getCurrentUser?.()?.id
        });
        
      } catch (error) {
        console.error('AnomalyReport: 提交失败', error);
        vant?.Toast?.fail('提交失败');
        elements.submitBtn.textContent = '提交上报';
        elements.submitBtn.disabled = false;
      }
    };
    
    return container;
  },
  
  // 提交异常报告
  async submitReport(data) {
    const report = {
      id: this.generateId(),
      projectId: data.projectId,
      projectName: data.projectName,
      stepIndex: data.stepIndex,
      stepName: data.stepName,
      type: data.type,
      typeName: this.getTypeName(data.type),
      description: data.description || '',
      photos: data.photos || [],
      videos: data.videos || [],
      voiceNoteId: data.voiceNote?.id || null,
      voiceNote: data.voiceNote,
      status: 'pending', // pending | processing | resolved
      reportedBy: Store?.getCurrentUser?.()?.id,
      reportedByName: Store?.getCurrentUser?.()?.name,
      reportedTime: new Date().toISOString(),
      handledBy: null,
      handledByName: null,
      handledTime: null,
      handleResult: '',
      syncStatus: navigator.onLine ? 'synced' : 'pending'
    };
    
    // 保存到IndexedDB
    await this.saveToDB(report);
    
    // 添加到同步队列
    if (!navigator.onLine) {
      await OfflineSync?.addToQueue?.('anomaly', 'create', {
        id: report.id,
        projectId: report.projectId
      });
    }
    
    console.log('AnomalyReport: 异常已上报', report.id);
    return report;
  },
  
  // 保存到IndexedDB
  async saveToDB(report) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['anomaly_reports'], 'readwrite');
        const store = transaction.objectStore('anomaly_reports');
        const addRequest = store.add(report);
        
        addRequest.onsuccess = () => resolve(report);
        addRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 更新报告
  async updateReport(reportId, updates) {
    const report = await this.getReport(reportId);
    if (!report) return null;
    
    const updatedReport = { ...report, ...updates };
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['anomaly_reports'], 'readwrite');
        const store = transaction.objectStore('anomaly_reports');
        const putRequest = store.put(updatedReport);
        
        putRequest.onsuccess = () => resolve(updatedReport);
        putRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取单个报告
  async getReport(reportId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['anomaly_reports'], 'readonly');
        const store = transaction.objectStore('anomaly_reports');
        const getRequest = store.get(reportId);
        
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取项目的所有异常
  async getReportsByProject(projectId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['anomaly_reports'], 'readonly');
        const store = transaction.objectStore('anomaly_reports');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const reports = (request.result || [])
            .filter(r => r.projectId === projectId)
            .sort((a, b) => new Date(b.reportedTime) - new Date(a.reportedTime));
          resolve(reports);
        };
        
        request.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取所有待处理异常（管理员）
  async getPendingReports() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['anomaly_reports'], 'readonly');
        const store = transaction.objectStore('anomaly_reports');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const reports = (request.result || [])
            .filter(r => r.status !== 'resolved')
            .sort((a, b) => new Date(b.reportedTime) - new Date(a.reportedTime));
          resolve(reports);
        };
        
        request.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取待处理异常数量
  async getPendingCount() {
    const reports = await this.getPendingReports();
    return reports.length;
  },
  
  // 处理异常（管理员）
  async handleReport(reportId, result, action) {
    const report = await this.getReport(reportId);
    if (!report) return null;
    
    const updates = {
      status: action === 'resolve' ? 'resolved' : 'processing',
      handledBy: Store?.getCurrentUser?.()?.id,
      handledByName: Store?.getCurrentUser?.()?.name,
      handledTime: new Date().toISOString(),
      handleResult: result
    };
    
    const updatedReport = await this.updateReport(reportId, updates);
    
    // 发送通知给上报人
    AppNotification?.send?.({
      type: 'anomaly_handled',
      title: '异常已处理',
      message: `您的异常「${report.typeName}」已被处理：${result}`,
      projectId: report.projectId,
      toUser: report.reportedBy
    });
    
    return updatedReport;
  },
  
  // 删除异常报告
  async deleteReport(reportId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['anomaly_reports'], 'readwrite');
        const store = transaction.objectStore('anomaly_reports');
        const deleteRequest = store.delete(reportId);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 工具方法
  generateId() {
    return 'anomaly_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // 格式化状态显示
  getStatusDisplay(status) {
    const map = {
      pending: { text: '待处理', color: '#ee0a24', icon: '⏳' },
      processing: { text: '处理中', color: '#1890ff', icon: '🔄' },
      resolved: { text: '已解决', color: '#07c160', icon: '✅' }
    };
    return map[status] || map.pending;
  }
};

// 导出
window.AnomalyReport = AnomalyReport;
