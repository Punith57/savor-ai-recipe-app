const recipes = [
  { id: "miso", title: "Miso butter noodles", subtitle: "Silky, savory and ready before you can set the table.", time: "15 min", type: "Quick & easy", tag: "WEEKDAY WIN", emoji: "🍜", color: "#d8c48b", author: "by Savor Kitchen", filters: ["quick", "comfort"] },
  { id: "harissa", title: "Harissa roast chicken", subtitle: "Golden chicken with a bright, smoky kick.", time: "45 min", type: "Dinner", tag: "MOST LOVED", emoji: "🍗", color: "#dfa073", author: "by Nia Santos", filters: ["comfort"] },
  { id: "green", title: "Green goddess grain bowl", subtitle: "Crunchy greens, grains, and a tangy herb dressing.", time: "20 min", type: "Vegetarian", tag: "FEEL-GOOD FOOD", emoji: "🥗", color: "#b9c990", author: "by Savor Kitchen", filters: ["vegetarian", "quick"] },
  { id: "tomato", title: "Slow tomato toast", subtitle: "Jammy tomatoes and ricotta on crisp sourdough.", time: "18 min", type: "Vegetarian", tag: "BRUNCH", emoji: "🍅", color: "#e8a68d", author: "by Mia Lee", filters: ["vegetarian", "quick"] },
  { id: "curry", title: "Coconut chickpea curry", subtitle: "A warmly spiced bowl for cold, busy nights.", time: "35 min", type: "Vegan", tag: "PANTRY HERO", emoji: "🍛", color: "#e2c35f", author: "by Savor Kitchen", filters: ["vegetarian", "comfort"] },
  { id: "salmon", title: "Crisp salmon rice bowl", subtitle: "Tender salmon with sesame rice and bright pickles.", time: "25 min", type: "Dinner", tag: "FRESH FAVORITE", emoji: "🍣", color: "#a9cbd1", author: "by Theo Park", filters: [] }
];

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};
let pantry = store.get("savor-pantry", ["chickpeas", "lemon"]);
let saved = store.get("savor-saved", []);
let activeFilter = "all";

const $ = (selector) => document.querySelector(selector);
const grid = $("#recipeGrid"), savedGrid = $("#savedGrid");

function card(recipe) {
  const node = $("#recipeTemplate").content.cloneNode(true);
  const article = node.querySelector("article");
  article.dataset.id = recipe.id;
  const image = node.querySelector(".recipe-image");
  image.style.setProperty("--bg", recipe.color);
  node.querySelector(".recipe-emoji").textContent = recipe.emoji;
  node.querySelector(".tag").textContent = recipe.tag;
  node.querySelector(".time").textContent = recipe.time;
  node.querySelector(".type").textContent = recipe.type;
  node.querySelector("h3").textContent = recipe.title;
  node.querySelector(".recipe-info > p").textContent = recipe.subtitle;
  node.querySelector(".author").textContent = recipe.author;
  const save = node.querySelector(".save-button");
  save.classList.toggle("saved", saved.includes(recipe.id));
  save.textContent = saved.includes(recipe.id) ? "♥" : "♡";
  save.addEventListener("click", () => toggleSaved(recipe.id));
  node.querySelector(".view-recipe").addEventListener("click", () => askChef(`Give me the full recipe for ${recipe.title}.`));
  return node;
}
function renderRecipes() {
  grid.innerHTML = "";
  recipes.filter(r => activeFilter === "all" || r.filters.includes(activeFilter)).forEach(r => grid.append(card(r)));
}
function renderSaved() {
  savedGrid.innerHTML = "";
  recipes.filter(r => saved.includes(r.id)).forEach(r => savedGrid.append(card(r)));
  $("#savedEmpty").hidden = saved.length > 0;
  $("#savedCount").textContent = saved.length;
}
function toggleSaved(id) { saved = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id]; store.set("savor-saved", saved); renderRecipes(); renderSaved(); }
function renderPantry() {
  const target = $("#pantryTags"); target.innerHTML = "";
  pantry.forEach((item, i) => { const tag = document.createElement("span"); tag.className = "pantry-tag"; tag.innerHTML = `${escapeHtml(item)} <button aria-label="Remove ${escapeHtml(item)}" data-index="${i}">×</button>`; target.append(tag); });
  target.querySelectorAll("button").forEach(button => button.addEventListener("click", () => { pantry.splice(Number(button.dataset.index), 1); store.set("savor-pantry", pantry); renderPantry(); }));
}
function escapeHtml(value) { const element = document.createElement("div"); element.textContent = value; return element.innerHTML; }

$("#pantryForm").addEventListener("submit", e => { e.preventDefault(); const input = $("#pantryInput"), item = input.value.trim(); if (item && !pantry.includes(item.toLowerCase())) { pantry.push(item.toLowerCase()); store.set("savor-pantry", pantry); renderPantry(); } input.value = ""; });
$("#cookPantry").addEventListener("click", () => askChef(`Create a dinner recipe using as many of my available pantry ingredients as possible: ${pantry.join(", ")}.`));
document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => { document.querySelector(".filter.active").classList.remove("active"); button.classList.add("active"); activeFilter = button.dataset.filter; renderRecipes(); }));
$("#showAll").addEventListener("click", () => { activeFilter = "all"; document.querySelector(".filter.active").classList.remove("active"); document.querySelector('[data-filter="all"]').classList.add("active"); renderRecipes(); $("#recipes").scrollIntoView(); });
document.querySelectorAll("[data-scroll]").forEach(button => button.addEventListener("click", () => $(`#${button.dataset.scroll}`).scrollIntoView()));
document.querySelectorAll("[data-prompt]").forEach(button => button.addEventListener("click", () => askChef(button.dataset.prompt)));
$("#clearChat").addEventListener("click", () => { $("#chatLog").innerHTML = '<div class="message assistant"><span class="message-icon">✦</span><p>Fresh start. What sounds good?</p></div>'; });

function addMessage(text, role = "assistant") { const message = document.createElement("div"); message.className = `message ${role}`; if (role === "assistant") message.innerHTML = '<span class="message-icon">✦</span>'; const p = document.createElement("p"); p.textContent = text; message.append(p); $("#chatLog").append(message); $("#chatLog").scrollTop = $("#chatLog").scrollHeight; return message; }
async function askChef(text) {
  const input = $("#chefInput"), button = $("#sendButton");
  const question = (text || input.value).trim(); if (!question) return;
  input.value = ""; addMessage(question, "user");
  const typing = addMessage("Thinking through it…", "assistant typing"); button.disabled = true;
  try {
    const response = await fetch("/api/chef", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question, pantry }) });
    const data = await response.json(); typing.remove(); addMessage(data.reply || data.error || "Sorry, something went wrong.", data.reply ? "assistant" : "error");
  } catch { typing.remove(); addMessage("I couldn't connect to the kitchen right now. Please try again.", "error"); }
  finally { button.disabled = false; input.focus(); }
}
$("#chefForm").addEventListener("submit", e => { e.preventDefault(); askChef(); });
$("#chefInput").addEventListener("input", e => { e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 90)}px`; });

renderPantry(); renderRecipes(); renderSaved();
