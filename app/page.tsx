import { redirect } from "next/navigation";
import { obtenerMiembroId } from "@/lib/session";
import { getMiembro } from "@/lib/data";

export default async function Portada() {
  const id = await obtenerMiembroId();
  if (!id) redirect("/login");
  const miembro = getMiembro(id);
  if (!miembro) redirect("/login");
  redirect(
    miembro.rol === "parent"
      ? `/f/${miembro.familia_id}/padre`
      : `/f/${miembro.familia_id}/hijo`
  );
}