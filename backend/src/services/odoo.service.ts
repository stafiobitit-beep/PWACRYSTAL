import { odoo } from './odoo.base.js';

export class OdooTaskService {
  static async getTasks(domain: any[] = [], since?: Date) {
    if (since) {
      domain.push(['write_date', '>=', since.toISOString().replace('T', ' ').substring(0, 19)]);
    }
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
  static async getProjects(since?: Date) {
    const domain: any[] = [];
    if (since) {
      domain.push(['write_date', '>=', since.toISOString().replace('T', ' ').substring(0, 19)]);
    }
    return odoo.execute('project.project', 'search_read', [domain], {
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
    // Use message_post on the task — mail.message.create fails due to Odoo access rights
    return odoo.execute('project.task', 'message_post', [[taskId]], {
      body: `<strong>${senderName}:</strong> ${content}`,
      message_type: 'comment',
      subtype_xmlid: 'mail.mt_note',
      is_internal: true,
    });
  }

  static async getMessages(taskId: number, since?: Date) {
    const domain: any[] = [
      ['model', '=', 'project.task'],
      ['res_id', '=', taskId],
      ['message_type', 'in', ['comment', 'email']],
    ];
    if (since) {
      domain.push(['date', '>=', since.toISOString().replace('T', ' ').substring(0, 19)]);
    }
    try {
      return await odoo.execute('mail.message', 'search_read', [domain], {
        fields: ['id', 'body', 'date', 'author_id', 'message_type'],
        order: 'date asc',
        limit: 100,
      });
    } catch (e: any) {
      console.warn('[Odoo] Could not read messages:', e.message);
      return [];
    }
  }
}

export class OdooTimesheetService {
  static async createTimesheet(
    taskId: number,
    minutes: number,
    description: string,
    cleanerEmail?: string
  ) {
    const hours = parseFloat((minutes / 60).toFixed(4));
    const data: any = {
      name: description || 'Cleaning session',
      unit_amount: hours,
      task_id: taskId,
    };

    // Resolve Odoo user_id and employee_id from cleaner email for proper HR linking
    if (cleanerEmail) {
      try {
        const users = await odoo.execute(
          'res.users',
          'search_read',
          [[['login', '=', cleanerEmail], ['active', '=', true]]],
          { fields: ['id', 'employee_ids'] }
        );
        if (users?.[0]) {
          data.user_id = users[0].id;
          const empIds = users[0].employee_ids;
          if (Array.isArray(empIds) && empIds.length > 0) {
            data.employee_id = empIds[0];
          }
        }
      } catch (e: any) {
        console.warn('[Odoo] Could not resolve user for timesheet:', e.message);
      }
    }

    return odoo.execute('account.analytic.line', 'create', [data]);
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
    // In Odoo 19, we post a chatter message instead of a sub-task
    return odoo.execute('project.task', 'message_post', [[taskId]], {
      body: `🚨 <strong>INCIDENT:</strong><br/>${description}`,
      message_type: 'comment',
      subtype_xmlid: 'mail.mt_note',
      is_internal: true,
    });
  }
}

export class OdooUserService {
  static async findByEmail(email: string) {
    try {
      const users = await odoo.execute(
        'res.users',
        'search_read',
        [[['login', '=', email]]],
        { fields: ['id', 'name', 'email', 'employee_ids'] }
      );
      return users?.[0] || null;
    } catch {
      return null;
    }
  }

  // Creates a minimal Odoo internal user so timesheets can be linked
  static async createInternalUser(name: string, email: string) {
    try {
      const userId = await odoo.execute('res.users', 'create', [{
        name,
        login: email,
        groups_id: [[4, 9]], // base internal user group
      }]);
      console.log(`[Odoo] Created internal user ${name} (${email}), uid=${userId}`);
      return userId as number;
    } catch (e: any) {
      console.error('[Odoo] Could not create Odoo user:', e.message);
      return null;
    }
  }
}
