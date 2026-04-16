import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { pariId, issue, montant, userId } = await request.json();

  // 1. On enregistre la mise
  const { error: miseError } = await supabase
    .from('mises')
    .insert([{ pari_id: pariId, issue_choisie: issue, montant: montant, user_id: userId }]);

  // 2. On déduit les Golembucks du profil
  // Note: En V1, on simplifie sans vérifier le solde, on le fera après.
  const { error: profileError } = await supabase.rpc('deduire_bucks', { 
    user_id: userId, 
    montant_a_oter: montant 
  });

  return NextResponse.json({ success: !miseError });
}