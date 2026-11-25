
/* =========================================
   NCODE MANAGER - ANIMATION ENGINE
========================================= */

(() => {

    const view = document.getElementById("view");
    const title = document.getElementById("title");

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    );

    let animationFrame = null;

    function animatePage() {

        if (reducedMotion.matches || !view) {
            return;
        }

        const panels = view.querySelectorAll(
            ".panel"
        );

        panels.forEach((panel, index) => {

            panel.style.setProperty(
                "--delay",
                `${Math.min(index * 65, 325)}ms`
            );

            panel.classList.add("animate-in");

        });

        if (title) {

            title.classList.remove("animate-title");

            void title.offsetWidth;

            title.classList.add("animate-title");

        }

    }

    function scheduleAnimation() {

        if (animationFrame !== null) {

            cancelAnimationFrame(animationFrame);

        }

        animationFrame = requestAnimationFrame(() => {

            animatePage();

            animationFrame = null;

        });

    }

    if (view) {

        const observer = new MutationObserver(
            (mutations) => {

                const pageChanged = mutations.some(
                    mutation => mutation.type === "childList"
                );

                if (pageChanged) {
                    scheduleAnimation();
                }

            }
        );

        observer.observe(view, {
            childList: true
        });

    }

    scheduleAnimation();

})();
