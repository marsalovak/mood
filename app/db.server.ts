const database = "3it_marsalovak23";
const username = "marsalovak23";
const password = "9jWnrwT1Bz";
const server = "localhost";

export async function sql(query: string) {
  const url = "http://marcincin.epsilon.spstrutnov.cz/gate.php";
  const postJson = JSON.stringify({
    database: database,
    username: username,
    password: password,
    server: server,
    sql: query,
  });

  try {
    const response = await fetch(url, { method: "POST", body: postJson });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error: any) {
    console.error("SQL Error:", error.message);
    return [];
  }
}
