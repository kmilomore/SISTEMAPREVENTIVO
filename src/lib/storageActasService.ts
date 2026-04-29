import { supabase } from '../lib/supabase'

const BUCKET = 'actas-visita'

export async function uploadActaPdf(
  id: string,
  pdfBytes: Uint8Array,
): Promise<{ path: string | null; url: string | null; error: string | null }> {
  if (!supabase) return { path: null, url: null, error: 'Supabase no inicializado.' }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const filePath = `${year}/${month}/${id}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return { path: null, url: null, error: uploadError.message }
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  const publicUrl = urlData?.publicUrl ?? null

  return { path: filePath, url: publicUrl, error: null }
}
