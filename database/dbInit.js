import { createUsersTable } from "./tableInit.js";

export default async function dbInit() {
  await createUsersTable();
}
