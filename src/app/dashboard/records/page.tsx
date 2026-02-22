import { redirect } from "next/navigation";

export default function RecordsRedirect() {
  redirect("/dashboard/explorer");
}
