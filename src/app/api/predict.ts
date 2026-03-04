export async function predictAPI(values: number[]) {
  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ values })
    });

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("API Error:", error);
    return { error: "API connection failed" };
  }
}
