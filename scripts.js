document.addEventListener("DOMContentLoaded", () => {
    // Add smooth scrolling for navigation links
    const navLinks = document.querySelectorAll(".navbar-link");
    
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            if (href.startsWith("#")) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: "smooth",
                    });
                }
            }
        });
    });
});