// ============================
// API: Conduct Interview via Gemini
// ============================

import type { NextApiRequest, NextApiResponse } from 'next';
import { conductInterview } from '@/lib/gemini';
import { Employee, ConversationMessage } from '@/types/game';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employee, playerMessage, conversationHistory } = req.body as {
      employee: Employee;
      playerMessage: string;
      conversationHistory: ConversationMessage[];
    };

    const result = await conductInterview(employee, playerMessage, conversationHistory);
    res.status(200).json(result);
  } catch (error) {
    console.error('Interview failed:', error);
    res.status(500).json({ error: 'Failed to conduct interview' });
  }
}
