import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import prisma from './utils/prisma.js';
import { authenticateToken, authorizeRole, type AuthRequest } from './middleware/auth.js';
import { OdooTaskService, OdooMessageService, OdooAttachmentService, OdooIncidentService } from './services/odoo.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

app.use(cors());
app.use(express.json());

// --- AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET);
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
});

// --- TASK ROUTES ---
app.get('/api/tasks', authenticateToken, async (req: AuthRequest, res) => {
  const { role, id } = req.user!;
  
  let tasks;
  if (role === 'ADMIN') {
    tasks = await prisma.cleaningTask.findMany({ include: { location: true, cleaner: true } });
  } else if (role === 'CLEANER') {
    tasks = await prisma.cleaningTask.findMany({ where: { cleanerId: id }, include: { location: true } });
  } else {
    tasks = await prisma.cleaningTask.findMany({ where: { location: { customerId: id } }, include: { location: true } });
  }
  
  res.json(tasks);
});

app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  const task = await prisma.cleaningTask.findUnique({
    where: { id: req.params.id },
    include: { location: true, cleaner: true, messages: { include: { sender: true } }, photos: true, incidents: true }
  });
  res.json(task);
});

app.patch('/api/tasks/:id/status', authenticateToken, async (req, res) => {
  const { status, odooTaskId, odooStageId } = req.body;
  const task = await prisma.cleaningTask.update({
    where: { id: req.params.id },
    data: { status }
  });

  // Phase 2: Sync to Odoo if ID is provided
  if (odooTaskId && odooStageId) {
    try {
      await OdooTaskService.updateTaskStatus(odooTaskId, odooStageId);
    } catch (error) {
      console.error('Odoo Sync Error:', error);
    }
  }
  res.json(task);
});

// --- CHAT ROUTES ---
app.post('/api/tasks/:id/messages', authenticateToken, async (req: AuthRequest, res) => {
  const { content, odooTaskId } = req.body;
  const message = await prisma.taskMessage.create({
    data: {
      content,
      taskId: req.params.id,
      senderId: req.user!.id
    },
    include: { sender: true }
  });

  // Phase 2: Sync to Odoo
  if (odooTaskId) {
    try {
      await OdooMessageService.postMessage(odooTaskId, content);
    } catch (error) {
      console.error('Odoo Message Sync Error:', error);
    }
  }
  res.json(message);
});

// --- PHOTO ROUTES ---
app.post('/api/tasks/:id/photos', authenticateToken, async (req, res) => {
  const { url, type, odooTaskId, fileName } = req.body;
  const photo = await prisma.taskPhoto.create({
    data: { url, type, taskId: req.params.id }
  });

  // Phase 2: Sync to Odoo
  if (odooTaskId && url) {
    try {
      const base64Data = url.split(',')[1]; // Remove data URL prefix
      await OdooAttachmentService.uploadAttachment(odooTaskId, fileName || 'upload.jpg', base64Data);
    } catch (error) {
      console.error('Odoo Attachment Sync Error:', error);
    }
  }
  res.json(photo);
});

// --- INCIDENT ROUTES ---
app.post('/api/tasks/:id/incidents', authenticateToken, async (req, res) => {
  const { description, odooTaskId } = req.body;
  const incident = await prisma.incident.create({
    data: { description, status: 'OPEN', taskId: req.params.id }
  });

  // Phase 2: Sync to Odoo
  if (odooTaskId) {
    try {
      await OdooIncidentService.createIncident(odooTaskId, description);
    } catch (error) {
      console.error('Odoo Incident Sync Error:', error);
    }
  }

  // Auto update task status to ISSUE
  await prisma.cleaningTask.update({ where: { id: req.params.id }, data: { status: 'ISSUE' } });
  res.json(incident);
});

// --- SETTINGS ROUTES ---
app.get('/api/settings/odoo', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  const config = await prisma.odooConfig.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(config || {});
});

app.post('/api/settings/odoo', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  const { url, db, username, apiKey } = req.body;
  
  // Deactivate old configs
  await prisma.odooConfig.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  const config = await prisma.odooConfig.create({
    data: { url, db, username, apiKey, isActive: true }
  });
  
  res.json(config);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
