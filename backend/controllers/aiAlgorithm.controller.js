const { getChatCompletion } = require('../services/openaiService');
const AiUsageLog = require('../models/AiUsageLog');

async function logUsage(userId, role, feature, tokensUsed) {
  try {
    await AiUsageLog.create({
      userId,
      role: String(role || 'student').toLowerCase(),
      feature,
      tokensUsed: tokensUsed || 0,
    });
  } catch (err) {
    console.error('Failed to log AI usage:', err.message);
  }
}

/**
 * @desc    Get plain-language explanation and complexity for standard DSA algorithms
 * @route   POST /api/ai/algorithms/explain-algorithm
 * @access  Private
 */
exports.explainAlgorithm = async (req, res) => {
  try {
    const { algorithmName } = req.body;
    if (!algorithmName) {
      return res.status(400).json({ message: 'Algorithm name is required.' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are a Computer Science professor explaining algorithms.
Explain the requested algorithm clearly. Provide a structured response exactly in this JSON format:
{
  "explanation": "A clear, engaging 2-paragraph explanation of how the algorithm works.",
  "timeComplexity": "e.g., O(N^2) average, O(N) best case...",
  "spaceComplexity": "e.g., O(1) auxiliary space"
}`
      },
      {
        role: 'user',
        content: `Please explain the algorithm: ${algorithmName}`
      }
    ];

    const { reply, usage } = await getChatCompletion(messages, { 
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    await logUsage(req.user?.id, req.user?.role, 'explain-algorithm', usage?.total_tokens || 0);

    const parsed = JSON.parse(reply.trim());
    return res.json(parsed);

  } catch (error) {
    console.error('Explain algorithm error:', error);
    return res.status(500).json({ message: 'Failed to explain algorithm.', error: error.message });
  }
};

/**
 * @desc    Generate flowchart JSON explaining actual system logic rules
 * @route   POST /api/ai/algorithms/explain-system/:logicType
 * @access  Private
 */
exports.explainSystemLogic = async (req, res) => {
  try {
    const { logicType } = req.params;

    let logicRules = '';
    let title = '';

    if (logicType === 'fine-calculation') {
      title = 'Overdue Fine Calculation Logic';
      logicRules = `
1. The cron job runs daily at 00:05.
2. It finds all Approved BorrowRequests where dueDate is less than the current time.
3. It calculates daysOverdue = Math.floor((now - dueDate) / (1000*60*60*24)).
4. It checks if fines were already charged (lastFineCalcAt). If lastFineCalcAt > dueDate, chargedDays = Math.floor((lastFineCalcAt - dueDate) / (1000*60*60*24)).
5. newDays = Math.max(0, daysOverdue - chargedDays).
6. If newDays > 0, calculate additionalFine = newDays * DAILY_FINE_RATE (which is 10 BDT).
7. Add additionalFine to the borrow request's fineAccrued.
8. Update lastFineCalcAt to reflect the new charged days.
9. Generate a notification to the user about the accrued fine.
      `;
    } else if (logicType === 'book-recommendation') {
      title = 'Student Book Recommendation Logic';
      logicRules = `
1. Fetch the student's past borrowing history and get unique titles, authors, and categories.
2. Fetch all books from the library inventory that have availableCopies > 0.
3. Score each available book based on keyword matches with the student's stated interests and the specified target subject (if any).
4. Take the top 100 highest-scoring available books and pass them to an AI recommendation engine.
5. The AI selects the 5 most relevant books from that exact list of 100 and generates a 1-line reason for each.
6. The system verifies the 5 AI-selected books still have availableCopies > 0 in the database.
7. Return the validated 5 books to the frontend.
      `;
    } else if (logicType === 'book-renewal') {
      title = 'Book Renewal Logic';
      logicRules = `
1. A student requests to renew a currently borrowed book.
2. The system checks if the book has already reached its maxRenewals limit (default is 2).
3. If renewalCount >= maxRenewals, the renewal is rejected.
4. If allowed, the system increments the renewalCount by 1.
5. The dueDate is extended by the standard DAY_ALLOWANCE (default 14 days) from the CURRENT dueDate (not from today).
6. The system saves the BorrowRequest and notifies the user of the new due date.
      `;
    } else {
      return res.status(400).json({ message: 'Invalid logic type.' });
    }

    const messages = [
      {
        role: 'system',
        content: `You are a system architecture expert. I will provide you with the exact logic rules of a feature in our library system.
You need to convert this logic into a flowchart.

Output EXACTLY in this JSON format compatible with React Flow:
{
  "title": "Title of the logic",
  "narrative": "A concise paragraph explaining the logic step-by-step for the user.",
  "nodes": [
    { "id": "1", "data": { "label": "Start" }, "type": "input", "position": { "x": 0, "y": 0 } },
    { "id": "2", "data": { "label": "Condition?" }, "type": "default", "position": { "x": 0, "y": 0 } }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2", "label": "yes/no/etc (optional)" }
  ]
}

Ensure node IDs are strings. Edge IDs should be "e{source}-{target}". Set all node positions to { "x": 0, "y": 0 } (we will calculate layout automatically on the frontend).
Use "input" type for the start node, "output" for the end nodes, and "default" for intermediate steps/decisions.`
      },
      {
        role: 'user',
        content: `Logic Title: ${title}\nRules:\n${logicRules}`
      }
    ];

    const { reply, usage } = await getChatCompletion(messages, { 
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    await logUsage(req.user?.id, req.user?.role, 'explain-system', usage?.total_tokens || 0);

    const parsed = JSON.parse(reply.trim());
    return res.json(parsed);

  } catch (error) {
    console.error('Explain system logic error:', error);
    return res.status(500).json({ message: 'Failed to explain system logic.', error: error.message });
  }
};
