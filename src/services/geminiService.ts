/**
 * AdiJEE Service: Gemini Bridge
 * Redirects AI calls to our local server to leverage the free bridge logic.
 */

export async function solveDoubt(question: string): Promise<string> {
  try {
    // We hit our own local backend instead of the official Google API
    const response = await fetch("/api/ask-jee", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        question,
        // Optional: Pass student context if needed
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();

    // Ensure we handle the structured response from our server
    if (data.answer) {
      return data.answer;
    }

    return "I'm sorry, I processed the question but couldn't generate a clear explanation. Let's try rephrasing.";

  } catch (error) {
    console.error("AdiJEE AI Bridge Error:", error);
    return "⚠️ Connection to the Zenith AI Hub was interrupted. Please check if the server is running on your ROG Strix.";
  }
}
