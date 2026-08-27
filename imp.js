export function getinput(input){
    const inn = document.getElementById(input);
    return inn.value;
};
export function change(input, text){
    const inv = document.getElementById(input);
    inv.value = text;
};
export function ct(id, new){
    const inv = document.getElementById(input);
    inv.innerHTML = new;
};
