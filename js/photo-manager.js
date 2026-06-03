/**
 * 照片管理模块 - v3.0
 * 使用IndexedDB存储照片，支持按项目/日期/员工查询
 */
const PhotoManager = {
  // 数据库配置
  DB_NAME: 'juda_photos_db',
  DB_VERSION: 1,
  STORE_NAME: 'photos',

  // 数据库实例
  db: null,

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      // 数据库升级事件
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 如果存储表已存在，删除重建
        if (db.objectStoreNames.contains(this.STORE_NAME)) {
          db.deleteObjectStore(this.STORE_NAME);
        }

        // 创建存储表
        const store = db.createObjectStore(this.STORE_NAME, { 
          keyPath: 'id',
          autoIncrement: false
        });

        // 创建索引
        store.createIndex('projectId', 'projectId', { unique: false });
        store.createIndex('employeeId', 'employeeId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('stage', 'stage', { unique: false });

        console.log('PhotoManager: 数据库初始化完成');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('PhotoManager: 数据库初始化失败', event.target.error);
        reject(event.target.error);
      };
    });
  },

  // 添加照片
  async addPhoto(photoData) {
    await this.init();
    
    const photo = {
      id: photoData.id || this.generateId(),
      url: photoData.url,              // 完整base64图片
      thumbnail: photoData.thumbnail, // 缩略图
      projectId: photoData.projectId || null,
      projectName: photoData.projectName || null,
      employeeId: photoData.employeeId || null,
      employeeName: photoData.employeeName || null,
      employeeRole: photoData.employeeRole || null,
      timestamp: photoData.timestamp || new Date().toISOString(),
      date: photoData.date || this.formatDate(),
      time: photoData.time || this.formatTime(),
      gpsLat: photoData.gpsLat || null,
      gpsLng: photoData.gpsLng || null,
      gpsAddress: photoData.gpsAddress || null,
      stage: photoData.stage || 'general',  // 勘察/施工/验收
      stepName: photoData.stepName || null,
      watermarked: photoData.watermarked !== false,
      tags: photoData.tags || [],
      remark: photoData.remark || '',
      createTime: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.add(photo);

      request.onsuccess = () => {
        console.log('PhotoManager: 照片添加成功', photo.id);
        resolve(photo);
      };

      request.onerror = (event) => {
        console.error('PhotoManager: 照片添加失败', event.target.error);
        reject(event.target.error);
      };
    });
  },

  // 获取单张照片
  async getPhoto(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 按项目查询照片
  async getPhotosByProject(projectId) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 按员工查询照片
  async getPhotosByEmployee(employeeId) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('employeeId');
      const request = index.getAll(employeeId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 按日期查询照片
  async getPhotosByDate(date) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('date');
      const request = index.getAll(date);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 按日期范围查询
  async getPhotosByDateRange(startDate, endDate) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result || []).filter(photo => {
          return photo.date >= startDate && photo.date <= endDate;
        });
        // 按时间倒序
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(results);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 获取全部照片
  async getAllPhotos() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // 按时间倒序
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(results);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 删除照片
  async deletePhoto(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('PhotoManager: 照片删除成功', id);
        resolve(true);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 删除项目全部照片
  async deletePhotosByProject(projectId) {
    const photos = await this.getPhotosByProject(projectId);
    for (const photo of photos) {
      await this.deletePhoto(photo.id);
    }
    return photos.length;
  },

  // 获取照片统计
  async getPhotoStats() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const photos = request.result || [];
        
        // 计算统计
        const stats = {
          total: photos.length,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          byProject: {},
          byEmployee: {},
          byDate: {},
          byStage: {}
        };

        const today = this.formatDate();
        const weekAgo = this.getDateDaysAgo(7);
        const monthAgo = this.getDateDaysAgo(30);

        photos.forEach(photo => {
          // 按日期统计
          if (photo.date === today) stats.today++;
          if (photo.date >= weekAgo) stats.thisWeek++;
          if (photo.date >= monthAgo) stats.thisMonth++;

          // 按项目统计
          if (photo.projectId) {
            if (!stats.byProject[photo.projectId]) {
              stats.byProject[photo.projectId] = { count: 0, name: photo.projectName, photos: [] };
            }
            stats.byProject[photo.projectId].count++;
            stats.byProject[photo.projectId].photos.push(photo);
          }

          // 按员工统计
          if (photo.employeeId) {
            if (!stats.byEmployee[photo.employeeId]) {
              stats.byEmployee[photo.employeeId] = { count: 0, name: photo.employeeName, role: photo.employeeRole, photos: [] };
            }
            stats.byEmployee[photo.employeeId].count++;
            stats.byEmployee[photo.employeeId].photos.push(photo);
          }

          // 按日期统计（按天）
          if (!stats.byDate[photo.date]) {
            stats.byDate[photo.date] = { count: 0, photos: [] };
          }
          stats.byDate[photo.date].count++;
          stats.byDate[photo.date].photos.push(photo);

          // 按阶段统计
          if (!stats.byStage[photo.stage]) {
            stats.byStage[photo.stage] = { count: 0, photos: [] };
          }
          stats.byStage[photo.stage].count++;
          stats.byStage[photo.stage].photos.push(photo);
        });

        resolve(stats);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 导出项目全部照片（生成ZIP需要额外库，这里返回照片数据列表）
  async exportProjectPhotos(projectId) {
    const photos = await this.getPhotosByProject(projectId);
    return {
      projectId,
      projectName: photos[0]?.projectName || '未知项目',
      exportTime: new Date().toISOString(),
      total: photos.length,
      photos: photos.map(p => ({
        id: p.id,
        timestamp: p.timestamp,
        stage: p.stage,
        stepName: p.stepName,
        gps: p.gpsLat ? `${p.gpsLat},${p.gpsLng}` : null
        // 注意：实际base64数据可能很大，需要时可单独处理
      }))
    };
  },

  // 搜索照片
  async searchPhotos(keyword) {
    await this.init();
    
    const keywordLower = keyword.toLowerCase();
    const photos = await this.getAllPhotos();
    
    return photos.filter(photo => {
      return (
        (photo.projectName && photo.projectName.toLowerCase().includes(keywordLower)) ||
        (photo.employeeName && photo.employeeName.toLowerCase().includes(keywordLower)) ||
        (photo.stepName && photo.stepName.toLowerCase().includes(keywordLower)) ||
        (photo.date && photo.date.includes(keyword)) ||
        (photo.tags && photo.tags.some(tag => tag.toLowerCase().includes(keywordLower)))
      );
    });
  },

  // 更新照片信息
  async updatePhoto(id, updates) {
    await this.init();
    
    const photo = await this.getPhoto(id);
    if (!photo) return null;
    
    const updatedPhoto = { ...photo, ...updates, updateTime: new Date().toISOString() };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(updatedPhoto);

      request.onsuccess = () => {
        resolve(updatedPhoto);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // 清除全部照片（谨慎使用）
  async clearAll() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('PhotoManager: 全部照片已清除');
        resolve(true);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  // ========== 工具方法 ==========
  
  generateId() {
    return 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  formatDate(date = new Date()) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  formatTime(date = new Date()) {
    const d = new Date(date);
    const h = String(d.getHours()).padStart(2, '0');
    const i = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    return `${h}:${i}:${s}`;
  },

  getDateDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return this.formatDate(d);
  },

  // 获取数据库大小估算
  async getStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
        quota: estimate.quota,
        quotaMB: (estimate.quota / 1024 / 1024).toFixed(2)
      };
    }
    return null;
  }
};

// 导出
window.PhotoManager = PhotoManager;
