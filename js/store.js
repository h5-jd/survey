/**
 * localStorage 数据管理 - 升级版
 * 支持多用户账号、项目分配、操作记录、施工与验收分离
 */
const Store = {
  // 数据键名
  KEYS: {
    PROJECTS: 'juda_projects',
    INSPECTIONS: 'juda_inspections',
    CRAFTS: 'juda_crafts',
    SETTINGS: 'juda_settings',
    USER_INFO: 'juda_user_info',
    QUOTATIONS: 'juda_quotations',
    USERS: 'juda_users',
    OPERATION_LOGS: 'juda_logs'
  },

  // 角色定义
  ROLES: {
    ADMIN: 'admin',        // 管理员（老板）
    SURVEYOR: 'surveyor',  // 勘察员
    WORKER: 'worker',       // 施工员
    REVIEWER: 'reviewer'    // 验收员（新增）
  },

  // 项目状态
  PROJECT_STATUS: {
    PENDING: 'pending',           // 待施工
    IN_PROGRESS: 'in_progress',   // 施工中
    PENDING_REVIEW: 'pending_review', // 待验收
    COMPLETED: 'completed'        // 已完成
  },

  // 步骤状态
  STEP_STATUS: {
    PENDING: 'pending',      // 待施工
    IN_PROGRESS: 'in_progress', // 施工中
    PENDING_REVIEW: 'pending_review', // 待验收（新增）
    APPROVED: 'approved',    // 已验收通过
    REJECTED: 'rejected'     // 验收打回
  },

  // 操作类型
  OP_TYPES: {
    CREATE_PROJECT: 'create_project',
    ASSIGN_PROJECT: 'assign_project',
    COMPLETE_STEP: 'complete_step',
    SUBMIT_REVIEW: 'submit_review',
    UPLOAD_PHOTO: 'upload_photo',
    REVIEW_APPROVE: 'review_approve',
    REVIEW_REJECT: 'review_reject',
    UPDATE_PROJECT: 'update_project'
  },

  // ========== 通用方法 ==========
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`读取${key}失败:`, e);
      return null;
    }
  },

  set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`保存${key}失败:`, e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  // ========== 用户管理 ==========
  getUsers() {
    return this.get(this.KEYS.USERS) || [];
  },

  saveUsers(users) {
    return this.set(this.KEYS.USERS, users);
  },

  // 创建用户（注册）
  createUser(userData) {
    const users = this.getUsers();
    if (users.find(u => u.employeeId === userData.employeeId)) {
      return { success: false, message: '工号已存在' };
    }
    const newUser = {
      id: this.generateId(),
      employeeId: userData.employeeId,
      name: userData.name,
      phone: userData.phone || userData.employeeId,
      role: userData.role || this.ROLES.WORKER,
      password: userData.password || '',
      createTime: new Date().toISOString(),
      status: 'active'
    };
    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  },

  // 用户登录
  login(employeeId, password) {
    const users = this.getUsers();
    const user = users.find(u => u.employeeId === employeeId);
    if (!user) return { success: false, message: '用户不存在' };
    if (user.role === this.ROLES.ADMIN && user.password !== password) {
      return { success: false, message: '密码错误' };
    }
    user.lastLoginTime = new Date().toISOString();
    this.saveUsers(users);
    this.setCurrentUser(user);
    return { success: true, user };
  },

  // 保存当前登录用户
  setCurrentUser(user) {
    const sessionUser = { ...user };
    delete sessionUser.password;
    this.set(this.KEYS.USER_INFO, sessionUser);
  },

  // 获取当前用户
  getCurrentUser() {
    return this.get(this.KEYS.USER_INFO);
  },

  // 退出登录
  logout() {
    this.remove(this.KEYS.USER_INFO);
  },

  // 获取所有员工（排除管理员）
  getEmployees() {
    return this.getUsers().filter(u => u.role !== this.ROLES.ADMIN);
  },

  // 按角色获取员工
  getUsersByRole(role) {
    return this.getUsers().filter(u => u.role === role);
  },

  // 获取员工名称
  getUserName(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.name : '未知';
  },

  // ========== 项目管理 ==========
  getProjects() {
    return this.get(this.KEYS.PROJECTS) || [];
  },

  saveProjects(projects) {
    return this.set(this.KEYS.PROJECTS, projects);
  },

  getProject(id) {
    return this.getProjects().find(p => p.id === id);
  },

  // 创建项目（支持分配）
  createProject(projectData) {
    const projects = this.getProjects();
    const currentUser = this.getCurrentUser();
    const newProject = {
      id: this.generateId(),
      status: this.PROJECT_STATUS.PENDING,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      progress: 0,
      currentStep: 0,
      // 项目分配
      surveyorId: projectData.surveyorId || null,
      surveyorName: projectData.surveyorName || '',
      workerId: projectData.workerId || null,
      workerName: projectData.workerName || '',
      reviewerId: projectData.reviewerId || null,  // 验收员
      reviewerName: projectData.reviewerName || '',
      // 基础信息
      customerName: projectData.customerName || '',
      customerPhone: projectData.customerPhone || '',
      customerAddress: projectData.customerAddress || '',
      buildingType: projectData.buildingType || '',
      buildYear: projectData.buildYear || '',
      leakLocations: projectData.leakLocations || [],
      inspectionFee: projectData.inspectionFee || 'pending',
      // 工艺
      craftType: projectData.craftType || 'wall',
      steps: projectData.steps || [],
      reviewStatus: 'pending',
      operationLogs: []
    };

    // 添加创建记录
    this._addLog(newProject, this.OP_TYPES.CREATE_PROJECT, `创建项目【${newProject.customerName}】`, { address: newProject.customerAddress });
    
    // 分配记录
    if (newProject.surveyorId) {
      this._addLog(newProject, this.OP_TYPES.ASSIGN_PROJECT, `分配勘察员：【${newProject.surveyorName}】`, { assigneeId: newProject.surveyorId, role: 'surveyor' });
    }
    if (newProject.workerId) {
      this._addLog(newProject, this.OP_TYPES.ASSIGN_PROJECT, `分配施工员：【${newProject.workerName}】`, { assigneeId: newProject.workerId, role: 'worker' });
    }
    if (newProject.reviewerId) {
      this._addLog(newProject, this.OP_TYPES.ASSIGN_PROJECT, `分配验收员：【${newProject.reviewerName}】`, { assigneeId: newProject.reviewerId, role: 'reviewer' });
    }

    projects.unshift(newProject);
    this.saveProjects(projects);
    return newProject;
  },

  // 内部方法：添加操作记录
  _addLog(project, type, description, details = {}) {
    const currentUser = this.getCurrentUser();
    project.operationLogs = project.operationLogs || [];
    project.operationLogs.push({
      id: this.generateId(),
      type,
      operatorId: currentUser?.id,
      operatorName: currentUser?.name || '系统',
      operatorRole: currentUser?.role,
      time: new Date().toISOString(),
      description,
      details
    });
  },

  // 更新项目
  updateProject(id, updates) {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updateTime: new Date().toISOString() };
      this.saveProjects(projects);
      return projects[index];
    }
    return null;
  },

  // 删除项目
  deleteProject(id) {
    const projects = this.getProjects();
    this.saveProjects(projects.filter(p => p.id !== id));
  },

  // 根据用户角色获取可见项目
  getVisibleProjects() {
    const projects = this.getProjects();
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];

    switch (currentUser.role) {
      case this.ROLES.ADMIN:
        return projects;
      case this.ROLES.SURVEYOR:
        return projects.filter(p => p.surveyorId === currentUser.id);
      case this.ROLES.WORKER:
        return projects.filter(p => p.workerId === currentUser.id);
      case this.ROLES.REVIEWER:
        return projects.filter(p => p.reviewerId === currentUser.id);
      default:
        return [];
    }
  },

  // 获取待验收项目（验收员视图）
  getPendingReviewProjects() {
    const projects = this.getProjects();
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    
    return projects.filter(p => 
      (p.reviewerId === currentUser.id || currentUser.role === this.ROLES.ADMIN) &&
      p.status === this.PROJECT_STATUS.PENDING_REVIEW
    );
  },

  // 获取员工的项目统计
  getEmployeeStats() {
    const projects = this.getProjects();
    const users = this.getEmployees();
    
    return users.map(user => {
      const userProjects = projects.filter(p => 
        p.surveyorId === user.id || p.workerId === user.id || p.reviewerId === user.id
      );
      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        totalCount: userProjects.length,
        pendingCount: userProjects.filter(p => p.status === this.PROJECT_STATUS.PENDING).length,
        inProgressCount: userProjects.filter(p => p.status === this.PROJECT_STATUS.IN_PROGRESS).length,
        pendingReviewCount: userProjects.filter(p => p.status === this.PROJECT_STATUS.PENDING_REVIEW).length,
        completedCount: userProjects.filter(p => p.status === this.PROJECT_STATUS.COMPLETED).length
      };
    });
  },

  // ========== 勘察记录 ==========
  getInspections() { return this.get(this.KEYS.INSPECTIONS) || []; },
  saveInspections(inspections) { return this.set(this.KEYS.INSPECTIONS, inspections); },
  getInspection(id) { return this.getInspections().find(i => i.id === id); },

  createInspection(inspectionData) {
    const inspections = this.getInspections();
    const currentUser = this.getCurrentUser();
    const newInspection = {
      id: this.generateId(),
      projectId: inspectionData.projectId,
      customerName: inspectionData.customerName || '',
      customerPhone: inspectionData.customerPhone || '',
      customerAddress: inspectionData.customerAddress || '',
      buildingType: inspectionData.buildingType || '',
      buildYear: inspectionData.buildYear || '',
      inspectorId: currentUser?.id,
      inspectorName: currentUser?.name || '员工',
      leakLocations: [],
      photos: [],
      diagnosis: null,
      status: 'draft',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      inspectionFee: 'pending'
    };
    inspections.unshift(newInspection);
    this.saveInspections(inspections);
    if (newInspection.projectId) {
      this.updateProject(newInspection.projectId, { inspectionId: newInspection.id });
    }
    return newInspection;
  },

  updateInspection(id, updates) {
    const inspections = this.getInspections();
    const index = inspections.findIndex(i => i.id === id);
    if (index !== -1) {
      inspections[index] = { ...inspections[index], ...updates, updateTime: new Date().toISOString() };
      this.saveInspections(inspections);
      return inspections[index];
    }
    return null;
  },

  deleteInspection(id) {
    this.saveInspections(this.getInspections().filter(i => i.id !== id));
  },

  // ========== 施工步骤（施工与验收分离）==========
  
  // 施工员提交步骤（变为待验收）
  submitForReview(projectId, stepIndex, data) {
    const project = this.getProject(projectId);
    if (!project) return null;
    
    const currentUser = this.getCurrentUser();
    const steps = [...project.steps];
    steps[stepIndex] = {
      ...steps[stepIndex],
      ...data,
      submitted: true,
      submittedTime: new Date().toISOString(),
      operatorId: currentUser?.id,
      operatorName: currentUser?.name,
      stepStatus: this.STEP_STATUS.PENDING_REVIEW,
      reviewStatus: 'pending'
    };

    // 添加操作记录
    const operationLogs = [...(project.operationLogs || [])];
    operationLogs.push({
      id: this.generateId(),
      type: this.OP_TYPES.SUBMIT_REVIEW,
      operatorId: currentUser?.id,
      operatorName: currentUser?.name,
      operatorRole: currentUser?.role,
      time: new Date().toISOString(),
      stepIndex,
      stepName: steps[stepIndex].stepName,
      description: `【${currentUser?.name}】提交步骤${stepIndex + 1}待验收：${steps[stepIndex].stepName}`
    });

    // 检查是否有待验收步骤
    const hasPendingReview = steps.some((s, i) => i >= stepIndex && s.stepStatus === this.STEP_STATUS.PENDING_REVIEW);
    const updates = {
      steps,
      currentStep: stepIndex + 1,
      status: hasPendingReview ? this.PROJECT_STATUS.PENDING_REVIEW : this.PROJECT_STATUS.IN_PROGRESS,
      operationLogs
    };

    return this.updateProject(projectId, updates);
  },

  // 验收员/管理员审核步骤
  reviewStep(projectId, stepIndex, approved, reviewNote) {
    const project = this.getProject(projectId);
    if (!project) return null;
    
    const currentUser = this.getCurrentUser();
    const steps = [...project.steps];
    steps[stepIndex].reviewStatus = approved ? 'approved' : 'rejected';
    steps[stepIndex].reviewTime = new Date().toISOString();
    steps[stepIndex].reviewNote = reviewNote || '';
    steps[stepIndex].reviewerId = currentUser?.id;
    steps[stepIndex].reviewerName = currentUser?.name;
    
    if (approved) {
      steps[stepIndex].stepStatus = this.STEP_STATUS.APPROVED;
      steps[stepIndex].completed = true;
      steps[stepIndex].completedTime = new Date().toISOString();
    } else {
      steps[stepIndex].stepStatus = this.STEP_STATUS.REJECTED;
      steps[stepIndex].submitted = false;
    }

    // 添加操作记录
    const operationLogs = [...(project.operationLogs || [])];
    operationLogs.push({
      id: this.generateId(),
      type: approved ? this.OP_TYPES.REVIEW_APPROVE : this.OP_TYPES.REVIEW_REJECT,
      operatorId: currentUser?.id,
      operatorName: currentUser?.name,
      operatorRole: currentUser?.role,
      time: new Date().toISOString(),
      stepIndex,
      stepName: steps[stepIndex].stepName,
      description: approved 
        ? `【${currentUser?.name}】验收通过：${steps[stepIndex].stepName}`
        : `【${currentUser?.name}】验收打回：${steps[stepIndex].stepName}（原因：${reviewNote}）`,
      details: { approved, reviewNote }
    });

    // 检查项目状态
    const allApproved = steps.every(s => s.reviewStatus === 'approved');
    const anyRejected = steps.some(s => s.reviewStatus === 'rejected');
    const completedCount = steps.filter(s => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);

    let status = project.status;
    if (allApproved) {
      status = this.PROJECT_STATUS.COMPLETED;
    } else if (anyRejected) {
      status = this.PROJECT_STATUS.IN_PROGRESS;
    }

    const updates = {
      steps,
      progress,
      status,
      reviewStatus: allApproved ? 'approved' : (anyRejected ? 'rejected' : 'pending'),
      operationLogs
    };

    return this.updateProject(projectId, updates);
  },

  // 施工员重新提交被驳回的步骤
  resubmitStep(projectId, stepIndex) {
    const project = this.getProject(projectId);
    if (!project) return null;
    
    const steps = [...project.steps];
    steps[stepIndex].reviewStatus = 'pending';
    steps[stepIndex].stepStatus = this.STEP_STATUS.PENDING_REVIEW;
    
    return this.updateProject(projectId, { steps });
  },

  // 添加照片记录
  addStepPhoto(projectId, stepIndex, photoIndex, photo) {
    const project = this.getProject(projectId);
    if (!project) return null;
    
    const currentUser = this.getCurrentUser();
    const steps = [...project.steps];
    if (!steps[stepIndex].photos) steps[stepIndex].photos = [];
    steps[stepIndex].photos[photoIndex] = photo;
    
    // 添加操作记录
    const operationLogs = [...(project.operationLogs || [])];
    operationLogs.push({
      id: this.generateId(),
      type: this.OP_TYPES.UPLOAD_PHOTO,
      operatorId: currentUser?.id,
      operatorName: currentUser?.name,
      time: new Date().toISOString(),
      stepIndex,
      stepName: steps[stepIndex].stepName,
      photoName: photo.name,
      description: `【${currentUser?.name}】上传照片：${photo.name}`
    });

    return this.updateProject(projectId, { steps, operationLogs });
  },

  // ========== 工艺模板 ==========
  getCraftTemplates() { return this.get(this.KEYS.CRAFTS) || this.getDefaultCrafts(); },
  saveCraftTemplates(crafts) { return this.set(this.KEYS.CRAFTS, crafts); },
  getCraftByType(type) { return this.getCraftTemplates().find(c => c.type === type); },

  // ========== 报价管理 ==========
  getQuotations() { return this.get(this.KEYS.QUOTATIONS) || []; },
  saveQuotations(quotations) { return this.set(this.KEYS.QUOTATIONS, quotations); },
  getQuotation(projectId) { return this.getQuotations().find(q => q.projectId === projectId); },
  deleteQuotation(projectId) { this.saveQuotations(this.getQuotations().filter(q => q.projectId !== projectId)); },

  // ========== 工具方法 ==========
  generateId() { return 'jd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  },

  formatTimeOnly(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  },

  getStatusText(status) {
    const statusMap = {
      [this.PROJECT_STATUS.PENDING]: '待施工',
      [this.PROJECT_STATUS.IN_PROGRESS]: '施工中',
      [this.PROJECT_STATUS.PENDING_REVIEW]: '待验收',
      [this.PROJECT_STATUS.COMPLETED]: '已完成',
      [this.STEP_STATUS.PENDING]: '待施工',
      [this.STEP_STATUS.IN_PROGRESS]: '施工中',
      [this.STEP_STATUS.PENDING_REVIEW]: '待验收',
      [this.STEP_STATUS.APPROVED]: '已验收',
      [this.STEP_STATUS.REJECTED]: '已驳回',
      draft: '草稿', paid: '已付款', waived: '已减免'
    };
    return statusMap[status] || status;
  },

  getStatusTagClass(status) {
    const classMap = {
      [this.PROJECT_STATUS.PENDING]: 'warning',
      [this.PROJECT_STATUS.IN_PROGRESS]: 'primary',
      [this.PROJECT_STATUS.PENDING_REVIEW]: 'danger',
      [this.PROJECT_STATUS.COMPLETED]: 'success',
      [this.STEP_STATUS.PENDING_REVIEW]: 'danger',
      [this.STEP_STATUS.APPROVED]: 'success',
      [this.STEP_STATUS.REJECTED]: 'danger'
    };
    return classMap[status] || 'default';
  },

  getRoleText(role) {
    const roleMap = {
      [this.ROLES.ADMIN]: '管理员',
      [this.ROLES.SURVEYOR]: '勘察员',
      [this.ROLES.WORKER]: '施工员',
      [this.ROLES.REVIEWER]: '验收员'
    };
    return roleMap[role] || role;
  },

  getRoleIcon(role) {
    const iconMap = {
      [this.ROLES.ADMIN]: '👔',
      [this.ROLES.SURVEYOR]: '🔍',
      [this.ROLES.WORKER]: '🔧',
      [this.ROLES.REVIEWER]: '✅'
    };
    return iconMap[role] || '👤';
  },

  getLeakLocationIcon(location) {
    const iconMap = { '外墙': '🏠', '屋面': '🏗️', '窗框': '🪟', '管道': '🔧', '卫生间': '🚽', '地下室': '📦', '阳台': '🌿', '其他': '❓' };
    return iconMap[location] || '📍';
  },

  getLevelConfig(level) {
    const config = {
      'A': { text: '紧急', color: '#ee0a24', bgColor: '#fff1f0' },
      'B': { text: '一般', color: '#ff976a', bgColor: '#fff7e6' },
      'C': { text: '轻微', color: '#07c160', bgColor: '#f0f9eb' }
    };
    return config[level] || config['C'];
  },

  // ========== 默认工艺数据 ==========
  getDefaultCrafts() {
    return [
      {
        id: 'craft_wall', type: 'wall', name: '外墙防水施工工艺',
        steps: [
          { step: 1, stepName: '基层清理', qualityStandard: '基层无灰尘、无油污、无松动、无空鼓、旧涂层清除干净', acceptanceCriteria: '手摸无灰、敲击无空鼓声、目测无残留旧涂层', duration: '2-4小时', keyPoints: ['无明显污垢', '基面干燥', '无空鼓松动'], materials: ['高压水枪', '清洁剂', '刷子'], requiredPhotos: [{ name: '基层全景', desc: '拍摄整个施工面，展示清理后的整体状况', angle: '全景' }, { name: '墙面特写', desc: '手摸墙面拍特写，展示无灰尘无油污', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 2, stepName: '裂缝修补', qualityStandard: '宽缝填实、窄缝封严、与基层平齐，无收缩裂缝', acceptanceCriteria: '目视平整、触摸无凹陷、划针划过顺滑', duration: '3-5小时', keyPoints: ['V槽规整', '填充密实无气泡', '表面平整'], materials: ['聚合物砂浆', '堵漏王', '切割工具'], requiredPhotos: [{ name: '裂缝标识', desc: '标注裂缝位置和走向', angle: '标识' }, { name: '修补后特写', desc: '每条修补裂缝的特写', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 3, stepName: '节点加强', qualityStandard: '阴角贴聚酯布、管根附加层、窗框包边，无气泡无褶皱', acceptanceCriteria: '布宽≥150mm、搭接≥50mm、无翘边、无气泡', duration: '2-3小时', keyPoints: ['布平整无褶皱', '搭接宽度≥50mm', '无翘边'], materials: ['聚酯布', '玻纤网格布', '外墙防水涂料'], requiredPhotos: [{ name: '阴角节点', desc: '阴角处聚酯布加强层特写', angle: '特写' }, { name: '管根节点', desc: '管根部位附加层特写', angle: '特写' }, { name: '窗框节点', desc: '窗框周边包边特写', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 4, stepName: '大面涂刷', qualityStandard: '一布三涂、总厚≥1.5mm、无漏刷、无气泡、无流挂', acceptanceCriteria: '厚度仪检测≥1.5mm、覆盖率100%、无流挂', duration: '4-6小时', keyPoints: ['厚度均匀', '无漏涂', '无流挂'], materials: ['外墙专用防水涂料'], requiredPhotos: [{ name: '大面全景', desc: '整体涂刷效果全景', angle: '全景' }, { name: '厚度特写', desc: '用卡尺展示涂层厚度', angle: '特写' }, { name: '搭接处', desc: '聚酯布搭接部位特写', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 5, stepName: '表层保护', qualityStandard: '透明胶均匀覆盖、无流挂、无漏涂、表面平整', acceptanceCriteria: '目视无缺陷、厚度≥0.5mm、与基面粘结牢固', duration: '2-3小时', keyPoints: ['颜色一致', '无色差', '无漏涂'], materials: ['外墙防水面漆', '色浆'], requiredPhotos: [{ name: '保护层全景', desc: '表层保护完成后的整体效果', angle: '全景' }], passCondition: 'all_photos_uploaded' },
          { step: 6, stepName: '闭水验收', qualityStandard: '蓄水24h、水位无明显下降、楼下无渗漏', acceptanceCriteria: '楼下检查无湿渍无水痕、节点密封完好', duration: '24-48小时', keyPoints: ['室内无渗漏', '涂层无脱落', '节点密封完好'], materials: ['水管', '梯子', '水位标尺'], requiredPhotos: [{ name: '蓄水全景', desc: '蓄水状态全景，水位线清晰可见', angle: '全景' }, { name: '楼下观察', desc: '楼下对应位置检查，无渗漏痕迹', angle: '特写' }], passCondition: 'all_photos_uploaded' }
        ]
      },
      {
        id: 'craft_toilet', type: 'toilet', name: '卫生间免砸砖施工工艺',
        steps: [
          { step: 1, stepName: '渗漏排查', qualityStandard: '确认渗漏点位置和水源，渗漏形态记录完整', acceptanceCriteria: '能准确指出渗漏点，有照片或视频记录', duration: '4-8小时', keyPoints: ['渗漏点定位准确', '记录渗漏形态'], materials: ['水不漏', '堵漏王', '色剂'], requiredPhotos: [{ name: '漏点特写', desc: '渗漏点特写，水迹清晰可见', angle: '特写' }, { name: '水源标识', desc: '标识可能的进水点', angle: '标识' }], passCondition: 'all_photos_uploaded' },
          { step: 2, stepName: '微创注浆', qualityStandard: '钻孔位准确、注浆饱满、无渗出、固化后无异常', acceptanceCriteria: '注浆压力0.2-0.4MPa、饱和注浆、表面无鼓包', duration: '2-4小时', keyPoints: ['注浆饱和', '无跑浆漏浆', '表面无明显鼓包'], materials: ['聚氨酯注浆液', '丙烯酸盐注浆液', '注浆机'], requiredPhotos: [{ name: '注浆孔位', desc: '标注钻孔位置和间距', angle: '标识' }, { name: '注浆过程', desc: '注浆过程中照片，展示饱满度', angle: '特写' }, { name: '注浆后特写', desc: '注浆完成固化后状态', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 3, stepName: '基面处理', qualityStandard: '瓷砖缝清理干净、无杂物、无霉斑、干燥', acceptanceCriteria: '缝隙内无残留、瓷砖表面干净、手摸无灰', duration: '1-2小时', keyPoints: ['瓷砖表面干净', '无霉斑', '干燥'], materials: ['清洁剂', '草酸', '除霉剂', '百洁布'], requiredPhotos: [{ name: '缝隙特写', desc: '清理后的瓷砖缝隙特写', angle: '特写' }, { name: '整体效果', desc: '基面处理后的整体效果', angle: '全景' }], passCondition: 'all_photos_uploaded' },
          { step: 4, stepName: '节点加强', qualityStandard: '地漏管根墙角贴聚酯布加强，覆盖完整无遗漏', acceptanceCriteria: '所有节点全部覆盖、加强层完整无遗漏', duration: '1-2小时', keyPoints: ['节点全部覆盖', '无遗漏'], materials: ['加强型防水涂料', '窄幅防水布'], requiredPhotos: [{ name: '地漏节点', desc: '地漏周边加强层特写', angle: '特写' }, { name: '管根节点', desc: '管道根部加强层特写', angle: '特写' }, { name: '墙角节点', desc: '墙角阴阳角加强层特写', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 5, stepName: '大面涂刷', qualityStandard: '2-3遍JS涂料、厚度≥1.5mm、渗透瓷砖缝隙', acceptanceCriteria: '涂层均匀无流挂、覆盖率100%、渗透充分', duration: '3-4小时', keyPoints: ['涂层均匀', '无流挂', '渗透瓷砖缝隙'], materials: ['免砸砖透明防水涂料'], requiredPhotos: [{ name: '涂刷全景', desc: '整体涂刷效果全景', angle: '全景' }, { name: '厚度特写', desc: '用卡尺或硬币展示涂层厚度', angle: '特写' }, { name: '缝隙渗透', desc: '涂料渗透瓷砖缝隙的特写', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 6, stepName: '闭水试验', qualityStandard: '蓄水24-48h、水位无明显下降、楼下无渗漏', acceptanceCriteria: '楼下检查无湿渍无水痕、水位下降＜5mm', duration: '24-48小时', keyPoints: ['楼下无渗漏', '水位无明显下降'], materials: ['挡水条', '标尺'], requiredPhotos: [{ name: '蓄水全景', desc: '蓄水状态全景，水位线清晰', angle: '全景' }, { name: '楼下观察', desc: '楼下对应位置检查，无渗漏', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 7, stepName: '勾缝处理', qualityStandard: '防水勾缝剂填满、表面平整光滑、无脱落无凹陷', acceptanceCriteria: '缝隙填充饱满、表面平整光滑、与瓷砖粘结牢固', duration: '2-3小时', keyPoints: ['缝隙填充饱满', '表面平整', '无脱落'], materials: ['美缝剂', '勾缝剂', '刮板'], requiredPhotos: [{ name: '勾缝特写', desc: '勾缝完成后的特写，展示平整度', angle: '特写' }, { name: '整体效果', desc: '全部勾缝完成后的整体效果', angle: '全景' }], passCondition: 'all_photos_uploaded' }
        ]
      },
      {
        id: 'craft_window', type: 'window', name: '窗框密封施工工艺',
        steps: [
          { step: 1, stepName: '旧胶清除', qualityStandard: '老化密封胶全部清除、无残留、窗框和墙体无损伤', acceptanceCriteria: '缝隙内无旧胶残留、表面无划伤无破损', duration: '1-2小时', keyPoints: ['旧胶清除干净', '窗框无损伤', '墙体无破损'], materials: ['美工刀', '专用清除工具', '刮刀'], requiredPhotos: [{ name: '清除前', desc: '旧胶未清除前的状态', angle: '特写' }, { name: '清除后', desc: '旧胶清除后的缝隙状态', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 2, stepName: '缝隙清理', qualityStandard: '缝内无杂物灰尘、干燥、无潮湿', acceptanceCriteria: '用刷子清理后目视干净、手摸无灰、完全干燥', duration: '1-2小时', keyPoints: ['缝隙内无杂物', '干燥'], materials: ['细钢丝刷', '吸尘器', '吹风机'], requiredPhotos: [{ name: '缝隙特写', desc: '清理后的缝隙特写，无杂物', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 3, stepName: '发泡填充', qualityStandard: '泡沫饱满充实、无空鼓、固化后切平', acceptanceCriteria: '填充密实无空洞、表面切割平整、无多余溢出', duration: '1-2小时', keyPoints: ['填充质量', '密实无空鼓', '表面平整'], materials: ['聚氨酯发泡剂', '发泡枪'], requiredPhotos: [{ name: '填充过程', desc: '发泡填充过程中的照片', angle: '特写' }, { name: '填充特写', desc: '固化后切割前的状态特写', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 4, stepName: '堵漏加强', qualityStandard: '渗透结晶涂刷均匀、无遗漏、与基层粘结牢固', acceptanceCriteria: '涂料完全覆盖、无漏涂、渗透充分', duration: '1-2小时', keyPoints: ['加强层完整', '无褶皱', '粘结牢固'], materials: ['聚合物防水涂料', '聚酯布'], requiredPhotos: [{ name: '涂刷特写', desc: '防水涂料涂刷的特写', angle: '特写' }], passCondition: 'all_photos_uploaded' },
          { step: 5, stepName: '重新密封', qualityStandard: '硅酮胶连续饱满、宽≥15mm、无气泡无断点、表面光滑', acceptanceCriteria: '胶缝连续无断点、宽度均匀、无气泡、表面光滑', duration: '1-2小时', keyPoints: ['密封连续', '无气泡', '表面光滑'], materials: ['耐候硅酮密封胶', '胶枪', '美纹纸'], requiredPhotos: [{ name: '打胶特写', desc: '密封胶施打的特写，展示饱满度', angle: '特写' }, { name: '整体效果', desc: '整条密封胶的效果全景', angle: '全景' }], passCondition: 'all_photos_uploaded' },
          { step: 6, stepName: '窗台找坡', qualityStandard: '坡度≥5%、排水顺畅、无积水区域', acceptanceCriteria: '坡度仪检测≥5%、倒水测试排水顺畅', duration: '1-2小时', keyPoints: ['坡度≥3%', '排水顺畅', '无积水'], materials: ['聚合物砂浆', '找平工具'], requiredPhotos: [{ name: '窗台全景', desc: '找坡后的窗台整体效果', angle: '全景' }, { name: '坡度特写', desc: '展示坡度的特写，可用水平尺', angle: '特写' }], passCondition: 'all_photos_uploaded' }
        ]
      }
    ];
  },

  // ========== 员工管理（管理员专用）==========
  
  // 管理员创建员工账号
  createEmployeeByAdmin(data) {
    const users = this.getUsers();
    
    // 检查手机号是否已存在
    if (users.find(u => u.employeeId === data.employeeId)) {
      return { success: false, message: '该手机号已被注册' };
    }
    
    // 自动生成工号（如果没有指定）
    const employeeId = data.employeeId || this.generateEmployeeId();
    
    const newEmployee = {
      id: this.generateId(),
      employeeId: employeeId,
      name: data.name,
      phone: data.phone || employeeId,
      role: data.role || this.ROLES.WORKER,
      // 员工默认密码为空，登录时免密
      password: '',
      createTime: new Date().toISOString(),
      createBy: this.getCurrentUser()?.id,
      createByName: this.getCurrentUser()?.name,
      status: 'active',  // active | disabled
      remark: data.remark || ''
    };
    
    users.push(newEmployee);
    this.saveUsers(users);
    
    // 记录日志
    console.log(`[员工管理] ${this.getCurrentUser()?.name} 创建员工账号：${newEmployee.name}（${newEmployee.employeeId}）`);
    
    return { success: true, employee: newEmployee };
  },

  // 生成员工工号
  generateEmployeeId() {
    const users = this.getUsers();
    const employees = users.filter(u => u.role !== this.ROLES.ADMIN);
    const maxNum = employees.reduce((max, u) => {
      const match = u.employeeId.match(/^EMP(\d+)$/);
      if (match) return Math.max(max, parseInt(match[1]));
      return max;
    }, 0);
    return 'EMP' + String(maxNum + 1).padStart(4, '0');
  },

  // 获取启用中的员工
  getActiveEmployees() {
    return this.getUsers().filter(u => u.role !== this.ROLES.ADMIN && u.status === 'active');
  },

  // 获取所有员工（包括禁用的）
  getAllEmployees() {
    return this.getUsers().filter(u => u.role !== this.ROLES.ADMIN);
  },

  // 禁用/启用员工账号
  toggleEmployeeStatus(id) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: '员工不存在' };
    
    const currentStatus = users[index].status;
    users[index].status = currentStatus === 'active' ? 'disabled' : 'active';
    users[index].updateTime = new Date().toISOString();
    
    this.saveUsers(users);
    
    const action = users[index].status === 'active' ? '启用' : '禁用';
    console.log(`[员工管理] ${this.getCurrentUser()?.name} ${action}员工：${users[index].name}`);
    
    return { success: true, employee: users[index] };
  },

  // 修改员工角色
  updateEmployeeRole(id, newRole) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: '员工不存在' };
    
    const oldRole = users[index].role;
    users[index].role = newRole;
    users[index].updateTime = new Date().toISOString();
    
    this.saveUsers(users);
    
    console.log(`[员工管理] ${this.getCurrentUser()?.name} 修改员工角色：${users[index].name}（${this.getRoleText(oldRole)} → ${this.getRoleText(newRole)}）`);
    
    return { success: true, employee: users[index] };
  },

  // 重置员工密码
  resetEmployeePassword(id) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return { success: false, message: '员工不存在' };
    
    // 员工账号密码重置为空（免密登录）
    users[index].password = '';
    users[index].passwordResetTime = new Date().toISOString();
    users[index].updateTime = new Date().toISOString();
    
    this.saveUsers(users);
    
    console.log(`[员工管理] ${this.getCurrentUser()?.name} 重置员工密码：${users[index].name}`);
    
    return { success: true, employee: users[index] };
  },

  // 获取单个员工信息
  getEmployee(id) {
    const users = this.getUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      // 不返回密码
      const { password, ...safeUser } = user;
      return safeUser;
    }
    return null;
  },

  // 检查员工账号是否存在（可登录）
  checkEmployeeExists(employeeId) {
    const users = this.getUsers();
    const user = users.find(u => u.employeeId === employeeId || u.phone === employeeId);
    if (!user) return { exists: false, message: '账号不存在，请联系管理员开通' };
    if (user.status === 'disabled') return { exists: false, message: '账号已被禁用，请联系管理员' };
    if (user.role === this.ROLES.ADMIN) return { exists: true, user, isAdmin: true };
    return { exists: true, user, isAdmin: false };
  },

  // ========== 权限判断 ==========
  
  // 判断当前用户是否有某权限
  hasPermission(permission) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;
    
    const permissions = {
      // 管理员权限
      'admin:all': [this.ROLES.ADMIN],
      'admin:project': [this.ROLES.ADMIN],
      'admin:employee': [this.ROLES.ADMIN],
      'admin:settings': [this.ROLES.ADMIN],
      'admin:photo': [this.ROLES.ADMIN],
      'admin:review': [this.ROLES.ADMIN, this.ROLES.REVIEWER],
      
      // 照片权限
      'photo:view_all': [this.ROLES.ADMIN],
      'photo:view_own': [this.ROLES.SURVEYOR, this.ROLES.WORKER, this.ROLES.REVIEWER, this.ROLES.ADMIN],
      'photo:manage': [this.ROLES.ADMIN],
      
      // 施工权限
      'survey:do': [this.ROLES.SURVEYOR, this.ROLES.ADMIN],
      'work:do': [this.ROLES.WORKER, this.ROLES.ADMIN],
      'review:do': [this.ROLES.REVIEWER, this.ROLES.ADMIN]
    };
    
    const allowedRoles = permissions[permission];
    if (!allowedRoles) return false;
    
    return allowedRoles.includes(currentUser.role);
  },

  // 获取用户可见的导航菜单
  getVisibleNavTabs() {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return [];
    
    const allTabs = [
      { id: 'home', name: '首页', icon: '🏠', roles: ['admin', 'surveyor', 'worker', 'reviewer'] },
      { id: 'projects', name: '项目', icon: '📋', roles: ['admin'] },
      { id: 'survey', name: '勘察', icon: '🔍', roles: ['surveyor', 'admin'] },
      { id: 'work', name: '施工', icon: '🔧', roles: ['worker', 'admin'] },
      { id: 'review', name: '验收', icon: '✅', roles: ['reviewer', 'admin'] },
      { id: 'photos', name: '照片', icon: '📷', roles: ['admin', 'surveyor', 'worker', 'reviewer'] },
      { id: 'settings', name: '设置', icon: '⚙️', roles: ['admin', 'surveyor', 'worker', 'reviewer'] }
    ];
    
    return allTabs.filter(tab => tab.roles.includes(currentUser.role));
  },

  // ========== 初始化 ==========
  initDefaultAdmin() {
    const users = this.getUsers();
    if (!users.find(u => u.role === this.ROLES.ADMIN)) {
      this.createUser({ employeeId: '13800138000', name: '张工', role: this.ROLES.ADMIN, password: '1234' });
    }
  }
};

// 导出
window.Store = Store;
