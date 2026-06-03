/**
 * 录像+水印模块 - v4.0
 * 支持30秒短视频录制、实时水印叠加、IndexedDB存储
 */
const VideoCamera = {
  // 配置
  MAX_DURATION: 30000, // 30秒
  VIDEO_BITRATE: 1000000, // 1Mbps
  THUMBNAIL_TIMING: 0, // 第0秒截取缩略图
  
  // 状态
  isRecording: false,
  mediaStream: null,
  mediaRecorder: null,
  videoChunks: [],
  startTime: null,
  timerInterval: null,
  canvasStream: null,
  
  // 水印配置
  WATERMARK_CONFIG: {
    fontSize: 16,
    lineHeight: 1.6,
    padding: 10,
    bgColor: 'rgba(0, 0, 0, 0.6)',
    textColor: 'rgba(255, 255, 255, 0.95)'
  },
  
  // 公司信息
  COMPANY_NAME: '珠海聚达建筑工程有限公司',
  
  // 初始化
  init() {
    this.checkSupport();
    console.log('VideoCamera: 录像+水印模块初始化完成');
    return this;
  },
  
  // 检查浏览器支持
  checkSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('VideoCamera: 浏览器不支持录像功能');
      return false;
    }
    if (!window.MediaRecorder) {
      console.warn('VideoCamera: 浏览器不支持MediaRecorder');
      return false;
    }
    return true;
  },
  
  // 打开录像UI
  async openVideoRecorder(options = {}) {
    const {
      projectId,
      stepIndex,
      projectName,
      employeeName,
      onConfirm,
      onCancel
    } = options;
    
    // 检查支持
    if (!this.checkSupport()) {
      vant?.Toast?.fail('您的浏览器不支持录像功能');
      return;
    }
    
    // 创建UI
    const container = document.createElement('div');
    container.className = 'video-recorder-overlay';
    container.innerHTML = `
      <div class="video-recorder-modal">
        <div class="video-recorder-header">
          <span class="video-close">×</span>
          <span class="video-title">🎬 施工录像</span>
          <span class="video-hint">限时30秒</span>
        </div>
        
        <!-- 视频预览区域 -->
        <div class="video-preview-container">
          <video class="video-preview" autoplay muted playsinline></video>
          <canvas class="video-watermark-canvas" style="display: none;"></canvas>
          <canvas class="video-output-canvas" style="display: none;"></canvas>
          
          <!-- 水印层 -->
          <div class="video-watermark-overlay">
            <div class="watermark-line company-name"></div>
            <div class="watermark-line timestamp"></div>
            <div class="watermark-line location"></div>
          </div>
          
          <!-- 录制指示器 -->
          <div class="recording-indicator" style="display: none;">
            <span class="rec-dot"></span>
            <span class="rec-time">00:00</span>
          </div>
        </div>
        
        <div class="video-recorder-footer">
          <button class="video-btn-cancel">取消</button>
          <button class="video-btn-record">
            <span class="record-ring"></span>
          </button>
          <button class="video-btn-done" style="display: none;">完成</button>
        </div>
        
        <!-- 预览区域 -->
        <div class="video-playback" style="display: none;">
          <video class="playback-video" controls playsinline></video>
          <div class="playback-actions">
            <button class="playback-btn re-record">🔄 重录</button>
            <button class="playback-btn confirm-save">✅ 确认保存</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // 元素引用
    const elements = {
      container,
      closeBtn: container.querySelector('.video-close'),
      cancelBtn: container.querySelector('.video-btn-cancel'),
      recordBtn: container.querySelector('.video-btn-record'),
      doneBtn: container.querySelector('.video-btn-done'),
      videoPreview: container.querySelector('.video-preview'),
      watermarkCanvas: container.querySelector('.video-watermark-canvas'),
      outputCanvas: container.querySelector('.video-output-canvas'),
      watermarkOverlay: container.querySelector('.video-watermark-overlay'),
      recordingIndicator: container.querySelector('.recording-indicator'),
      recTime: container.querySelector('.rec-time'),
      playback: container.querySelector('.video-playback'),
      playbackVideo: container.querySelector('.playback-video'),
      reRecordBtn: container.querySelector('.re-record'),
      confirmSaveBtn: container.querySelector('.confirm-save'),
      companyNameEl: container.querySelector('.company-name'),
      timestampEl: container.querySelector('.timestamp'),
      locationEl: container.querySelector('.location')
    };
    
    // 当前录像数据
    let currentRecording = null;
    let videoBlob = null;
    let mediaRecorder = null;
    let canvasStream = null;
    let animationId = null;
    
    // 更新时间戳显示
    const updateTimestamp = () => {
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      elements.timestampEl.textContent = timeStr;
    };
    updateTimestamp();
    setInterval(updateTimestamp, 1000);
    
    // 格式化时间
    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    // 获取摄像头并显示预览
    const startPreview = async () => {
      try {
        // 获取摄像头流
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'environment'
          },
          audio: true
        });
        
        this.mediaStream = videoStream;
        
        // 显示预览
        elements.videoPreview.srcObject = videoStream;
        elements.videoPreview.style.display = 'block';
        
        // 设置水印信息
        elements.companyNameEl.textContent = `【${this.COMPANY_NAME}】`;
        elements.locationEl.textContent = `${projectName || '独立录像'} · ${employeeName || '员工'}`;
        
      } catch (error) {
        console.error('VideoCamera: 无法访问摄像头', error);
        vant?.Toast?.fail('无法访问摄像头，请检查权限');
        closeRecorder();
      }
    };
    
    // 开始录像
    const startRecording = async () => {
      if (this.isRecording || !this.mediaStream) return;
      
      try {
        // 创建Canvas用于合并水印
        const video = elements.videoPreview;
        const canvas = elements.watermarkCanvas;
        const ctx = canvas.getContext('2d');
        
        // 设置Canvas尺寸与视频一致
        const updateCanvasSize = () => {
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
        };
        updateCanvasSize();
        video.addEventListener('loadedmetadata', updateCanvasSize);
        
        // 合并流（视频+水印）
        const ctx2d = canvas.getContext('2d');
        
        // 创建新的合成流
        const canvasStream = canvas.captureStream(30);
        
        // 添加音频轨道
        if (this.mediaStream.getAudioTracks().length > 0) {
          canvasStream.addTrack(this.mediaStream.getAudioTracks()[0]);
        }
        
        // 绘制帧
        const drawFrame = () => {
          if (!this.isRecording) return;
          
          // 绘制视频帧
          ctx2d.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // 绘制水印
          this.drawWatermark(ctx2d, canvas.width, canvas.height);
          
          animationId = requestAnimationFrame(drawFrame);
        };
        
        // 录制合成流
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';
        
        videoBlob = [];
        
        mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: this.VIDEO_BITRATE
        });
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoBlob.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(videoBlob, { type: mimeType });
          const videoUrl = URL.createObjectURL(blob);
          
          currentRecording = {
            blob,
            videoUrl,
            duration: Date.now() - this.startTime,
            projectId,
            stepIndex
          };
          
          // 显示预览
          elements.playback.style.display = 'block';
          elements.playbackVideo.src = videoUrl;
          elements.videoPreview.style.display = 'none';
          elements.watermarkOverlay.style.display = 'none';
          elements.recordingIndicator.style.display = 'none';
          
          // 生成缩略图
          this.generateThumbnail(blob).then(thumbnail => {
            currentRecording.thumbnail = thumbnail;
          });
        };
        
        this.isRecording = true;
        this.startTime = Date.now();
        
        // 开始绘制
        drawFrame();
        
        // 开始录制
        mediaRecorder.start(100);
        
        // 启动计时器
        elements.recordingIndicator.style.display = 'flex';
        elements.recordBtn.querySelector('.record-ring').classList.add('recording');
        
        this.timerInterval = setInterval(() => {
          const elapsed = Date.now() - this.startTime;
          elements.recTime.textContent = formatTime(elapsed);
          
          if (elapsed >= this.MAX_DURATION) {
            stopRecording();
          }
        }, 100);
        
      } catch (error) {
        console.error('VideoCamera: 开始录像失败', error);
        vant?.Toast?.fail('录像失败');
      }
    };
    
    // 停止录像
    const stopRecording = () => {
      if (!this.isRecording) return;
      
      this.isRecording = false;
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      
      elements.recordBtn.querySelector('.record-ring').classList.remove('recording');
    };
    
    // 关闭录像机
    const closeRecorder = () => {
      stopRecording();
      
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      document.body.removeChild(container);
      
      if (onCancel) onCancel();
    };
    
    // 绘制水印到Canvas
    this.drawWatermark = (ctx, width, height) => {
      const config = this.WATERMARK_CONFIG;
      
      // 水印区域高度
      const waterHeight = Math.max(60, Math.min(80, Math.floor(height * 0.1)));
      const waterY = height - waterHeight;
      
      // 绘制半透明背景
      ctx.fillStyle = config.bgColor;
      ctx.fillRect(0, waterY, width, waterHeight);
      
      // 绘制顶部边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      ctx.lineTo(width, waterY);
      ctx.stroke();
      
      // 设置文字样式
      ctx.fillStyle = config.textColor;
      ctx.font = `bold ${config.fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      
      const padding = config.padding;
      let currentY = waterY + config.fontSize + 4;
      
      // 第一行：公司名称
      ctx.fillText(`【${this.COMPANY_NAME}】`, padding, currentY);
      
      // 第二行：时间戳
      currentY += config.fontSize * config.lineHeight;
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      ctx.font = `${config.fontSize - 2}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(`📹 ${timeStr}`, padding, currentY);
      
      // 第三行：项目+员工
      currentY += config.fontSize * config.lineHeight;
      ctx.fillText(`📋 ${projectName || '独立录像'}  👤 ${employeeName || '员工'}`, padding, currentY);
    };
    
    // 事件绑定
    elements.closeBtn.onclick = closeRecorder;
    elements.cancelBtn.onclick = closeRecorder;
    
    elements.recordBtn.onclick = () => {
      if (this.isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    };
    
    // 完成按钮
    elements.confirmSaveBtn.onclick = async () => {
      if (!currentRecording) return;
      
      elements.confirmSaveBtn.textContent = '保存中...';
      elements.confirmSaveBtn.disabled = true;
      
      try {
        // 获取GPS
        const gps = await WatermarkCamera.getGPSPosition();
        
        const videoData = {
          blob: currentRecording.blob,
          videoUrl: currentRecording.videoUrl,
          thumbnail: currentRecording.thumbnail,
          duration: currentRecording.duration,
          projectId,
          stepIndex,
          watermarked: true,
          gpsLat: gps.lat,
          gpsLng: gps.lng,
          timestamp: new Date().toISOString(),
          employeeId: Store?.getCurrentUser?.()?.id,
          employeeName: employeeName || Store?.getCurrentUser?.()?.name
        };
        
        const savedVideo = await this.saveVideo(videoData);
        
        document.body.removeChild(container);
        
        if (onConfirm) {
          onConfirm(savedVideo);
        }
        
        vant?.Toast?.success('录像保存成功');
      } catch (error) {
        console.error('VideoCamera: 保存失败', error);
        vant?.Toast?.fail('保存失败');
        elements.confirmSaveBtn.textContent = '确认保存';
        elements.confirmSaveBtn.disabled = false;
      }
    };
    
    // 重录
    elements.reRecordBtn.onclick = () => {
      currentRecording = null;
      videoBlob = [];
      
      elements.playback.style.display = 'none';
      elements.videoPreview.style.display = 'block';
      elements.watermarkOverlay.style.display = 'block';
      elements.recordBtn.style.display = 'block';
      elements.doneBtn.style.display = 'none';
      
      // 重新获取摄像头
      startPreview();
    };
    
    // 初始化
    startPreview();
    
    return container;
  },
  
  // 保存视频到IndexedDB
  async saveVideo(data) {
    const video = {
      id: this.generateId(),
      projectId: data.projectId || null,
      stepIndex: data.stepIndex ?? null,
      videoBlob: data.blob,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnail,
      duration: data.duration || 0,
      watermarked: data.watermarked !== false,
      gpsLat: data.gpsLat,
      gpsLng: data.gpsLng,
      timestamp: data.timestamp || new Date().toISOString(),
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      syncStatus: navigator.onLine ? 'synced' : 'pending'
    };
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        const addRequest = store.add(video);
        
        addRequest.onsuccess = () => {
          // 添加到同步队列
          if (!navigator.onLine) {
            OfflineSync?.addToQueue?.('video', 'create', {
              id: video.id,
              projectId: video.projectId
            });
          }
          resolve(video);
        };
        
        addRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 生成缩略图（首帧）
  async generateThumbnail(videoBlob) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadeddata = () => {
        video.currentTime = 0.1; // 跳到0.1秒确保有画面
      };
      
      video.onseeked = () => {
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 添加播放图标
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制播放三角
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 10, canvas.height / 2 - 15);
        ctx.lineTo(canvas.width / 2 - 10, canvas.height / 2 + 15);
        ctx.lineTo(canvas.width / 2 + 15, canvas.height / 2);
        ctx.closePath();
        ctx.fill();
        
        resolve(canvas.toDataURL('image/jpeg', 0.7));
        URL.revokeObjectURL(video.src);
      };
      
      video.onerror = () => {
        resolve(null);
      };
      
      video.src = URL.createObjectURL(videoBlob);
    });
  },
  
  // 获取项目的视频
  async getVideosByProject(projectId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const videos = (request.result || []).filter(v => v.projectId === projectId);
          videos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          resolve(videos);
        };
        
        request.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取步骤的视频
  async getVideosByStep(projectId, stepIndex) {
    const videos = await this.getVideosByProject(projectId);
    return videos.filter(v => v.stepIndex === stepIndex);
  },
  
  // 删除视频
  async deleteVideo(videoId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readwrite');
        const store = transaction.objectStore('videos');
        const deleteRequest = store.delete(videoId);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取视频存储统计
  async getVideoStorageStats() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videos'], 'readonly');
        const store = transaction.objectStore('videos');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const videos = request.result || [];
          let totalSize = 0;
          
          videos.forEach(v => {
            if (v.videoBlob) {
              totalSize += v.videoBlob.size;
            }
          });
          
          resolve({
            count: videos.length,
            totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            isWarning: totalSize > 500 * 1024 * 1024 // 500MB警告
          });
        };
        
        request.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 工具方法
  generateId() {
    return 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
};

// 导出
window.VideoCamera = VideoCamera;
