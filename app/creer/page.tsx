import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default function CreerPari() {
  async function action(formData: FormData) {
    "use server";

    const titre = formData.get("titre");
    const issue_1 = formData.get("issue_1");
    const issue_2 = formData.get("issue_2");
    const echeance = formData.get("echeance");

    // Envoi à la base de données (status 'en_attente' par défaut)
    const { error } = await supabase.from("paris").insert([
      {
        titre,
        issue_1,
        issue_2,
        echeance,
        status: "en_attente",
      },
    ]);

    if (!error) {
      redirect("/"); // Retour à l'accueil après succès
    }
  }

  return (
    <main style={{ padding: "20px", maxWidth: "500px", margin: "auto", fontFamily: "serif" }}>
      <h2>Proposer un nouveau pari</h2>
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input name="titre" placeholder="Titre du pari (ex: Untel fait...)" required />
        <input name="issue_1" placeholder="Issue 1 (ex: Oui)" required />
        <input name="issue_2" placeholder="Issue 2 (ex: Non)" required />
        <label>
          Échéance : <input type="datetime-local" name="echeance" required />
        </label>
        <button type="submit" style={{ padding: "10px", cursor: "pointer" }}>
          Soumettre pour validation admin
        </button>
      </form>
      <br />
      <a href="/">[ Retour ]</a>
    </main>
  );
}