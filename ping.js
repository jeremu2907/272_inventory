// https://www.val.town/


export function scheduledHandler() {
  fetch("https://two72-inventory.onrender.com/chest/search?term=divider")
    .then((res) => console.log("Server app received"));

  fetch("https://toolhub272.onrender.com/")
    .then((res) => console.log("Client app received"));
}