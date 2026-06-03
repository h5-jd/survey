/**
 * 施工资料导出PDF模块 - v4.0
 * 一键生成完整施工档案
 */
const ReportExport = {
  // 公司信息
  COMPANY: {
    name: '珠海聚达建筑工程有限公司',
    phone: '0756-8888888',
    address: '珠海市香洲区XX路XX号'
  },
  
  // 初始化
  init() {
    // 加载jsPDF
    this.loadJsPDF().then(() => {
      console.log('ReportExport: PDF导出模块初始化完成');
    }).catch(err => {
      console.error('ReportExport: jsPDF加载失败', err);
    });
    
    return this;
  },
  
  // 加载jsPDF库
  loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (window.jspdf) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  },
  
  // 导出项目报告
  async exportProjectReport(projectId, options = {}) {
    const project = Store?.getProject?.(projectId);
    if (!project) {
      throw new Error('项目不存在');
    }
    
    const {
      includePhotos = true,
      includeVoiceNotes = true,
      format = 'pdf' // pdf | image
    } = options;
    
    // 等待jsPDF加载
    await this.loadJsPDF();
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;
    
    // ========== 1. 封面 ==========
    this.addCoverPage(doc, project, pageWidth, pageHeight);
    
    // ========== 2. 项目基本信息 ==========
    doc.addPage();
    yPos = margin;
    this.addSectionTitle(doc, '一、项目基本信息', yPos);
    yPos += 15;
    yPos = this.addProjectInfo(doc, project, margin, yPos);
    
    // ========== 3. 施工前后对比照片 ==========
    if (includePhotos && project.steps) {
      doc.addPage();
      yPos = margin;
      this.addSectionTitle(doc, '二、施工前后对比照片', yPos);
      yPos += 15;
      yPos = await this.addBeforeAfterPhotos(doc, project, margin, yPos);
    }
    
    // ========== 4. 验收记录 ==========
    doc.addPage();
    yPos = margin;
    this.addSectionTitle(doc, '三、验收记录', yPos);
    yPos += 15;
    yPos = this.addReviewRecords(doc, project, margin, yPos);
    
    // ========== 5. 异常上报及处理 ==========
    const anomalies = await AnomalyReport?.getReportsByProject?.(projectId);
    if (anomalies && anomalies.length > 0) {
      doc.addPage();
      yPos = margin;
      this.addSectionTitle(doc, '四、异常上报及处理', yPos);
      yPos += 15;
      yPos = this.addAnomalyRecords(doc, anomalies, margin, yPos);
    }
    
    // ========== 6. 语音备注 ==========
    if (includeVoiceNotes) {
      const voiceNotes = await VoiceNote?.getVoiceNotesByProject?.(projectId);
      if (voiceNotes && voiceNotes.length > 0) {
        doc.addPage();
        yPos = margin;
        this.addSectionTitle(doc, '五、语音备注转文字', yPos);
        yPos += 15;
        yPos = this.addVoiceNotes(doc, voiceNotes, margin, yPos);
      }
    }
    
    // ========== 7. 报价单 ==========
    const quotation = Store?.getQuotation?.(projectId);
    if (quotation) {
      doc.addPage();
      yPos = margin;
      this.addSectionTitle(doc, '六、报价单', yPos);
      yPos += 15;
      yPos = this.addQuotation(doc, quotation, margin, yPos);
    }
    
    // ========== 8. 施工时间线 ==========
    doc.addPage();
    yPos = margin;
    this.addSectionTitle(doc, '七、施工时间线', yPos);
    yPos += 15;
    yPos = this.addTimeline(doc, project, margin, yPos);
    
    // ========== 9. 签名区 ==========
    if (project.signature) {
      yPos = this.addSignatureSection(doc, project, margin, yPos);
    }
    
    // 保存文件
    const filename = `施工档案_${project.customerName}_${new Date().format('yyyyMMdd')}.pdf`;
    doc.save(filename);
    
    console.log('ReportExport: 报告导出成功', filename);
    return filename;
  },
  
  // 添加封面页
  addCoverPage(doc, project, pageWidth, pageHeight) {
    // 背景色
    doc.setFillColor(25, 137, 250);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // 公司名称
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY.name, pageWidth / 2, 60, { align: 'center' });
    
    // 标题
    doc.setFontSize(32);
    doc.text('施工档案', pageWidth / 2, 100, { align: 'center' });
    
    // 项目名称
    doc.setFontSize(18);
    doc.text(`项目：${project.customerName}`, pageWidth / 2, 140, { align: 'center' });
    
    // 信息
    doc.setFontSize(12);
    doc.text(`客户：${project.customerName}`, pageWidth / 2, 165, { align: 'center' });
    doc.text(`地址：${project.customerAddress}`, pageWidth / 2, 175, { align: 'center' });
    doc.text(`建筑类型：${project.buildingType || '未填写'}`, pageWidth / 2, 185, { align: 'center' });
    doc.text(`施工时间：${this.formatDate(project.createTime)} 至 ${this.formatDate(project.updateTime)}`, pageWidth / 2, 195, { align: 'center' });
    
    // 底部信息
    doc.setFontSize(10);
    doc.text(`${this.COMPANY.phone}  |  ${this.COMPANY.address}`, pageWidth / 2, pageHeight - 30, { align: 'center' });
    doc.text(`导出时间：${new Date().format('yyyy年MM月dd日 HH:mm')}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  },
  
  // 添加章节标题
  addSectionTitle(doc, title, yPos) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(25, 137, 250);
    doc.text(title, 20, yPos);
    
    // 标题下划线
    doc.setDrawColor(25, 137, 250);
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 3, 190, yPos + 3);
  },
  
  // 添加项目信息
  addProjectInfo(doc, project, margin, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const info = [
      ['客户姓名', project.customerName],
      ['联系电话', project.customerPhone],
      ['施工地址', project.customerAddress],
      ['建筑类型', project.buildingType || '未填写'],
      ['建造年份', project.buildYear || '未填写'],
      ['渗漏位置', project.leakLocations?.map(l => l.name).join('、') || '未填写'],
      ['施工工艺', project.craftType ? this.getCraftName(project.craftType) : '未分配'],
      ['项目状态', Store?.getStatusText?.(project.status) || project.status],
      ['项目进度', `${project.progress || 0}%`]
    ];
    
    info.forEach(([label, value]) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}：`, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '未填写', margin + 35, yPos);
      yPos += 8;
    });
    
    return yPos;
  },
  
  // 添加施工前后对比照片
  async addBeforeAfterPhotos(doc, project, margin, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const steps = project.steps || [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }
      
      // 步骤标题
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`步骤${i + 1}：${step.stepName}`, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`状态：${Store?.getStatusText?.(step.reviewStatus) || step.reviewStatus || '待施工'}`, 150, yPos);
      yPos += 8;
      
      // 查找该步骤的前后对比照片
      const photos = step.photos || [];
      const beforePhotos = photos.filter(p => p.compareTag === 'before');
      const afterPhotos = photos.filter(p => p.compareTag === 'after');
      
      if (beforePhotos.length > 0 || afterPhotos.length > 0) {
        // 施工前
        if (beforePhotos.length > 0) {
          doc.setFontSize(9);
          doc.text('施工前：', margin, yPos);
          yPos += 2;
          
          for (const photo of beforePhotos.slice(0, 2)) {
            if (photo.url) {
              try {
                doc.addImage(photo.url, 'JPEG', margin, yPos, 40, 30);
                yPos += 33;
              } catch (e) {
                doc.text('[图片加载失败]', margin, yPos);
                yPos += 8;
              }
            }
          }
        }
        
        // 施工后
        if (afterPhotos.length > 0) {
          doc.setFontSize(9);
          doc.text('施工后：', margin, yPos);
          yPos += 2;
          
          for (const photo of afterPhotos.slice(0, 2)) {
            if (photo.url) {
              try {
                doc.addImage(photo.url, 'JPEG', margin, yPos, 40, 30);
                yPos += 33;
              } catch (e) {
                doc.text('[图片加载失败]', margin, yPos);
                yPos += 8;
              }
            }
          }
        }
      } else {
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('暂无对比照片', margin, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      }
      
      yPos += 5;
    }
    
    return yPos;
  },
  
  // 添加验收记录
  addReviewRecords(doc, project, margin, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const steps = project.steps || [];
    
    steps.forEach((step, i) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`步骤${i + 1}：${step.stepName}`, margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      const records = [
        ['状态', Store?.getStatusText?.(step.reviewStatus) || '待施工'],
        ['施工员', step.operatorName || '未执行'],
        ['验收员', step.reviewerName || '-'],
        ['验收时间', step.reviewTime ? this.formatDate(step.reviewTime) : '-'],
        ['验收备注', step.reviewNote || '-']
      ];
      
      records.forEach(([label, value]) => {
        doc.text(`${label}：${value}`, margin + 5, yPos);
        yPos += 7;
      });
      
      yPos += 5;
    });
    
    return yPos;
  },
  
  // 添加异常记录
  addAnomalyRecords(doc, anomalies, margin, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    anomalies.forEach((anomaly, i) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`异常${i + 1}：${anomaly.typeName}`, margin, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      const info = [
        ['上报人', anomaly.reportedByName],
        ['上报时间', this.formatDate(anomaly.reportedTime)],
        ['问题描述', anomaly.description || '无'],
        ['处理状态', AnomalyReport?.getStatusDisplay?.(anomaly.status)?.text || anomaly.status],
        ['处理结果', anomaly.handleResult || '待处理']
      ];
      
      info.forEach(([label, value]) => {
        doc.text(`${label}：${value}`, margin + 5, yPos);
        yPos += 7;
      });
      
      yPos += 5;
    });
    
    return yPos;
  },
  
  // 添加语音备注
  addVoiceNotes(doc, voiceNotes, margin, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    voiceNotes.forEach((note, i) => {
      if (yPos > 260) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text(`语音备注${i + 1}：`, margin, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${note.employeeName}  ${this.formatDate(note.timestamp)}`, margin + 30, yPos);
      yPos += 8;
      
      if (note.transcript) {
        const lines = doc.splitTextToSize(`转写内容：${note.transcript}`, 170);
        doc.text(lines, margin + 5, yPos);
        yPos += lines.length * 6 + 5;
      } else {
        doc.setTextColor(150, 150, 150);
        doc.text('（无转写内容）', margin + 5, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      }
    });
    
    return yPos;
  },
  
  // 添加报价单
  addQuotation(doc, quotation, margin, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    doc.text(`报价日期：${this.formatDate(quotation.createTime)}`, margin, yPos);
    yPos += 10;
    
    // 报价明细
    const items = quotation.items || [];
    items.forEach((item, i) => {
      doc.text(`${i + 1}. ${item.name}：¥${item.price}`, margin, yPos);
      yPos += 8;
    });
    
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.text(`总价：¥${quotation.finalTotal || quotation.total}`, margin, yPos);
    
    return yPos + 20;
  },
  
  // 添加时间线
  addTimeline(doc, project, margin, yPos) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const logs = project.operationLogs || [];
    logs.reverse().forEach((log, i) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = margin;
      }
      
      // 时间线点
      doc.setFillColor(25, 137, 250);
      doc.circle(margin + 2, yPos - 2, 2, 'F');
      
      // 连接线
      if (i < logs.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(margin + 2, yPos, margin + 2, yPos + 15);
      }
      
      // 内容
      doc.text(this.formatDate(log.time), margin + 10, yPos);
      yPos += 6;
      doc.text(log.description, margin + 10, yPos);
      yPos += 15;
    });
    
    return yPos;
  },
  
  // 添加签名区
  addSignatureSection(doc, project, margin, yPos) {
    if (yPos > 200) {
      doc.addPage();
      yPos = margin;
    }
    
    this.addSectionTitle(doc, '八、签名确认', yPos);
    yPos += 15;
    
    if (project.signature) {
      // 签名图片
      if (project.signature.imageUrl) {
        try {
          doc.addImage(project.signature.imageUrl, 'PNG', margin, yPos, 60, 30);
          yPos += 35;
        } catch (e) {
          doc.text('[签名图片加载失败]', margin, yPos);
          yPos += 10;
        }
      }
      
      doc.setFontSize(10);
      doc.text(`签名人：${project.signature.signerName}`, margin, yPos);
      yPos += 7;
      doc.text(`角色：${project.signature.signerRole}`, margin, yPos);
      yPos += 7;
      doc.text(`时间：${this.formatDate(project.signature.signTime)}`, margin, yPos);
    }
    
    return yPos;
  },
  
  // 工具方法
  getCraftName(craftType) {
    const crafts = {
      'wall': '外墙防水施工工艺',
      'toilet': '卫生间免砸砖施工工艺',
      'window': '窗框密封施工工艺'
    };
    return crafts[craftType] || craftType;
  },
  
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.format('yyyy年MM月dd日 HH:mm');
  }
};

// Date格式化扩展
if (!Date.prototype.format) {
  Date.prototype.format = function(fmt) {
    const o = {
      'M+': this.getMonth() + 1,
      'd+': this.getDate(),
      'h+': this.getHours(),
      'm+': this.getMinutes(),
      's+': this.getSeconds(),
      'q+': Math.floor((this.getMonth() + 3) / 3),
      'S': this.getMilliseconds()
    };
    
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    
    for (const k in o) {
      if (new RegExp('(' + k + ')').test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
      }
    }
    
    return fmt;
  };
}

// 导出
window.ReportExport = ReportExport;
