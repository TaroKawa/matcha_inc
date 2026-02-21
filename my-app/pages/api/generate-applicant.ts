// ============================
// API: Generate Applicant Profile via Gemini
// ============================

import type { NextApiRequest, NextApiResponse } from 'next';
import { generateFullApplicantProfile } from '@/lib/gemini';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { existingNames } = req.body;
    const profile = await generateFullApplicantProfile(Array.isArray(existingNames) ? existingNames : []);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Generate applicant failed:', error);
    res.status(500).json({ error: 'Failed to generate applicant' });
  }
}
