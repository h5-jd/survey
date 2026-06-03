/**
 * 水印相机模块 - v3.0
 * 自动获取GPS、叠加水印、拍照预览
 */
const WatermarkCamera = {
  // GPS缓存（5分钟内不重复请求）
  gpsCache: {
    position: null,
    timestamp: 0,
    validDuration: 5 * 60 * 1000 // 5分钟
  },

  // 公司信息
  COMPANY_NAME: '珠海聚达建筑工程有限公司',

  // 获取GPS位置（带缓存）
  async getGPSPosition() {
    const now = Date.now();
    
    // 检查缓存
    if (this.gpsCache.position && 
        (now - this.gpsCache.timestamp) < this.gpsCache.validDuration) {
      return this.gpsCache.position;
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null, address: '定位不可用' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6),
            accuracy: position.coords.accuracy,
            address: '定位中...'
          };
          
          // 缓存位置
          this.gpsCache.position = pos;
          this.gpsCache.timestamp = now;
          
          // 尝试逆编码获取地址（异步，不阻塞）
          this.reverseGeocode(pos.lat, pos.lng).then(address => {
            pos.address = address;
            this.gpsCache.position.address = address;
          }).catch(() => {});
          
          resolve(pos);
        },
        (error) => {
          console.warn('GPS获取失败:', error);
          let msg = '定位失败';
          switch (error.code) {
            case 1: msg = '定位权限被拒绝'; break;
            case 2: msg = '定位失败'; break;
            case 3: msg = '定位超时'; break;
          }
          resolve({ lat: null, lng: null, address: msg });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  },

  // 逆地理编码（使用百度地图API）
  async reverseGeocode(lat, lng) {
    try {
      const response = await fetch(
        `https://api.map.baidu.com/reverse_geocoding/v3/?ak=YOUR_AK&location=${lat},${lng}&output=json&pois=0`,
        { method: 'GET' }
      );
      const data = await response.json();
      if (data.status === 0 && data.result) {
        return data.result.formatted_address || data.result.addressComponent?.district || '未知位置';
      }
    } catch (e) {
      // 静默失败，使用经纬度显示
    }
    return `${lat}, ${lng}`;
  },

  // 格式化时间
  formatTimestamp(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const i = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${i}`;
  },

  // 在Canvas上绘制带水印的图片
  async watermarkedImage(originalDataUrl, options = {}) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸（原图尺寸）
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 水印配置
        const waterConfig = {
          // 水印区域高度（原图高度10%，最小60px，最大120px）
          waterHeight: Math.max(60, Math.min(120, Math.floor(img.height * 0.12))),
          // 内边距
          padding: Math.floor(img.width * 0.02),
          // 字体大小（根据图片宽度比例）
          fontSize: Math.max(12, Math.floor(img.width * 0.025)),
          // 行高
          lineHeight: 1.5,
          // 文字颜色
          textColor: 'rgba(255, 255, 255, 0.95)',
          // 阴影颜色
          shadowColor: 'rgba(0, 0, 0, 0.5)',
          // 背景色（半透明白底）
          bgColor: 'rgba(255, 255, 255, 0.85)',
          // 边框颜色
          borderColor: 'rgba(200, 200, 200, 0.3)'
        };
        
        // 计算水印区域起始Y
        const waterY = img.height - waterConfig.waterHeight;
        
        // 绘制水印背景
        ctx.fillStyle = waterConfig.bgColor;
        ctx.fillRect(0, waterY, img.width, waterConfig.waterHeight);
        
        // 绘制顶部边框线
        ctx.strokeStyle = waterConfig.borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, waterY);
        ctx.lineTo(img.width, waterY);
        ctx.stroke();
        
        // 设置文字样式
        ctx.fillStyle = waterConfig.textColor;
        ctx.shadowColor = waterConfig.shadowColor;
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // 计算水印文字位置（居中，宽度约占80%）
        const contentWidth = img.width * 0.8;
        const startX = (img.width - contentWidth) / 2;
        const endX = startX + contentWidth;
        let currentY = waterY + waterConfig.padding + waterConfig.fontSize;
        const textStartX = startX + 10;
        
        // 绘制公司名称（第一行，加粗）
        ctx.font = `bold ${waterConfig.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'left';
        const companyText = `【${this.COMPANY_NAME}】`;
        ctx.fillText(companyText, textStartX, currentY);
        
        // 第二行：时间 + GPS
        currentY += waterConfig.fontSize * waterConfig.lineHeight;
        ctx.font = `${waterConfig.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const timeText = `📍 ${options.timestamp || this.formatTimestamp()}`;
        const gpsText = options.gps ? `${options.gps.lat || ''}, ${options.gps.lng || ''}` : '定位中...';
        ctx.fillText(`${timeText}  ${gpsText}`, textStartX, currentY);
        
        // 第三行：项目 + 姓名
        currentY += waterConfig.fontSize * waterConfig.lineHeight;
        ctx.font = `${waterConfig.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const projectText = options.projectName ? `📋 ${options.projectName}` : '📋 独立拍照';
        const employeeText = options.employeeName ? `👤 ${options.employeeName}` : '';
        ctx.fillText(`${projectText}  ${employeeText}`, textStartX, currentY);
        
        // 重置阴影
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // 导出带水印的图片
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = originalDataUrl;
    });
  },

  // 拍照并返回带水印的图片
  async capture(options = {}) {
    return new Promise((resolve, reject) => {
      // 创建隐藏的文件输入框
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.style.display = 'none';
      document.body.appendChild(input);
      
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          document.body.removeChild(input);
          reject(new Error('未选择图片'));
          return;
        }
        
        // 读取文件为base64
        const reader = new FileReader();
        reader.onload = async (event) => {
          const originalDataUrl = event.target.result;
          
          // 获取GPS
          const gps = await this.getGPSPosition();
          
          // 添加水印
          const watermarkedDataUrl = await this.watermarkedImage(originalDataUrl, {
            timestamp: this.formatTimestamp(),
            gps: gps,
            projectName: options.projectName || null,
            employeeName: options.employeeName || null,
            ...options
          });
          
          // 清理
          document.body.removeChild(input);
          
          // 返回结果
          resolve({
            original: originalDataUrl,
            watermarked: watermarkedDataUrl,
            gps: gps,
            timestamp: this.formatTimestamp(),
            file: file,
            fileName: file.name
          });
        };
        reader.onerror = () => {
          document.body.removeChild(input);
          reject(new Error('读取图片失败'));
        };
        reader.readAsDataURL(file);
      };
      
      input.oncancel = () => {
        document.body.removeChild(input);
        reject(new Error('取消拍照'));
      };
      
      // 触发点击
      input.click();
    });
  },

  // 生成缩略图
  async generateThumbnail(dataUrl, maxWidth = 200) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算缩放比例
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  },

  // 打开水印相机UI（带预览和确认）
  async openCameraWithUI(options = {}) {
    return new Promise((resolve, reject) => {
      // 获取用户和项目信息
      const user = Store?.getCurrentUser?.() || {};
      const project = options.project || {};
      
      // 创建相机UI容器
      const container = document.createElement('div');
      container.className = 'watermark-camera-overlay';
      container.innerHTML = `
        <div class="watermark-camera-modal">
          <div class="camera-header">
            <span class="camera-close">×</span>
            <span class="camera-title">📷 水印相机</span>
            <span class="camera-tip">拍照自动加水印</span>
          </div>
          <div class="camera-info">
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value">${user.name || '未登录'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">项目</span>
              <span class="info-value">${project.customerName || '独立拍照'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">GPS</span>
              <span class="info-value gps-value">正在获取定位...</span>
            </div>
          </div>
          <div class="camera-actions">
            <button class="camera-btn capture-btn">
              <span class="camera-icon">📷</span>
              <span>拍照</span>
            </button>
          </div>
          <div class="camera-preview" style="display: none;">
            <img class="preview-image" src="" alt="预览">
            <div class="preview-actions">
              <button class="preview-btn retake-btn">🔄 重拍</button>
              <button class="preview-btn confirm-btn">✅ 确认</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(container);
      
      // 获取GPS
      this.getGPSPosition().then(gps => {
        const gpsEl = container.querySelector('.gps-value');
        if (gpsEl) {
          if (gps.lat) {
            gpsEl.textContent = `${gps.lat}, ${gps.lng}`;
          } else {
            gpsEl.textContent = gps.address || '定位失败';
          }
        }
      });
      
      // 当前捕获的数据
      let capturedData = null;
      
      // 关闭按钮
      container.querySelector('.camera-close').onclick = () => {
        document.body.removeChild(container);
        reject(new Error('取消拍照'));
      };
      
      // 拍照按钮
      container.querySelector('.capture-btn').onclick = async () => {
        try {
          const result = await this.capture({
            employeeName: user.name,
            projectName: project.customerName || null,
            projectId: project.id,
            stage: options.stage || 'general'
          });
          
          capturedData = result;
          
          // 显示预览
          container.querySelector('.preview-image').src = result.watermarked;
          container.querySelector('.camera-preview').style.display = 'block';
          container.querySelector('.camera-actions').style.display = 'none';
          container.querySelector('.camera-info').style.display = 'none';
        } catch (error) {
          if (error.message !== '取消拍照') {
            console.error('拍照失败:', error);
            // 可以显示toast提示
          }
        }
      };
      
      // 重拍按钮
      container.querySelector('.retake-btn').onclick = async () => {
        container.querySelector('.camera-preview').style.display = 'none';
        container.querySelector('.camera-actions').style.display = 'block';
        container.querySelector('.camera-info').style.display = 'flex';
        capturedData = null;
        
        // 重新获取GPS
        const gps = await this.getGPSPosition();
        const gpsEl = container.querySelector('.gps-value');
        if (gpsEl) {
          if (gps.lat) {
            gpsEl.textContent = `${gps.lat}, ${gps.lng}`;
          } else {
            gpsEl.textContent = gps.address || '定位失败';
          }
        }
        
        // 再次点击拍照
        container.querySelector('.capture-btn').click();
      };
      
      // 确认按钮
      container.querySelector('.confirm-btn').onclick = () => {
        document.body.removeChild(container);
        resolve(capturedData);
      };
    });
  }
};

// 导出
window.WatermarkCamera = WatermarkCamera;
