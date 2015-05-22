export default class Animation {
    constructor(opts) {
        this.el = opts.el;
        this.animationEl = opts.el;
        this.animationEl.innerHTML = this.HTML;
        this.peopleAnimEl = this.el.querySelector('.ug16__anim--people')
        this.startAnimations();
    }

    get isMobile() {
        return window.innerWidth < 480;
    }

    get HTML() {
        return `
            <div class="ug16__animation-holder show-non-mobile">
                <div class="ug16__anim ug16__anim--panels"></div>
                <div class="ug16__anim ug16__anim--skyline"></div>
                <div class="ug16__anim ug16__anim--bg"></div>
                <div class="ug16__anim ug16__anim--people"></div>
                <div class="ug16__anim ug16__anim--fg"></div>
            </div>
            <div class="static-image-holder show-mobile"></div>
            `;
    }

    get mobileHTML() {
        return ``;
    }

    peopleAnimation() {
        // height of people sprite 1350
        this.peopleRef = (this.peopleRef - 288) % 864;
        this.peopleAnimEl.style.backgroundPosition = `center ${this.peopleRef}px`;
    }

    startAnimation(fn, interval) {
        var raf = window.requestAnimationFrame || ( (fn) => window.setTimeout(fn, 1) );
        var animFn = raf.bind(window, fn);
        window.setInterval(animFn, interval)
    }

    startAnimations() {
        this.peopleRef = 0;
        this.startAnimation(this.peopleAnimation.bind(this), 150);
    }

}
