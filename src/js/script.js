
const MenuBtn = document.querySelector(".menu-btn")
const PhoneMenu = document.querySelector(".phone-menu");
const CloseMenu = document.querySelector(".close-menu");
const menuOptions = document.querySelectorAll(".menu-options"); 
window.addEventListener("scroll", ()=>{
    const navbar = document.querySelector(".navbar");
    if(window.scrollY > 20){
        navbar.classList.add("scrolled");
    } else{
        navbar.classList.remove("scrolled");
    }
});

MenuBtn.addEventListener("click", ()=>{
    PhoneMenu.classList.remove("hide");
    document.body.style.overflow = "hidden";
});

CloseMenu.addEventListener("click", ()=>{
    PhoneMenu.classList.add("hide");
    document.body.style.overflow = "";
});
menuOptions.forEach((option)=>{
    option.addEventListener("click", ()=>{
        PhoneMenu.classList.add("hide");
        document.body.style.overflow = "";
    })
})

const redirectToLogin = () => {
    window.location.href = "auth.html"
}