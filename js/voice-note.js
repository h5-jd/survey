/**
 * 语音备注模块 - v4.0
 * 支持录音、语音转文字、离线存储
 */
const VoiceNote = {
  // 配置
  MAX_DURATION: 60000, // 60秒
  SAMPLE_RATE: 44100,
  
  // 状态
  isRecording: false,
  isPaused: false,
  mediaRecorder: null,
  audioChunks: [],
  startTime: null,
  timerInterval: null,
  
  // DOM元素（录音中创建）
  recorderUI: null,
  
  // 初始化
  init() {
    this.checkSupport();
    console.log('VoiceNote: 语音备注模块初始化完成');
    return this;
  },
  
  // 检查浏览器支持
  checkSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('VoiceNote: 浏览器不支持录音功能');
      return false;
    }
    return true;
  },
  
  // 开始录音
  async startRecording(options = {}) {
    if (this.isRecording) {
      console.warn('VoiceNote: 正在录音中');
      return null;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: this.SAMPLE_RATE
        }
      });
      
      // 使用MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const duration = Date.now() - this.startTime;
        
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());
        
        // 创建Audio URL
        const audioUrl = URL.createObjectURL(blob);
        
        // 回调
        if (options.onStop) {
          options.onStop({ blob, audioUrl, duration });
        }
        
        this.cleanup();
      };
      
      this.mediaRecorder.onerror = (error) => {
        console.error('VoiceNote: 录音错误', error);
        this.cleanup();
        if (options.onError) {
          options.onError(error);
        }
      };
      
      // 开始录音
      this.mediaRecorder.start(100); // 每100ms采集一次
      this.isRecording = true;
      this.startTime = Date.now();
      
      // 启动计时器
      this.timerInterval = setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        if (options.onProgress) {
          options.onProgress({
            elapsed,
            remaining: Math.max(0, this.MAX_DURATION - elapsed),
            isExpiring: elapsed > this.MAX_DURATION * 0.8
          });
        }
        
        // 超时自动停止
        if (elapsed >= this.MAX_DURATION) {
          this.stopRecording(options);
        }
      }, 100);
      
      if (options.onStart) {
        options.onStart();
      }
      
      return true;
    } catch (error) {
      console.error('VoiceNote: 无法访问麦克风', error);
      if (options.onError) {
        options.onError(error);
      }
      return null;
    }
  },
  
  // 停止录音
  stopRecording(options = {}) {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }
    
    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (options.onBeforeStop) {
      options.onBeforeStop();
    }
  },
  
  // 清理资源
  cleanup() {
    this.isRecording = false;
    this.isPaused = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.startTime = null;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },
  
  // 显示录音UI
  showRecorderUI(options = {}) {
    const {
      projectId,
      stepIndex,
      onConfirm,
      onCancel,
      employeeId,
      employeeName
    } = options;
    
    // 创建UI容器
    const container = document.createElement('div');
    container.className = 'voice-recorder-overlay';
    container.innerHTML = `
      <div class="voice-recorder-modal">
        <div class="voice-recorder-header">
          <span class="voice-close">×</span>
          <span class="voice-title">🎙️ 语音备注</span>
          <span class="voice-hint">最长60秒</span>
        </div>
        
        <div class="voice-recorder-body">
          <!-- 波形动画 -->
          <div class="waveform-container">
            <canvas class="waveform-canvas" width="280" height="60"></canvas>
          </div>
          
          <!-- 计时器 -->
          <div class="voice-timer">
            <span class="timer-value">00:00</span>
            <span class="timer-max">/ 01:00</span>
          </div>
          
          <!-- 状态文字 -->
          <div class="voice-status">点击开始录音</div>
        </div>
        
        <div class="voice-recorder-footer">
          <button class="voice-btn-cancel">取消</button>
          <button class="voice-btn-record">
            <span class="record-icon">🎤</span>
          </button>
          <button class="voice-btn-done" style="display: none;">完成</button>
        </div>
        
        <!-- 预览区域 -->
        <div class="voice-preview" style="display: none;">
          <audio class="preview-audio" controls></audio>
          <div class="preview-actions">
            <button class="preview-btn re-record">🔄 重录</button>
            <button class="preview-btn confirm-save">✅ 确认</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // 元素引用
    const elements = {
      container,
      closeBtn: container.querySelector('.voice-close'),
      cancelBtn: container.querySelector('.voice-btn-cancel'),
      recordBtn: container.querySelector('.voice-btn-record'),
      doneBtn: container.querySelector('.voice-btn-done'),
      timerValue: container.querySelector('.timer-value'),
      statusText: container.querySelector('.voice-status'),
      waveformCanvas: container.querySelector('.waveform-canvas'),
      preview: container.querySelector('.voice-preview'),
      previewAudio: container.querySelector('.preview-audio'),
      reRecordBtn: container.querySelector('.re-record'),
      confirmSaveBtn: container.querySelector('.confirm-save')
    };
    
    // 音频上下文（用于波形）
    let audioContext = null;
    let analyser = null;
    let dataArray = null;
    let animationId = null;
    
    // 当前录音数据
    let currentRecording = null;
    
    // 格式化时间
    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };
    
    // 绘制波形
    const drawWaveform = () => {
      if (!analyser || !elements.waveformCanvas) return;
      
      const canvas = elements.waveformCanvas;
      const ctx = canvas.getContext('2d');
      const bufferLength = analyser.frequencyBinCount;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        ctx.fillStyle = this.isRecording 
          ? `rgb(25, 137, 250)` 
          : `rgb(200, 200, 200)`;
        
        ctx.fillRect(
          x,
          (canvas.height - barHeight) / 2,
          barWidth - 1,
          barHeight
        );
        
        x += barWidth;
      }
      
      animationId = requestAnimationFrame(drawWaveform);
    };
    
    // 关闭弹窗
    const closeUI = () => {
      if (this.isRecording) {
        this.stopRecording({});
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      document.body.removeChild(container);
      if (onCancel) onCancel();
    };
    
    // 事件绑定
    elements.closeBtn.onclick = closeUI;
    elements.cancelBtn.onclick = closeUI;
    
    // 录音按钮
    elements.recordBtn.onclick = async () => {
      if (!this.isRecording) {
        // 开始录音
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        
        elements.recordBtn.innerHTML = '<span class="record-icon recording">⏹️</span>';
        elements.statusText.textContent = '正在录音...';
        
        await this.startRecording({
          projectId,
          stepIndex,
          onStart: () => {
            drawWaveform();
          },
          onProgress: ({ elapsed, remaining, isExpiring }) => {
            elements.timerValue.textContent = formatTime(elapsed);
            if (isExpiring) {
              elements.timerValue.style.color = '#ee0a24';
            }
          },
          onStop: ({ blob, audioUrl, duration }) => {
            cancelAnimationFrame(animationId);
            stream.getTracks().forEach(track => track.stop());
            if (audioContext) {
              audioContext.close();
              audioContext = null;
            }
            
            currentRecording = { blob, audioUrl, duration };
            
            elements.preview.style.display = 'block';
            elements.previewAudio.src = audioUrl;
            elements.recordBtn.style.display = 'none';
            elements.doneBtn.style.display = 'block';
            elements.statusText.textContent = '录音完成';
          }
        });
      } else {
        // 停止录音
        this.stopRecording({});
      }
    };
    
    // 完成按钮
    elements.doneBtn.onclick = () => {
      if (currentRecording) {
        elements.doneBtn.textContent = '保存中...';
        elements.doneBtn.disabled = true;
        
        this.saveVoiceNote({
          projectId,
          stepIndex,
          blob: currentRecording.blob,
          audioUrl: currentRecording.audioUrl,
          duration: currentRecording.duration,
          employeeId,
          employeeName
        }).then(async (savedNote) => {
          document.body.removeChild(container);
          if (onConfirm) {
            onConfirm(savedNote);
          }
        }).catch(error => {
          console.error('VoiceNote: 保存失败', error);
          elements.doneBtn.textContent = '完成';
          elements.doneBtn.disabled = false;
        });
      }
    };
    
    // 重录
    elements.reRecordBtn.onclick = () => {
      currentRecording = null;
      elements.preview.style.display = 'none';
      elements.recordBtn.style.display = 'block';
      elements.doneBtn.style.display = 'none';
      elements.timerValue.textContent = '00:00';
      elements.timerValue.style.color = '#333';
      elements.statusText.textContent = '点击开始录音';
    };
    
    return container;
  },
  
  // 保存语音备注
  async saveVoiceNote(data) {
    const note = {
      id: this.generateId(),
      projectId: data.projectId || null,
      stepIndex: data.stepIndex ?? null,
      audioBlob: data.blob,
      audioUrl: data.audioUrl,
      duration: data.duration || 0,
      transcript: '', // 初始为空，离线时由语音转文字服务填充
      transcriptStatus: 'pending', // pending | done | failed
      timestamp: new Date().toISOString(),
      employeeId: data.employeeId || Store?.getCurrentUser?.()?.id,
      employeeName: data.employeeName || Store?.getCurrentUser?.()?.name,
      syncStatus: navigator.onLine ? 'synced' : 'pending'
    };
    
    // 存到IndexedDB
    await this.saveToDB(note);
    
    // 如果在线，尝试语音转文字
    if (navigator.onLine) {
      this.transcribeAudio(note).then(result => {
        if (result) {
          note.transcript = result;
          note.transcriptStatus = 'done';
          this.updateInDB(note);
        }
      }).catch(() => {
        note.transcriptStatus = 'failed';
        this.updateInDB(note);
      });
    }
    
    // 添加到同步队列
    if (!navigator.onLine) {
      await OfflineSync?.addToQueue?.('voice', 'create', {
        id: note.id,
        projectId: note.projectId
      });
    }
    
    console.log('VoiceNote: 语音备注已保存', note.id);
    return note;
  },
  
  // 保存到IndexedDB
  async saveToDB(note) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['voice_notes'], 'readwrite');
        const store = transaction.objectStore('voice_notes');
        const addRequest = store.add(note);
        
        addRequest.onsuccess = () => resolve(note);
        addRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 更新IndexedDB中的记录
  async updateInDB(note) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['voice_notes'], 'readwrite');
        const store = transaction.objectStore('voice_notes');
        const putRequest = store.put(note);
        
        putRequest.onsuccess = () => resolve(note);
        putRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 获取语音转文字
  async transcribeAudio(note) {
    // 使用Coze API进行语音转文字
    if (window.CozeAPI && note.audioBlob) {
      try {
        // 将Blob转为base64
        const reader = new FileReader();
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(note.audioBlob);
        });
        
        // 调用Coze语音转文字API
        const result = await CozeAPI.transcribe(base64);
        return result.text || '';
      } catch (error) {
        console.error('VoiceNote: 语音转文字失败', error);
        return null;
      }
    }
    return null;
  },
  
  // 根据项目获取语音备注
  async getVoiceNotesByProject(projectId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['voice_notes'], 'readonly');
        const store = transaction.objectStore('voice_notes');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const notes = (request.result || []).filter(n => n.projectId === projectId);
          notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          resolve(notes);
        };
        
        request.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 根据步骤获取语音备注
  async getVoiceNotesByStep(projectId, stepIndex) {
    const notes = await this.getVoiceNotesByProject(projectId);
    return notes.filter(n => n.stepIndex === stepIndex);
  },
  
  // 删除语音备注
  async deleteVoiceNote(noteId) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('juda_photos_db', 2);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['voice_notes'], 'readwrite');
        const store = transaction.objectStore('voice_notes');
        const deleteRequest = store.delete(noteId);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = (e) => reject(e.target.error);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  },
  
  // 播放语音
  playVoice(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
    return audio;
  },
  
  // 工具方法
  generateId() {
    return 'voice_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }
};

// 导出
window.VoiceNote = VoiceNote;
