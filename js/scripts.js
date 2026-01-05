let game=null,currentCell=null,currentValue="0";
let editMode=false;

/* juego */
function newGame(){
  if(!gameName.value) return;
  game={name:gameName.value,players:[],sections:[],scores:{},background:""};
  showGame();
}
function showGame(){
  config.style.display="block";
  title.innerText=game.name;
  document.body.style.backgroundImage=game.background?`url(${game.background})`:"none";
  render();updateSavedGames();
}
function setBackground(){
  game.background=bgUrl.value;
  document.body.style.backgroundImage=`url(${game.background})`;
}

/* jugadores */
function addPlayer(){
  const p=playerName.value;
  if(!p||game.players.includes(p)) return;
  game.players.push(p);game.scores[p]={};render();
}
function movePlayer(i,d){
  const j=i+d;if(j<0||j>=game.players.length) return;
  [game.players[i],game.players[j]]=[game.players[j],game.players[i]];
  render();
}
function removePlayer(i){
  const p=game.players[i];
  game.players.splice(i,1);
  delete game.scores[p];
  render();
}

/* apartados */
function addSection(){
  const s=sectionName.value;
  if(!s) return;
  game.sections.push({name:s,mult:Number(mult.value)});
  render();
}
function moveSection(i,d){
  const j=i+d;if(j<0||j>=game.sections.length) return;
  [game.sections[i],game.sections[j]]=[game.sections[j],game.sections[i]];
  render();
}
function removeSection(i){
  const s=game.sections[i].name;
  game.sections.splice(i,1);
  game.players.forEach(p=>delete game.scores[p][s]);
  render();
}

/* teclado */
function openKeypad(sec,p){
  currentCell={sec,p};
  currentValue=String(game.scores[p][sec]||0);
  display.innerText=currentValue;
  keypadOverlay.style.display="flex";
}
function press(v){
  currentValue=v==='-'?
    (currentValue.startsWith('-')?currentValue.slice(1):'-'+currentValue):
    (currentValue==="0"?v:currentValue+v);
  display.innerText=currentValue;
}
function clearDisplay(){currentValue="0";display.innerText=currentValue}
function cancelKeypad(){keypadOverlay.style.display="none"}
function confirmKeypad(){
  game.scores[currentCell.p][currentCell.sec]=Number(currentValue)||0;
  keypadOverlay.style.display="none";render();
}
function closeKeypad(e){if(e.target.id==="keypadOverlay")cancelKeypad()}

/* tabla */
function render(){
  let tableClass = editMode ? 'edit-mode' : 'compact';
  let h=`<div style='overflow-x:auto'><table class="${tableClass}"><thead><tr><th>Item</th>`;
  game.players.forEach((p,i)=>h+=`
    <th>
      <div>${p}</div>
      <div class="ctrl">
        <button class="ctrl-btn move" onclick="movePlayer(${i},-1)">◀</button>
        <button class="ctrl-btn move" onclick="movePlayer(${i},1)">▶</button>
        <button class="ctrl-btn del" onclick="removePlayer(${i})">✖</button>
      </div>
    </th>`);
  h+="</tr></thead><tbody>";

  game.sections.forEach((s,i)=>{
    h+=`
    <tr>
      <td>${s.name} ×${s.mult}
        <div class="ctrl">
          <button class="ctrl-btn move" onclick="moveSection(${i},-1)">▲</button>
          <button class="ctrl-btn move" onclick="moveSection(${i},1)">▼</button>
          <button class="ctrl-btn del" onclick="removeSection(${i})">✖</button>
        </div>
      </td>`;
    game.players.forEach(p=>{
      h+=`<td class="score" onclick="openKeypad('${s.name}','${p}')">${game.scores[p][s.name]||0}</td>`;
    });
    h+="</tr>";
  });

  // fila de totales
  h+="<tr style='font-weight:bold;background:#e0e0e0'><td>Total</td>";
  game.players.forEach(p=>{
    let total=0;
    game.sections.forEach(s=>{
      let v=game.scores[p][s.name]||0;
      total += v*s.mult;
    });
    h+=`<td>${total}</td>`;
  });
  h+="</tr>";

  h+="</tbody></table></div>";
  table.innerHTML=h;
}

/* Modo edición */
function toggleEdit(){
  editMode=!editMode;
  toggleEdit.innerText = editMode ? "Modo Normal" : "Modo Edición";
  render();
}

const STORAGE_KEY = "allGames"; // Aquí guardamos la lista de juegos

/* Guardar o actualizar el juego actual */
function saveGame() {
  if(!game) return;

  let allGames = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  // buscar si ya existe un juego con el mismo nombre y actualizarlo
  const idx = allGames.findIndex(g => g.name === game.name);
  const savedGame = {
    name: game.name,
    players: game.players,
    sections: game.sections,
    background: game.background
  };

  if(idx >= 0) allGames[idx] = savedGame;
  else allGames.push(savedGame);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(allGames));
  updateSavedGames();
}

/* Cargar un juego por índice en la lista */
function loadGame() {
  const idx = savedGames.selectedIndex - 1; // -1 porque la primera opción es "-- Games --"
  if(idx < 0) return;

  const allGames = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const data = allGames[idx];
  if(!data) return;

  game = {...data, scores:{}};
  data.players.forEach(p => game.scores[p] = {});
  showGame();
}

/* Actualizar <select> de juegos */
function updateSavedGames() {
  savedGames.innerHTML = "<option value=''>-- Games --</option>";
  const allGames = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  allGames.forEach((g, i) => {
    savedGames.innerHTML += `<option value="${i}">${g.name}</option>`;
  });
}

/* Exportar todos los juegos */
function exportAllGames() {
  const allGames = localStorage.getItem(STORAGE_KEY) || "[]";
  exportArea.value = allGames;
}

/* Importar todos los juegos */
function importAllGames() {
  try {
    const imported = JSON.parse(importArea.value);
    if(!Array.isArray(imported)) throw "JSON inválido";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
    updateSavedGames();
    alert("Todos los juegos importados correctamente");
  } catch(e) {
    alert("JSON inválido");
  }
}

/* Inicialización al cargar la página */
window.onload = () => {
  updateSavedGames();
  const allGames = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  if(allGames.length > 0){
    const data = allGames[0];
    game = {...data, scores:{}};
    data.players.forEach(p => game.scores[p] = {});
    showGame();
  } else {
    game = {name:"Nuevo Juego", players:[], sections:[], scores:{}, background:""};
    showGame();
  }
};