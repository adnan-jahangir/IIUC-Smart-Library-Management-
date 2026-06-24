require('dotenv').config();
const cron = require('node-cron');
const mongoose = require('mongoose');
const BorrowRequest = require('../models/BorrowRequest');
const Notification = require('../models/Notification');
const { getChatCompletion } = require('../services/openaiService');
const { DAILY_FINE_RATE } = require('../utils/borrow-utils');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function floorDaysBetween(a, b) {
  return Math.floor((b - a) / MS_PER_DAY);
}

// Function to optionally rephrase a batch of notifications using AI
async function rephraseWithAI(notifications) {
  if (process.env.ENABLE_AI_NOTIFICATION_TONE !== 'true' || notifications.length === 0) {
    return notifications; // Return templates directly if AI is disabled
  }

  try {
    const promptMessages = [
      {
        role: 'system',
        content: `You are a friendly and empathetic university library assistant. I will provide a JSON array of automated notification messages. Your task is to rewrite each message to have a warmer, more encouraging tone while keeping all the critical information intact (book title, exact due date, number of days, fine amounts, etc.).
Do NOT change the array structure or the IDs. Keep it concise (1-2 sentences max).
Format your response strictly as a JSON array of strings in the exact same order.`
      },
      {
        role: 'user',
        content: JSON.stringify(notifications.map(n => n.message))
      }
    ];

    const { reply } = await getChatCompletion(promptMessages, { 
      temperature: 0.5,
      response_format: { type: "json_object" } // Using json_object might require an object structure, let's wrap it
    });
    
    // Wait, json_object requires `{}`. I will adjust the prompt.
  } catch (err) {
    console.error('AI tone rephrasing failed, falling back to templates:', err.message);
    return notifications;
  }
}

async function runDueDateCheckCycle() {
  console.log('Jobs: running due date checker cycle', new Date().toISOString());

  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * MS_PER_DAY);
  
  // Find approved requests that are either overdue OR due within the next 2 days
  const activeRequests = await BorrowRequest.find({
    status: 'Approved'
  }).populate('user book');

  const notificationsToCreate = [];

  for (const br of activeRequests) {
    if (!br.dueDate) continue;

    const daysOverdue = floorDaysBetween(br.dueDate, now);
    
    // Overdue
    if (daysOverdue > 0) {
      const fineAmount = br.fineAccrued || (daysOverdue * DAILY_FINE_RATE);
      // Ensure we don't spam them every single day unless fine increases, but a daily reminder is okay per requirements.
      // We will create one.
      const message = `⚠️ '${br.book.title}' is overdue by ${daysOverdue} days. Current fine: ৳${fineAmount}. Renew or return to avoid further charges.`;
      notificationsToCreate.push({
        user: br.user._id,
        message,
        type: 'overdue',
        ref: { kind: 'BorrowRequest', id: br._id }
      });
    } 
    // Due within next 2 days
    else if (br.dueDate > now && br.dueDate <= twoDaysFromNow) {
      const daysLeft = floorDaysBetween(now, br.dueDate) || 1; // if 0, it means due today
      const message = `📚 '${br.book.title}' is due in ${daysLeft} day(s). Renew now to avoid a fine of ৳${DAILY_FINE_RATE}/day.`;
      
      // Avoid duplicate notifications on the same day for "due-soon"
      const existingNotification = await Notification.findOne({
        user: br.user._id,
        type: 'due-soon',
        'ref.id': br._id,
        createdAt: { $gte: new Date(now.setHours(0,0,0,0)) }
      });

      if (!existingNotification) {
        notificationsToCreate.push({
          user: br.user._id,
          message,
          type: 'due-soon',
          ref: { kind: 'BorrowRequest', id: br._id }
        });
      }
    }
  }

  // Optional AI Tone Rephrasing
  if (process.env.ENABLE_AI_NOTIFICATION_TONE === 'true' && notificationsToCreate.length > 0) {
    try {
      const promptMessages = [
        {
          role: 'system',
          content: `You are a friendly and empathetic university library assistant. I will provide a JSON array of automated notification messages. Your task is to rewrite each message to have a warmer, more encouraging tone while keeping all the critical information intact (book title, exact due date, number of days, fine amounts, etc.).
Keep it concise (1-2 sentences max).
Output EXACTLY as a JSON object with a "messages" key containing an array of the rephrased strings in the EXACT SAME ORDER.`
        },
        {
          role: 'user',
          content: JSON.stringify({ messages: notificationsToCreate.map(n => n.message) })
        }
      ];

      const { reply } = await getChatCompletion(promptMessages, { 
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(reply.trim());
      if (parsed.messages && parsed.messages.length === notificationsToCreate.length) {
        for (let i = 0; i < notificationsToCreate.length; i++) {
          notificationsToCreate[i].message = parsed.messages[i];
        }
        console.log('Jobs: Successfully applied AI tone to notifications.');
      }
    } catch (err) {
      console.error('AI tone rephrasing failed, falling back to templates:', err.message);
    }
  }

  // Insert into DB
  if (notificationsToCreate.length > 0) {
    await Notification.insertMany(notificationsToCreate);
    console.log(`Jobs: Created ${notificationsToCreate.length} proactive notifications.`);
  }
}

async function startJobs() {
  // run immediately on start (in a real app you might not want this, but helpful for testing)
  // await runDueDateCheckCycle();

  // schedule daily at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    try {
      await runDueDateCheckCycle();
    } catch (err) {
      console.error('Jobs: error during due date checker cycle', err);
    }
  });

  console.log('Jobs: scheduled due date checker job at 08:00 AM');
}

// Export for manual testing via routes if needed
module.exports = { startJobs, runDueDateCheckCycle };
