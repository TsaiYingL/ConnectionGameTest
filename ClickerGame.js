const spnLeft = document.getElementById("spnLeft");
const spnRight = document.getElementById("spnRight");

let left = 10;
let right = 10;

spnLeft.addEventListener("click", () => {
    left += 1;
    right -= 1;
    spnLeft.style.flex = left;
    spnRight.style.flex = right;
});

spnRight.addEventListener("click", () => {
    left -= 1;
    right += 1;
    spnLeft.style.flex = left;
    spnRight.style.flex = right;
});