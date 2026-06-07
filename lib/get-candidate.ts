import { query } from "@/lib/database"

export async function getCandidateById(id: string) {
  const candidateResult = await query(
    `SELECT 
      c.*,
      u.full_name as created_by_name
    FROM candidates c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = $1`,
    [id],
  )

  if (candidateResult.rows.length === 0) {
    return null
  }

  const experienceResult = await query(
    `SELECT * FROM experience_details WHERE candidate_id = $1 ORDER BY created_at`,
    [id],
  )

  const technicalQualResult = await query(
    `SELECT * FROM technical_qualification_details WHERE candidate_id = $1 ORDER BY created_at`,
    [id],
  )

  const certificatesResult = await query(
    `SELECT * FROM candidate_certificates WHERE candidate_id = $1 ORDER BY created_at`,
    [id],
  )

  return {
    ...candidateResult.rows[0],
    experience_details: experienceResult.rows,
    technical_qualification_details: technicalQualResult.rows,
    certificate_attachments: certificatesResult.rows,
  }
}
