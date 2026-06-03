/**
 * 电子签名模块 - v4.0
 * Canvas手写签名、多种签名场景
 */
const SignaturePad = {
  // Canvas元素
  canvas: null,
  ctx: null,
  
  // 签名状态
  isDrawing: false,
  hasSignature: false,
  lastX: 0,
  lastY: 0,
  
  // 配置
  config: {
    strokeColor: '#333333',
    strokeWidth: 2,
    minWidth: 1,
    maxWidth: 4,
    backgroundColor: '#ffffff'
  },
  
  // 初始化
  init() {
    console.log('SignaturePad: 电子签名模块初始化完成');
    return this;
  },
  
  // 打开签名UI
  openSignatureUI(options = {}) {
    const {
      title = '签名确认',
      subtitle = '',
      signerRole = '',
      onConfirm,
      onCancel,
      width = 320,
      height = 200
    } = options;
    
    // 创建UI
    const container = document.createElement('div');
    container.className = 'signature-overlay';
    container.innerHTML = `
      <div class="signature-modal">
        <div class="signature-header">
          <span class="signature-close">×</span>
          <span class="signature-title">✍️ ${title}</span>
          <span class="signature-subtitle">${subtitle}</span>
        </div>
        
        <div class="signature-body">
          <div class="signature-canvas-wrapper">
            <canvas class="signature-canvas"></canvas>
            <div class="signature-placeholder">在此处签名</div>
          </div>
          
          <div class="signature-tools">
            <button class="sig-tool-btn clear-btn" title="清除">
              <span>🗑️</span>
              <span>清除</span>
            </button>
            <button class="sig-tool-btn undo-btn" title="撤销">
              <span>↩️</span>
              <span>撤销</span>
            </button>
            <div class="signature-color">
              <span>颜色：</span>
              <button class="color-btn active" data-color="#333333" style="background:#333333"></button>
              <button class="color-btn" data-color="#1a1a1a" style="background:#1a1a1a"></button>
              <button class="color-btn" data-color="#0066cc" style="background:#0066cc"></button>
            </div>
          </div>
        </div>
        
        <div class="signature-footer">
          <button class="sig-btn-cancel">取消</button>
          <button class="sig-btn-confirm" disabled>确认签名</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // 元素引用
    const elements = {
      container,
      canvas: container.querySelector('.signature-canvas'),
      placeholder: container.querySelector('.signature-placeholder'),
      clearBtn: container.querySelector('.clear-btn'),
      undoBtn: container.querySelector('.undo-btn'),
      colorBtns: container.querySelectorAll('.color-btn'),
      cancelBtn: container.querySelector('.sig-btn-cancel'),
      confirmBtn: container.querySelector('.sig-btn-confirm')
    };
    
    // 初始化Canvas
    this.initCanvas(elements.canvas, width, height);
    
    // 状态
    const state = {
      points: [],
      currentColor: '#333333'
    };
    
    // 获取触摸/鼠标位置
    const getPosition = (e) => {
      const rect = elements.canvas.getBoundingClientRect();
      const scaleX = elements.canvas.width / rect.width;
      const scaleY = elements.canvas.height / rect.height;
      
      if (e.touches) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };
    
    // 开始绘制
    const startDrawing = (e) => {
      e.preventDefault();
      this.isDrawing = true;
      elements.placeholder.style.display = 'none';
      
      const pos = getPosition(e);
      this.lastX = pos.x;
      this.lastY = pos.y;
      state.points.push({ x: pos.x, y: pos.y, color: state.currentColor });
    };
    
    // 绘制中
    const draw = (e) => {
      if (!this.isDrawing) return;
      e.preventDefault();
      
      const pos = getPosition(e);
      
      // 绘制线段
      this.ctx.beginPath();
      this.ctx.strokeStyle = state.currentColor;
      this.ctx.lineWidth = this.config.strokeWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      this.ctx.moveTo(this.lastX, this.lastY);
      this.ctx.lineTo(pos.x, pos.y);
      this.ctx.stroke();
      
      state.points.push({ x: pos.x, y: pos.y, color: state.currentColor });
      
      this.lastX = pos.x;
      this.lastY = pos.y;
      this.hasSignature = true;
      elements.confirmBtn.disabled = false;
    };
    
    // 结束绘制
    const stopDrawing = () => {
      this.isDrawing = false;
      state.points.push(null); // 分隔符
    };
    
    // 事件绑定
    elements.canvas.addEventListener('mousedown', startDrawing);
    elements.canvas.addEventListener('mousemove', draw);
    elements.canvas.addEventListener('mouseup', stopDrawing);
    elements.canvas.addEventListener('mouseleave', stopDrawing);
    
    elements.canvas.addEventListener('touchstart', startDrawing, { passive: false });
    elements.canvas.addEventListener('touchmove', draw, { passive: false });
    elements.canvas.addEventListener('touchend', stopDrawing);
    
    // 清除
    elements.clearBtn.onclick = () => {
      this.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
      state.points = [];
      this.hasSignature = false;
      elements.placeholder.style.display = 'block';
      elements.confirmBtn.disabled = true;
    };
    
    // 撤销（简单的实现）
    elements.undoBtn.onclick = () => {
      if (state.points.length === 0) return;
      
      // 移除最后一个笔画
      while (state.points.length > 0 && state.points.pop() !== null);
      
      // 重绘
      this.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
      this.redrawPoints(state.points);
    };
    
    // 颜色选择
    elements.colorBtns.forEach(btn => {
      btn.onclick = () => {
        elements.colorBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentColor = btn.dataset.color;
      };
    });
    
    // 关闭
    const closeUI = () => {
      document.body.removeChild(container);
      if (onCancel) onCancel();
    };
    
    elements.container.querySelector('.signature-close').onclick = closeUI;
    elements.cancelBtn.onclick = closeUI;
    
    // 确认
    elements.confirmBtn.onclick = () => {
      if (!this.hasSignature) return;
      
      const signatureData = {
        imageUrl: elements.canvas.toDataURL('image/png'),
        signerName: Store?.getCurrentUser?.()?.name || '',
        signerRole: signerRole || Store?.getRoleText?.(Store?.getCurrentUser?.()?.role) || '',
        signerPhone: Store?.getCurrentUser?.()?.phone || '',
        signTime: new Date().toISOString(),
        width: elements.canvas.width,
        height: elements.canvas.height
      };
      
      document.body.removeChild(container);
      
      if (onConfirm) {
        onConfirm(signatureData);
      }
    };
    
    return container;
  },
  
  // 初始化Canvas
  initCanvas(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 设置尺寸
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // 设置样式
    this.ctx.scale(dpr, dpr);
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, width, height);
    
    this.hasSignature = false;
  },
  
  // 重绘点（用于撤销）
  redrawPoints(points) {
    if (points.length === 0) return;
    
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width / (window.devicePixelRatio || 1), this.canvas.height / (window.devicePixelRatio || 1));
    
    let i = 0;
    while (i < points.length) {
      const point = points[i];
      if (point === null) {
        i++;
        continue;
      }
      
      this.ctx.beginPath();
      this.ctx.strokeStyle = point.color;
      this.ctx.lineWidth = this.config.strokeWidth;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      this.ctx.moveTo(point.x, point.y);
      
      // 绘制到下一个点
      let j = i + 1;
      while (j < points.length && points[j] !== null) {
        this.ctx.lineTo(points[j].x, points[j].y);
        j++;
      }
      this.ctx.stroke();
      
      i = j;
    }
    
    this.hasSignature = points.length > 0;
  },
  
  // 保存签名到项目
  async saveSignature(projectId, signatureData) {
    const project = Store?.getProject?.(projectId);
    if (!project) return null;
    
    const signature = {
      ...signatureData,
      id: this.generateId(),
      projectId,
      timestamp: new Date().toISOString()
    };
    
    // 更新项目数据
    Store?.updateProject?.(projectId, {
      signature: signature
    });
    
    // 添加操作日志
    Store?._addLog?.(project, 'signature', `【${signatureData.signerName}】签字确认`, {
      signerRole: signatureData.signerRole
    });
    
    console.log('SignaturePad: 签名已保存', signature.id);
    return signature;
  },
  
  // 获取项目签名
  getProjectSignature(projectId) {
    const project = Store?.getProject?.(projectId);
    return project?.signature || null;
  },
  
  // 显示签名确认弹窗
  showSignatureConfirm(options = {}) {
    const {
      projectId,
      stepName = '验收',
      onSigned,
      required = true
    } = options;
    
    // 签名UI
    this.openSignatureUI({
      title: '签字确认',
      subtitle: `${stepName} - 确认签字表示认可施工质量`,
      signerRole: Store?.getRoleText?.(Store?.getCurrentUser?.()?.role),
      onConfirm: async (signatureData) => {
        // 保存签名
        const saved = await this.saveSignature(projectId, signatureData);
        
        if (onSigned) {
          onSigned(saved);
        }
        
        vant?.Toast?.success('签名已保存');
      },
      onCancel: () => {
        if (required) {
          vant?.Toast?.fail('签名是必填项');
        }
      }
    });
  },
  
  // 工具方法
  generateId() {
    return 'sig_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  // 清理
  destroy() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.hasSignature = false;
  }
};

// 导出
window.SignaturePad = SignaturePad;
