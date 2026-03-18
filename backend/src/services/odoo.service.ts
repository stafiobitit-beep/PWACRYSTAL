import { odoo } from './odoo.base.js';

export class OdooTaskService {
  static async getTasks(domain: any[] = []) {
    return odoo.execute('project.task', 'search_read', [domain], {
      fields: ['id', 'name', 'description', 'date_deadline', 'stage_id', 'user_ids', 'partner_id', 'project_id'],
    });
  }

  static async createTask(data: { name: string, project_id: number, partner_id?: number, description?: string }) {
    return odoo.execute('project.task', 'create', [data]);
  }

  static async updateTaskStatus(taskId: number, stageId: number) {
    return odoo.execute('project.task', 'write', [[taskId], { stage_id: stageId }]);
  }
}

export class OdooProjectService {
  static async getProjects() {
    return odoo.execute('project.project', 'search_read', [[]], {
      fields: ['id', 'name', 'partner_id'],
    });
  }
}

export class OdooPartnerService {
  static async getPartners(domain: any[] = [['customer_rank', '>', 0]]) {
    return odoo.execute('res.partner', 'search_read', [domain], {
      fields: ['id', 'name', 'email', 'phone', 'street', 'city'],
    });
  }
}

export class OdooMessageService {
  static async postMessage(taskId: number, content: string, senderName: string) {
    return odoo.execute('mail.message', 'create', [{
      model: 'project.task',
      res_id: taskId,
      body: `<b>${senderName}</b>: ${content}`,
      message_type: 'comment',
      subtype_id: 1, // Note
    }]);
  }
}

export class OdooTimesheetService {
  static async createTimesheet(taskId: number, minutes: number, description: string) {
    const hours = minutes / 60;
    return odoo.execute('account.analytic.line', 'create', [{
      name: description || 'Cleaning Session',
      unit_amount: hours,
      task_id: taskId,
      // project_id is usually inferred from task_id in Odoo, 
      // but sometimes needed explicitly. We'll stick to task_id for now.
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
