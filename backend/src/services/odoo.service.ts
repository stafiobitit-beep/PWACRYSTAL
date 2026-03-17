import { odoo } from './odoo.base.js';

export class OdooTaskService {
  static async getTasks(domain: any[] = []) {
    return odoo.execute('project.task', 'search_read', [domain], {
      fields: ['id', 'name', 'description', 'date_deadline', 'stage_id', 'user_id', 'partner_id'],
    });
  }

  static async updateTaskStatus(taskId: number, stageId: number) {
    return odoo.execute('project.task', 'write', [[taskId], { stage_id: stageId }]);
  }
}

export class OdooMessageService {
  static async postMessage(taskId: number, content: string) {
    return odoo.execute('mail.message', 'create', [{
      model: 'project.task',
      res_id: taskId,
      body: content,
      message_type: 'comment',
      subtype_id: 1, // Note
    }]);
  }
}

export class OdooAttachmentService {
  static async uploadAttachment(taskId: number, fileName: string, base64Data: string) {
    return odoo.execute('ir.attachment', 'create', [{
      name: fileName,
      datas: base64Data,
      res_model: 'project.task',
      res_id: taskId,
      type: 'binary',
    }]);
  }
}

export class OdooIncidentService {
  static async createIncident(taskId: number, description: string) {
    // Custom logic: create a sub-task or a ticket
    return odoo.execute('project.task', 'create', [{
      name: `INCIDENT: ${description}`,
      parent_id: taskId,
      description: description,
      priority: '1', // High priority
    }]);
  }
}
