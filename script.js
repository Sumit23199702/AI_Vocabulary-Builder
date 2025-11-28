const searchBtn = document.getElementById("searchBtn");
const wordInput = document.getElementById("wordInput");
const resultBox = document.getElementById("resultBox");
const wordTitle = document.getElementById("wordTitle");
const wordMeaning = document.getElementById("wordMeaning");
const wordExample = document.getElementById("wordExample");
const wordSynonyms = document.getElementById("wordSynonyms");
const wordAntonyms = document.getElementById("wordAntonyms");
const saveBtn = document.getElementById("saveBtn");
const wordList = document.getElementById("wordList");
const loading = document.getElementById("loading");
const quizBox = document.getElementById("quizBox");
const quizQuestion = document.getElementById("quizQuestion");
const quizAnswer = document.getElementById("quizAnswer");
const checkQuiz = document.getElementById("checkQuiz");
const quizResult = document.getElementById("quizResult");

let savedWords = JSON.parse(localStorage.getItem("wordBank")) || [];
displaySavedWords();

const API_KEY = "AIzaSyDjmxL0-cUl3Gq7pw1xWoj0VZqQQidcHOI";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Api Call
async function getWordDetails(word) {
  loading.classList.remove("hidden");
  resultBox.classList.add("hidden");
  quizBox.classList.add("hidden");

  const prompt = `
Explain the English word "${word}" with:
1. Meaning
2. Example sentence
3. 3 synonyms
4. 3 antonyms
5. A simple fill-in-the-blank quiz with 'question' and 'answer' keys.

Return ONLY JSON with keys: meaning, example, synonyms, antonyms, quiz.
Quiz should look like: {"question": "The cat ___ on the mat.", "answer": "sat"}.
`;

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generation_config: { temperature: 0.7 },
      }),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const data = await res.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("No response from Gemini API");

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return JSON");

    const parsed = JSON.parse(jsonMatch[0]);

    loading.classList.add("hidden");
    return parsed;
  } catch (err) {
    loading.classList.add("hidden");
    alert("Failed to fetch or parse AI response. Check console.");
    console.error(err);
    return null;
  }
}

// Search Word
searchBtn.addEventListener("click", async () => {
  const word = wordInput.value.trim();
  if (!word) return alert("Please enter a word!");

  const details = await getWordDetails(word);
  if (!details) return;

  wordTitle.textContent = word.charAt(0).toUpperCase() + word.slice(1);
  wordMeaning.textContent = `Meaning: ${details.meaning || "Not found"}`;
  wordExample.textContent = `Example: "${details.example || "Not available"}"`;
  wordSynonyms.textContent = `Synonyms: ${(details.synonyms || []).join(", ")}`;
  wordAntonyms.textContent = `Antonyms: ${(details.antonyms || []).join(", ")}`;

  resultBox.classList.remove("hidden");

  quizQuestion.textContent = details.quiz?.question || "No quiz generated.";
  quizBox.classList.remove("hidden");
  quizBox.dataset.answer = details.quiz?.answer || "";
  quizAnswer.value = "";
  quizResult.textContent = "";
});

// Save Words To Local Storage
saveBtn.addEventListener("click", () => {
  const word = wordTitle.textContent;
  if (!savedWords.includes(word)) {
    savedWords.push(word);
    localStorage.setItem("wordBank", JSON.stringify(savedWords));
    displaySavedWords();
    alert("Word saved successfully!");
  } else {
    alert("This word is already saved!");
  }
});

// Show Saved Word From Local Storage
function displaySavedWords() {
  wordList.innerHTML = "";
  savedWords.forEach((word) => {
    const li = document.createElement("li");
    li.innerHTML = `${word} <button class="text-red-500 ml-2" onclick="deleteWord('${word}')">❌</button>`;
    wordList.appendChild(li);
  });
}

// Delete Word From Local Storage
function deleteWord(word) {
  savedWords = savedWords.filter((w) => w !== word);
  localStorage.setItem("wordBank", JSON.stringify(savedWords));
  displaySavedWords();
}

// Enter Button
wordInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchBtn.click();
  }
});

// Check Quiz
checkQuiz.addEventListener("click", () => {
  let userAns = quizAnswer.value.trim().toLowerCase();
  let correctAns = quizBox.dataset.answer.toLowerCase() || "";

  if (!correctAns) {
    quizResult.innerHTML = "No Answer Available For This Quiz";
    quizResult.classList.add("text-red-600");
    return;
  }

  if (userAns === correctAns) {
    quizResult.innerHTML = "✅ Correct Answer";
    quizResult.classList.add("text-green-600");
  } else {
    quizResult.innerHTML = `❌ Wrong Answer ! Correct Answer : ${correctAns}`;
    quizResult.classList.add("text-red-600");
  }
});
