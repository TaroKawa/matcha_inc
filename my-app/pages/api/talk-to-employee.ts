// ============================
// API: Talk to Employee via Gemini
// ============================

import type { NextApiRequest, NextApiResponse } from 'next';
import { talkToEmployee } from '@/lib/gemini';
import { Employee } from '@/types/game';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { employee, playerMessage, context } = req.body as {
      employee: Employee;
      playerMessage: string;
      context: {
        storeName: string;
        isSabotaging: boolean;
        motivation: number;
        fatigue: number;
        weeksEmployed: number;
      };
    };

    const result = await talkToEmployee(employee, playerMessage, context);
    res.status(200).json(result);
  } catch (error) {
    console.error('Talk to employee failed:', error);
    res.status(500).json({ error: 'Failed to talk to employee' });
  }
}
