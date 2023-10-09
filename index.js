//TO DO
//add undo function
//name, save, and load list?
//show history list by frequency and recency
//delete all left, check all right, clear checked middle

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  set
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
  databaseURL: "https://playground-3bec0-default-rtdb.firebaseio.com/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
let groupId

const inputFieldEl = document.getElementById("input-field")
const addButtonEl = document.getElementById("add-button")
const shoppingListEl = document.getElementById("shopping-list")
const multiOptionsEl = document.getElementById("multi-options")

if (localStorage.getItem("group-ids") === null) {
  const newGroupId = String(Date.now())
  localStorage.setItem("group-ids", JSON.stringify([newGroupId]))
}

groupId = JSON.parse(localStorage.getItem("group-ids"))[0]
const shoppingListInDB = ref(database, groupId)

inputFieldEl.addEventListener("keyup", function (e) {
  e.preventDefault()
  if (e.key === "Enter") {
    addButtonEl.click()
  }
})

addButtonEl.addEventListener("click", addInputToList)
shoppingListEl.addEventListener("click", deleteItem)
shoppingListEl.addEventListener("click", editItem)
shoppingListEl.addEventListener("click", toggleHighlight)
multiOptionsEl.addEventListener("click", deleteAllItems)
multiOptionsEl.addEventListener("click", markAllItems)
multiOptionsEl.addEventListener("click", unmarkAllItems)

onValue(shoppingListInDB, function (snapshot) {
  if (snapshot.exists()) {
    let itemsArray = Object.entries(snapshot.val())
    clearShoppingListEl()
    for (let i = 0; i < itemsArray.length; i++) {
      let currentItem = itemsArray[i]
      appendItemToShoppingListEl(currentItem)
    }
    multiOptionsEl.hidden = false
  } else {
    shoppingListEl.innerHTML = "No items here...yet"
    multiOptionsEl.hidden = true
  }
})

function toggleHighlight(e) {
  if (e.target.classList.contains("mark")) {
    const li = e.target.parentElement
    if (li.classList.contains("item")) {
      const itemID = li.id
      const itemHighlighted = li.dataset.itemHighlighted === "true"
      set(
        ref(database, `${groupId}/${itemID}/itemHighlighted`),
        !itemHighlighted
      )
    }
  }
}

function deleteItem(e) {
  if (e.target.classList.contains("delete")) {
    const itemID = e.target.parentElement.id
    let exactLocationOfItemInDB = ref(database, `${groupId}/${itemID}`)
    remove(exactLocationOfItemInDB)
  }
}

function markAllItems(e) {
  if (e.target.classList.contains("mark-all")) {
    Array.from(shoppingListEl.children).forEach(li => {
      if (li.dataset.itemHighlighted !== "true") {
        const itemID = li.id
        set(ref(database, `${groupId}/${itemID}/itemHighlighted`), true)
      }
    })
  }
}

function unmarkAllItems(e) {
  if (e.target.classList.contains("unmark-all")) {
    Array.from(shoppingListEl.children).forEach(li => {
      if (li.dataset.itemHighlighted !== "false") {
        const itemID = li.id
        set(ref(database, `${groupId}/${itemID}/itemHighlighted`), false)
      }
    })
  }
}

function deleteAllItems(e) {
  if (e.target.classList.contains("delete-all")) {
    if (confirm("Delete all items from current list?") === true) {
      while (shoppingListEl.firstChild.id) {
        const itemID = shoppingListEl.firstChild.id
        let exactLocationOfItemInDB = ref(database, `${groupId}/${itemID}`)
        remove(exactLocationOfItemInDB)
      }
    }
  }
}

function saveEditedItem(e) {
  const li = e.target.parentElement
  if (li.classList.contains("item")) {
    const itemID = li.id
    set(ref(database, `${groupId}/${itemID}/itemName`), e.target.textContent)
  }
  e.target.removeEventListener("blur", saveEditedItem)
}

function editItem(e) {
  if (e.target.classList.contains("item-text")) {
    e.target.addEventListener("blur", saveEditedItem)
  }
}

function appendItemToShoppingListEl(item) {
  const itemID = item[0]
  const { itemName, itemHighlighted } = item[1]
  const li = makeNewEl("li", "item")
  const itemText = makeNewEl("div", "item-text", itemName)
  const deleteBtn = makeNewEl("button", "delete", "X")
  const markBtn = makeNewEl("button", "mark", "✔️")

  li.id = itemID
  li.dataset.itemHighlighted = itemHighlighted
  applyHighlightStatus(item, li)

  itemText.setAttribute("contenteditable", "plaintext-only")

  shoppingListEl.append(li)
  li.appendChild(deleteBtn)
  li.appendChild(itemText)
  li.appendChild(markBtn)
  applyHighlightStatus(item, li)
}

function makeNewEl(tag = "div", classes = "newEl", text) {
  const el = document.createElement(tag)
  el.className = classes
  if (text) {
    el.appendChild(document.createTextNode(text))
  }
  return el
}

function applyHighlightStatus(item, li) {
  if (item[1].itemHighlighted) {
    li.style.borderColor = "#00FF00"
  } else {
    li.style.borderColor = "transparent"
  }
}

function clearShoppingListEl() {
  shoppingListEl.innerHTML = ""
}

function clearInputFieldEl() {
  inputFieldEl.value = ""
}

function addInputToList(e) {
  e.preventDefault()
  let inputValue = inputFieldEl.value
  if (inputValue !== "") {
    let item = { itemName: inputValue, itemHighlighted: false }
    push(shoppingListInDB, item)
    clearInputFieldEl()
  }
}
